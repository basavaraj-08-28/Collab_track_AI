import React, { useState, useEffect, useRef } from 'react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../../components/common/UserAvatar';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { useToast } from '../../context/ToastContext';
import { MessageSquare, Send, Paperclip, Users, FileText, ChevronDown, Sparkles } from 'lucide-react';

export const MessagesDiscussionPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectData, setProjectData] = useState(null); // { project, members, messages, stats }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch list of user's available discussion projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const projList = await studentService.getDiscussionProjects();
        setProjects(Array.isArray(projList) ? projList : []);
        if (projList && projList.length > 0) {
          setSelectedProjectId(projList[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.message || 'Unable to load project discussions.');
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch project discussion (messages & active members)
  const fetchProjectDiscussion = async (projId, isSilent = false) => {
    if (!projId) return;
    if (!isSilent) setLoading(true);
    try {
      const data = await studentService.getProjectDiscussion(projId);
      setProjectData(data);
      if (!isSilent) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      if (!isSilent) {
        setError(err.message || 'Unable to load discussion details.');
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDiscussion(selectedProjectId, false);
    }
  }, [selectedProjectId]);

  // Real-time polling every 3 seconds for silent updates
  useEffect(() => {
    if (!selectedProjectId) return;
    const interval = setInterval(() => {
      fetchProjectDiscussion(selectedProjectId, true);
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedProjectId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) return;
    if (!selectedProjectId) {
      addToast('No active project selected for discussion.', 'error');
      return;
    }

    let attachmentUrl = null;
    let finalContent = inputText.trim();

    if (attachedFile) {
      attachmentUrl = attachedFile.name;
      if (!finalContent) {
        finalContent = `Attachment: ${attachedFile.name}`;
      }
    }

    try {
      const newMsg = await studentService.postProjectMessage(selectedProjectId, finalContent, attachmentUrl);
      setProjectData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...(prev.messages || []), newMsg]
        };
      });
      setInputText('');
      setAttachedFile(null);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      addToast(err.message || 'Failed to post message.', 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      addToast(`Attached "${file.name}" to message.`, 'info');
    }
  };

  if (loading && !projectData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
        <SkeletonLoader count={4} height="h-20" />
      </div>
    );
  }

  if (error && !projectData) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <ErrorState title="Unable to load discussions" message={error} onRetry={() => fetchProjectDiscussion(selectedProjectId)} />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4">
        <EmptyState
          icon={MessageSquare}
          title="No Course Projects Assigned"
          message="You must be assigned to a course project to participate in discussions."
        />
      </div>
    );
  }

  const project = projectData?.project || projects.find((p) => p.id === selectedProjectId);
  const members = projectData?.members || [];
  const messages = projectData?.messages || [];
  const stats = projectData?.stats || { totalMembers: members.length, onlineMembers: members.filter((m) => m.isOnline).length };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs h-full flex overflow-hidden">
        {/* Left Active Members Panel */}
        <div className="w-72 bg-slate-50 border-r border-slate-200/80 p-4 hidden md:flex flex-col justify-between shrink-0">
          <div className="space-y-4 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  Active Members
                </h3>
              </div>

              {members.length === 0 ? (
                <p className="text-xs text-slate-400 p-2 italic">
                  No students enrolled in this project yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/70 border border-slate-200/60 shadow-2xs hover:bg-white transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <UserAvatar name={member.name} size="sm" />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              member.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={member.isOnline ? 'Online' : 'Offline'}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {member.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate">
                            {member.role}
                          </span>
                        </div>
                      </div>

                      <Badge variant={member.role === 'Instructor' ? 'primary' : 'default'}>
                        {member.role === 'Instructor' ? 'Faculty' : 'Student'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Members Footer Counter */}
          <div className="pt-3 border-t border-slate-200 text-center">
            <span className="text-[11px] font-extrabold text-slate-600">
              {stats.totalMembers} Member{stats.totalMembers === 1 ? '' : 's'} • {stats.onlineMembers} Online
            </span>
          </div>
        </div>

        {/* Right Main Project Discussion Area */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Project Discussion</h3>
                  {projects.length > 1 && (
                    <div className="relative">
                      <select
                        value={selectedProjectId || ''}
                        onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                        className="p-1 bg-slate-100 text-xs font-bold text-indigo-700 rounded-lg border border-slate-200 focus:outline-none cursor-pointer"
                      >
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <p className="text-xs font-semibold text-indigo-600 truncate">
                  {project?.name || 'Course Project'}
                  <span className="text-slate-400 font-normal ml-2 hidden sm:inline">
                    — All project members can discuss and collaborate here.
                  </span>
                </p>
              </div>
            </div>

            <Badge variant="blue">Project Discussion</Badge>
          </div>

          {/* Messages Stream / Empty State */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  icon={MessageSquare}
                  title="No messages yet."
                  message="Start collaborating with your project team."
                />
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3.5 group">
                  <UserAvatar name={msg.senderName || 'Member'} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold text-slate-900">{msg.senderName}</span>
                      <Badge variant={msg.senderRole === 'Instructor' ? 'primary' : 'default'}>
                        {msg.senderRole}
                      </Badge>
                      <span className="text-[10px] font-semibold text-slate-400 ml-auto sm:ml-0">
                        {msg.timestamp}
                      </span>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-xs text-slate-800 leading-relaxed max-w-2xl">
                      {msg.content}

                      {msg.attachmentUrl && (
                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-[11px] text-indigo-600 font-bold">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Attachment: {msg.attachmentUrl}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview if any */}
          {attachedFile && (
            <div className="px-6 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-700 font-semibold shrink-0">
              <span className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" /> Attached: {attachedFile.name}
              </span>
              <button
                type="button"
                onClick={() => setAttachedFile(null)}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Remove
              </button>
            </div>
          )}

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0">
            <label
              className="p-2.5 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
              <input type="file" onChange={handleFileChange} className="hidden" />
            </label>

            <input
              type="text"
              placeholder="Type a message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
            />

            <button
              type="submit"
              disabled={!inputText.trim() && !attachedFile}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MessagesDiscussionPage;
