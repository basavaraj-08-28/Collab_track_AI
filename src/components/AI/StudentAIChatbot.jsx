import React, { useState, useEffect, useRef } from 'react';
import { studentService } from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  Send,
  X,
  RefreshCw,
  AlertCircle,
  Brain,
  Zap,
  Globe,
  MessageSquare
} from 'lucide-react';

export const StudentAIChatbot = () => {
  const { role, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize Welcome Message with Gemini branding
  useEffect(() => {
    if (role === 'student' && user) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: `Hello ${user.name || 'there'}! 👋 I'm **Gemini AI Assistant** for Collab Track AI.\n\nI can assist you with your academic projects, assigned tasks, deadlines, completion rates, and collaboration data — or answer any general science, coding, and engineering questions!\n\nWhat can I help you with today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [role, user]);

  // Auto-scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadBadge(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  // Do not render for non-students
  if (role !== 'student') {
    return null;
  }

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text || !text.trim() || loading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: userTime
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await studentService.chatWithAI(text.trim());
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.response || "I'm sorry, Gemini couldn't generate a response right now. Please try again.",
        timestamp: aiTime
      };

      setMessages((prev) => [...prev, aiMsg]);
      if (!isOpen) setUnreadBadge(true);
    } catch (err) {
      const errTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const errorMsg = {
        id: `error-${Date.now()}`,
        sender: 'ai',
        text: err.message || "I'm having trouble connecting to Gemini AI right now. Please try again.",
        timestamp: errTime,
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chatbot Button with Gemini Styling */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <button
            id="open-ai-chatbot-btn"
            onClick={() => setIsOpen(true)}
            className="group relative px-4.5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white rounded-2xl shadow-2xl shadow-blue-500/30 border border-blue-400/40 flex items-center gap-3 transition-all duration-300 transform hover:scale-105 active:scale-95"
            aria-label="Open Gemini AI Assistant"
          >
            <div className="relative flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-cyan-300 animate-pulse" />
              {unreadBadge && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 border-2 border-slate-900 rounded-full animate-ping" />
              )}
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs font-black tracking-wide bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent flex items-center gap-1">
                Gemini AI
              </div>
              <div className="text-[10px] text-blue-200/80 font-medium">Project Assistant</div>
            </div>
          </button>
        )}
      </div>

      {/* Chatbot Window / Panel - Gemini Dark Aesthetic */}
      {isOpen && (
        <div
          id="ai-chatbot-panel"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-sm sm:w-[450px] h-[85vh] max-h-[640px] bg-slate-950 text-slate-100 rounded-3xl shadow-2xl border border-blue-500/30 flex flex-col overflow-hidden backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
        >
          {/* Gemini Styled Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl ring-1 ring-cyan-400/40 text-white shadow-md">
                <Sparkles className="w-5 h-5 text-cyan-200" />
                <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                    Gemini AI Assistant
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-[9.5px] font-extrabold uppercase tracking-wider">
                    Model 1.5
                  </span>
                </h3>
                <p className="text-[11px] font-medium text-slate-400">Collab Track Smart Academic Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
                title="Close chatbot"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conversation Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs leading-relaxed custom-scrollbar bg-slate-950/90">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-3">
                <div
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-line shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white rounded-tr-none font-medium'
                        : msg.isError
                        ? 'bg-rose-950/60 border border-rose-800/60 text-rose-200 rounded-tl-none'
                        : 'bg-slate-900/90 border border-slate-800/80 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    {msg.isError && (
                      <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                        <AlertCircle className="w-4 h-4" /> Connection Notice
                      </div>
                    )}
                    <p className="text-[12.5px] leading-relaxed">{msg.text}</p>
                    <span
                      className={`block text-[10px] mt-1.5 text-right font-medium ${
                        msg.sender === 'user' ? 'text-blue-200/80' : 'text-slate-500'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-3 justify-start items-center text-slate-400">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-200 animate-spin" />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
                  <span className="text-[11px] font-medium text-cyan-300">Gemini is thinking...</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Gemini Input Footer */}
          <div className="p-3.5 bg-slate-950 border-t border-slate-800/80 shrink-0">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 focus-within:border-blue-500/80 rounded-2xl px-3.5 py-2.5 transition-all shadow-inner">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Gemini anything..."
                disabled={loading}
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none disabled:opacity-50"
              />

              <button
                id="send-ai-chatbot-msg-btn"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage || !inputMessage.trim() || loading}
                className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-800 disabled:to-slate-800 text-white disabled:text-slate-600 rounded-xl transition-all shadow-md shrink-0"
                title="Send Message to Gemini"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentAIChatbot;
