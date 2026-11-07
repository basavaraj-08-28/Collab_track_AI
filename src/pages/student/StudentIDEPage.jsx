import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { studentService } from '../../services/studentService';
import {
  SUPPORTED_LANGUAGES,
  executeBackendCode,
  buildWebPreviewDoc
} from '../../services/codeExecutionService';
import {
  Play,
  RotateCcw,
  Sparkles,
  Save,
  Download,
  FileCode,
  FolderOpen,
  Plus,
  Trash2,
  Terminal as TerminalIcon,
  Globe,
  Smartphone,
  Monitor,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  ChevronDown
} from 'lucide-react';

export const StudentIDEPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  // Selected language & active project
  const [selectedLangId, setSelectedLangId] = useState('web');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  
  // File state
  const [files, setFiles] = useState({});
  const [activeFileName, setActiveFileName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);

  // Execution & Output state
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [stdinInput, setStdinInput] = useState('');
  const [outputStatus, setOutputStatus] = useState(null); // 'success', 'error', null
  const [activeOutputTab, setActiveOutputTab] = useState('preview'); // 'preview', 'terminal', 'console'
  const [previewViewport, setPreviewViewport] = useState('desktop'); // 'desktop', 'mobile'
  const [webPreviewKey, setWebPreviewKey] = useState(0);

  // AI Assistant Drawer
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  // Fetch student's assigned projects for context
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await studentService.getProjects();
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data);
          setSelectedProjectId(String(data[0].id));
        }
      } catch (err) {
        console.error('Failed to load projects for IDE:', err);
      }
    };
    loadProjects();
  }, []);

  // Current language config
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.id === selectedLangId) || SUPPORTED_LANGUAGES[0];

  // Initialize or load files when language or project changes
  useEffect(() => {
    const storageKey = `collab_ide_${user?.id || 'anon'}_${selectedProjectId || 'default'}_${selectedLangId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFiles(parsed);
        setActiveFileName(Object.keys(parsed)[0] || '');
        return;
      } catch (e) {
        // fallback
      }
    }
    // Set default files for this language
    const defaults = { ...currentLang.defaultFiles };
    setFiles(defaults);
    setActiveFileName(Object.keys(defaults)[0] || '');
    if (currentLang.category === 'web') {
      setActiveOutputTab('preview');
    } else {
      setActiveOutputTab('terminal');
    }
  }, [selectedLangId, selectedProjectId, user?.id]);

  // Handle messages from Sandboxed Web iframe
  useEffect(() => {
    const handleIframeMessage = (event) => {
      if (event.data && event.data.type === 'IDE_CONSOLE') {
        const line = `[Browser ${event.data.level.toUpperCase()}]: ${event.data.message}\n`;
        setTerminalOutput((prev) => prev + line);
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  // Save current workspace to localStorage
  const handleSave = () => {
    const storageKey = `collab_ide_${user?.id || 'anon'}_${selectedProjectId || 'default'}_${selectedLangId}`;
    localStorage.setItem(storageKey, JSON.stringify(files));
    addToast('Workspace files saved locally!', 'success');
  };

  // Run Code
  const handleRun = async () => {
    setIsRunning(true);
    setOutputStatus(null);

    if (currentLang.category === 'web') {
      // Trigger iframe refresh
      setWebPreviewKey((k) => k + 1);
      setActiveOutputTab('preview');
      setTerminalOutput(`[${new Date().toLocaleTimeString()}] Web Application reloaded.\n`);
      setIsRunning(false);
      setOutputStatus('success');
      return;
    }

    // Backend Execution via Piston
    setActiveOutputTab('terminal');
    setTerminalOutput(`[${new Date().toLocaleTimeString()}] Compiling & executing ${currentLang.name}...\n`);

    try {
      const res = await executeBackendCode(currentLang.id, files, stdinInput);
      setTerminalOutput(res.output);
      setOutputStatus(res.isError ? 'error' : 'success');
    } catch (err) {
      setTerminalOutput(`[Execution Error]: ${err.message || 'Unable to execute code.'}`);
      setOutputStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  // AI Helper: Explain / Debug with Gemini Assistant
  const handleAskAI = async (mode = 'explain') => {
    setAiPanelOpen(true);
    setAiLoading(true);
    setAiResponse('');

    const activeCode = files[activeFileName] || '';
    let prompt = '';

    if (mode === 'debug') {
      prompt = `I am getting an error while running my ${currentLang.name} code.\n\nCode:\n\`\`\`${currentLang.monacoLang}\n${activeCode}\n\`\`\`\n\nTerminal Output / Error:\n${terminalOutput}\n\nPlease identify why this error happened and give me the exact corrected code snippet with a simple explanation.`;
    } else {
      prompt = `Please review and explain my ${currentLang.name} code for our student group project:\n\n\`\`\`${currentLang.monacoLang}\n${activeCode}\n\`\`\`\n\nHighlight strengths, potential bugs, and suggest 1-2 improvements.`;
    }

    try {
      const res = await studentService.chatWithAI(prompt, selectedProjectId ? Number(selectedProjectId) : null);
      setAiResponse(res.response || res.message || 'No AI response received.');
    } catch (err) {
      setAiResponse(`Failed to contact AI Assistant: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Download project as files
  const handleDownloadZip = () => {
    const content = files[activeFileName] || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFileName || 'project_file.txt';
    link.click();
    URL.revokeObjectURL(url);
    addToast(`Downloaded ${activeFileName}`, 'success');
  };

  // Add new file
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const cleanName = newFileName.trim();
    if (files[cleanName]) {
      addToast('File already exists.', 'warning');
      return;
    }
    setFiles((prev) => ({ ...prev, [cleanName]: '' }));
    setActiveFileName(cleanName);
    setNewFileName('');
    setShowNewFileInput(false);
  };

  // Delete file
  const handleDeleteFile = (fileName) => {
    if (Object.keys(files).length <= 1) {
      addToast('Cannot delete the only file in workspace.', 'warning');
      return;
    }
    const updated = { ...files };
    delete updated[fileName];
    setFiles(updated);
    setActiveFileName(Object.keys(updated)[0]);
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset all files in this workspace to template defaults?')) {
      setFiles({ ...currentLang.defaultFiles });
      setActiveFileName(Object.keys(currentLang.defaultFiles)[0]);
      setTerminalOutput('');
      addToast('Workspace reset to template.', 'info');
    }
  };

  const previewDoc = currentLang.category === 'web' ? buildWebPreviewDoc(files) : '';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <FileCode className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              Code Studio & AI Workspace
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live IDE
              </span>
            </h1>
            <span className="text-[10px] text-slate-400">
              {projects.find((p) => String(p.id) === selectedProjectId)?.name || 'Personal Workspace'}
            </span>
          </div>
        </div>

        {/* Center Controls: Project & Language Selectors */}
        <div className="flex items-center gap-2">
          {/* Project Association */}
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-800 text-xs text-slate-200 border border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title="Linked Project"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>
          )}

          {/* Language Selector */}
          <select
            value={selectedLangId}
            onChange={(e) => setSelectedLangId(e.target.value)}
            className="bg-slate-800 font-bold text-xs text-indigo-300 border border-indigo-500/40 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/40 transition-all flex items-center gap-1.5"
            title="Execute Code (Ctrl + Enter)"
          >
            {isRunning ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{currentLang.category === 'web' ? 'Update Preview' : 'Run'}</span>
          </button>

          <button
            onClick={() => handleAskAI('explain')}
            className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="AI Code Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          <button
            onClick={handleSave}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Save Workspace Files"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadZip}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Download Current File"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetDefaults}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            title="Reset Template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: File Explorer */}
        <aside className="w-48 sm:w-56 bg-slate-900/80 border-r border-slate-800/80 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              Files
            </span>
            <button
              onClick={() => setShowNewFileInput((v) => !v)}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Add New File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New File Inline Input */}
          {showNewFileInput && (
            <div className="p-2 border-b border-slate-800 bg-slate-950">
              <input
                type="text"
                placeholder="e.g. helper.py"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                className="w-full bg-slate-900 border border-indigo-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-1 mt-1">
                <button
                  onClick={() => setShowNewFileInput(false)}
                  className="text-[10px] text-slate-400 hover:text-white px-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFile}
                  className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* File List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {Object.keys(files).map((name) => {
              const isActive = activeFileName === name;
              return (
                <div
                  key={name}
                  onClick={() => setActiveFileName(name)}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="truncate">{name}</span>
                  </div>
                  {Object.keys(files).length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                      title="Delete File"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Info pill at bottom of files */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 text-[10px] text-slate-500">
            <span>Mode: </span>
            <span className="font-bold text-slate-300 capitalize">{currentLang.category}</span>
          </div>
        </aside>

        {/* Center: Monaco Editor */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
          {/* Active Tab Bar */}
          <div className="h-9 bg-slate-900/50 border-b border-slate-800/80 flex items-center px-2 gap-1 overflow-x-auto">
            {Object.keys(files).map((name) => (
              <button
                key={name}
                onClick={() => setActiveFileName(name)}
                className={`px-3 py-1 text-xs font-mono rounded-t-lg transition-colors border-t-2 ${
                  activeFileName === name
                    ? 'bg-slate-950 text-indigo-400 border-indigo-500 font-bold'
                    : 'text-slate-500 hover:text-slate-300 border-transparent'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Editor Container */}
          <div className="flex-1 relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language={
                activeFileName.endsWith('.html')
                  ? 'html'
                  : activeFileName.endsWith('.css')
                  ? 'css'
                  : activeFileName.endsWith('.js')
                  ? 'javascript'
                  : currentLang.monacoLang
              }
              value={files[activeFileName] || ''}
              onChange={(value) => {
                setFiles((prev) => ({
                  ...prev,
                  [activeFileName]: value || ''
                }));
              }}
              options={{
                fontSize: 13,
                fontFamily: 'Fira Code, Menlo, Monaco, Consolas, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on'
              }}
            />
          </div>
        </main>

        {/* Right / Split Panel: Output View (Web Preview or Terminal Console) */}
        <aside className="w-full md:w-[45%] lg:w-[48%] border-l border-slate-800 flex flex-col bg-slate-900/90 shrink-0">
          {/* Panel Header Tabs */}
          <div className="h-9 bg-slate-900 border-b border-slate-800 px-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {currentLang.category === 'web' && (
                <button
                  onClick={() => setActiveOutputTab('preview')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-colors ${
                    activeOutputTab === 'preview'
                      ? 'bg-indigo-600/20 text-indigo-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Live Preview</span>
                </button>
              )}

              <button
                onClick={() => setActiveOutputTab('terminal')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition-colors ${
                  activeOutputTab === 'terminal'
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TerminalIcon className="w-3.5 h-3.5" />
                <span>Console Output</span>
                {outputStatus === 'error' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                {outputStatus === 'success' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Viewport controls for Web Preview */}
            {currentLang.category === 'web' && activeOutputTab === 'preview' && (
              <div className="flex items-center gap-1 text-slate-400">
                <button
                  onClick={() => setPreviewViewport('desktop')}
                  className={`p-1 rounded hover:text-white ${previewViewport === 'desktop' ? 'text-indigo-400' : ''}`}
                  title="Desktop View"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPreviewViewport('mobile')}
                  className={`p-1 rounded hover:text-white ${previewViewport === 'mobile' ? 'text-indigo-400' : ''}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Panel Content */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {/* Live Web Preview Mode */}
            {currentLang.category === 'web' && activeOutputTab === 'preview' ? (
              <div className="flex-1 flex items-center justify-center p-3 bg-slate-950/80 overflow-auto">
                <div
                  className={`bg-white rounded-xl shadow-2xl transition-all overflow-hidden border border-slate-700/60 ${
                    previewViewport === 'mobile' ? 'w-[375px] h-[667px]' : 'w-full h-full'
                  }`}
                >
                  <iframe
                    key={webPreviewKey}
                    title="Live Web Preview"
                    srcDoc={previewDoc}
                    sandbox="allow-scripts allow-modals"
                    className="w-full h-full border-none"
                  />
                </div>
              </div>
            ) : (
              /* Terminal / Console Mode */
              <div className="flex-1 flex flex-col font-mono text-xs overflow-hidden">
                {/* Console Log Area */}
                <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-300 whitespace-pre-wrap select-text selection:bg-indigo-500 selection:text-white">
                  {terminalOutput ? (
                    <div>{terminalOutput}</div>
                  ) : (
                    <div className="text-slate-600 italic select-none">
                      Press &quot;Run&quot; above to compile and execute your code...
                    </div>
                  )}
                </div>

                {/* Stdin user input for interactive console programs */}
                {currentLang.category !== 'web' && (
                  <div className="p-2 border-t border-slate-800/80 bg-slate-900/60 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Stdin:</span>
                    <input
                      type="text"
                      placeholder="Optional inputs passed to program (e.g. 42 test)"
                      value={stdinInput}
                      onChange={(e) => setStdinInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}

                {/* Terminal Footer with Fix with AI action */}
                <div className="px-3 py-2 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTerminalOutput('')}
                      className="hover:text-slate-200"
                    >
                      Clear
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(terminalOutput);
                        addToast('Terminal output copied.', 'info');
                      }}
                      className="hover:text-slate-200"
                    >
                      Copy Output
                    </button>
                  </div>

                  {outputStatus === 'error' && (
                    <button
                      onClick={() => handleAskAI('debug')}
                      className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-bold transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>✨ Fix Error with AI</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* AI Assistant Side Drawer */}
        {aiPanelOpen && (
          <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-slate-900 border-l border-indigo-500/30 shadow-2xl z-20 flex flex-col">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Gemini Code Assistant</span>
              </div>
              <button
                onClick={() => setAiPanelOpen(false)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto text-xs space-y-3 leading-relaxed text-slate-300">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-3 text-slate-400">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing code with Gemini AI...</span>
                </div>
              ) : aiResponse ? (
                <div className="whitespace-pre-wrap">{aiResponse}</div>
              ) : (
                <p className="text-slate-500 italic">
                  Ask AI to review, explain, or suggest improvements to your team&apos;s project code.
                </p>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex gap-2">
              <button
                onClick={() => handleAskAI('explain')}
                disabled={aiLoading}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                Explain Code
              </button>
              <button
                onClick={() => handleAskAI('debug')}
                disabled={aiLoading}
                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
              >
                Debug Error
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentIDEPage;

