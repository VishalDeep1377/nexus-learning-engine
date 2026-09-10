'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import MarkdownMessage from './MarkdownMessage';

// ─── Quick-Start Prompts ───────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '🧠', label: 'Help me with DSA', prompt: 'I want to practice Data Structures & Algorithms. Where should I start and what topics should I focus on for placements?' },
  { icon: '💻', label: 'Review my code', prompt: 'Can you help me review and improve my code? I want to learn best practices.' },
  { icon: '🚀', label: 'Career roadmap', prompt: 'I need career guidance. Can you help me build a roadmap to land my first developer job?' },
  { icon: '🎯', label: 'Mock interview', prompt: 'Let\'s do a mock technical interview. Start with a medium-level LeetCode-style problem.' },
];

// ─── Typing Indicator Component ───────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* AI Avatar */}
      <div className="relative shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)' }}>
        <span className="text-xs font-bold text-white">Z</span>
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-full border border-[#0d1117]" />
      </div>
      {/* Dots */}
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-indigo-400"
            style={{ animation: `mentorBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MentorChat() {
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const {
    allChats,
    activeChat,
    isLoading,
    isSending,
    fetchAllChats,
    setActiveChat,
    createNewChat,
    sendMessage,
    deleteChat,
    renameChat,
  } = useChatStore();

  useEffect(() => { fetchAllChats(); }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + 'px';
    }
  }, [newMessage]);

  const handleSend = async (text?: string) => {
    const msg = text ?? newMessage;
    if (!msg.trim() || !activeChat || isSending) return;
    setNewMessage('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    await sendMessage(msg.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice input
  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setNewMessage(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening]);

  // Chat renaming
  const startRename = (chatId: string, currentName: string) => {
    setEditingChatId(chatId);
    setEditingName(currentName || 'New Chat');
  };
  const submitRename = async (chatId: string) => {
    if (editingName.trim()) await renameChat(chatId, editingName.trim());
    setEditingChatId(null);
  };

  const filteredChats = allChats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages?.some?.((m: any) => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const [hasSpeech, setHasSpeech] = useState(false);
  useEffect(() => {
    setHasSpeech(!!(typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)));
  }, []);

  return (
    <>
      {/* Keyframe injection */}
      <style>{`
        @keyframes mentorBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes mentorFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-animate { animation: mentorFadeUp 0.3s ease both; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .glass-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
        }
      `}</style>

      <div
        className="flex h-screen overflow-hidden relative"
        style={{ background: '#050508', fontFamily: "'Inter', sans-serif" }}
      >
        {/* Ambient background glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden mix-blend-screen z-0">
          <div style={{ position:"absolute", top:"20%", left:"10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", filter:"blur(80px)" }} />
          <div style={{ position:"absolute", bottom:"10%", right:"0%", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)", filter:"blur(80px)" }} />
        </div>

        {/* ===================== SIDEBAR ===================== */}
        <div className={`
          fixed md:relative z-40 h-full flex flex-col transition-transform duration-300 backdrop-blur-3xl
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
          style={{ width: '280px', background: 'rgba(10,10,15,0.7)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}>
                <span className="text-[15px] font-black text-white leading-none flex items-center justify-center pt-[2px]">Z</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-white tracking-tight">Zeno</p>
                <p className="text-[10px] text-gray-500 tracking-wide">AI MENTOR</p>
              </div>
            </div>
            <button
              onClick={createNewChat}
              title="New Chat"
              className="group flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:scale-105"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
            >
              <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pt-3 pb-2">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <svg className="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="flex-1 bg-transparent text-[13px] text-gray-300 placeholder-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-1">
            {isLoading && (
              <div className="flex flex-col gap-2 p-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            )}
            {!isLoading && filteredChats.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
                <div className="text-2xl">💬</div>
                <p className="text-[12px] text-gray-500">No chats yet.<br />Click + to start one.</p>
              </div>
            )}
            {filteredChats.map(chat => {
              const isActive = activeChat?._id === chat._id;
              return (
              <div
                key={chat._id}
                onClick={() => { setActiveChat(chat._id); setIsSidebarOpen(false); }}
                className={`group relative px-4 py-3 rounded-2xl mb-2 cursor-pointer transition-all duration-300 overflow-hidden ${
                  isActive
                    ? 'bg-white/10 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.2)]'
                    : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-pink-500 rounded-l-2xl shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                )}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Chat Icon */}
                    <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-gray-300'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    {/* Chat Name / Edit */}
                    {editingChatId === chat._id ? (
                      <input
                        autoFocus
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={() => submitRename(chat._id)}
                        onKeyDown={e => { if (e.key === 'Enter') submitRename(chat._id); if (e.key === 'Escape') setEditingChatId(null); }}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 bg-transparent text-[13px] font-semibold text-white outline-none border-b border-indigo-500 pb-0.5 min-w-0"
                      />
                    ) : (
                      <p className={`text-[13px] font-semibold truncate ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                        {chat.name || 'New Chat'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className={`flex items-center gap-1 shrink-0 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button
                      onClick={e => { e.stopPropagation(); startRename(chat._id, chat.name); }}
                      className="p-1.5 rounded-md hover:bg-white/15 text-gray-400 hover:text-white transition-colors"
                      title="Rename"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5Z" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); deleteChat(chat._id); }}
                      className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 truncate mt-1.5 ml-10">
                  {chat.messages?.length > 0
                    ? chat.messages[chat.messages.length - 1]?.content?.slice(0, 50) + '...'
                    : 'Start chatting with Zeno'}
                </p>
              </div>
            )})}
          </div>

          {/* Sidebar Footer */}
          <div className="px-3 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                U
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Powered by</p>
                <p className="text-[11px] font-semibold text-gray-300">Gemini 3.6 Flash</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* ===================== MAIN AREA ===================== */}
        <div className="flex-1 flex flex-col h-screen min-w-0 relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(5,5,8,0.4)', backdropFilter: 'blur(30px)' }}>
            {/* Mobile menu */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5 text-gray-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>

            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              {activeChat ? (
                <>
                  <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', boxShadow: '0 2px 10px rgba(99,102,241,0.3)' }}>
                    <span className="text-[13px] font-black text-white leading-none flex items-center justify-center pt-[1.5px]">Z</span>
                  </div>
                  <span className="text-[14px] font-semibold text-white truncate">
                    {activeChat.name || 'New Chat'}
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] text-emerald-400 font-medium"
                    style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </>
              ) : (
                <span className="text-[14px] font-semibold text-gray-400">Select or create a chat</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-[11px] px-2 py-1 rounded-lg text-indigo-400 font-mono"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                gemini-3.6-flash
              </span>
              <button
                onClick={createNewChat}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-indigo-300 hover:text-white transition-all duration-200"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                </svg>
                New Chat
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-4 relative bg-transparent" style={{ overflowAnchor: 'none' }}>
            {/* Empty state */}
            {!activeChat && (
              <div className="flex flex-col items-center justify-center h-full gap-6 max-w-xl mx-auto text-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl z-10 relative"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
                    <span className="text-4xl font-black text-white leading-none flex items-center justify-center pt-[2px]">Z</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#0a0d14] flex items-center justify-center z-20">
                    <span className="text-[8px] font-bold text-[#0a0d14]">✓</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Hey, I'm Zeno 👋</h2>
                  <p className="text-[14px] text-gray-500 leading-6">
                    Your personal AI coding mentor. Ask me anything — from DSA to career advice, system design, or code review.
                  </p>
                </div>
                <button
                  onClick={createNewChat}
                  className="px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-all duration-200 hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 4px 24px rgba(99,102,241,0.3)',
                  }}
                >
                  Start a New Chat →
                </button>
              </div>
            )}

            {/* Active chat empty + quick prompts */}
            {activeChat && activeChat.messages?.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-8 max-w-2xl mx-auto text-center px-4 mt-6">
                <div>
                  <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative group"
                    style={{ background: 'linear-gradient(135deg, rgba(30,30,40,0.6), rgba(15,15,20,0.6))', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(20px)', boxShadow:'0 20px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(99,102,241,0.15)' }}>
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <span className="text-[44px] font-black text-transparent bg-clip-text relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] leading-none flex items-center justify-center pt-[2px]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff, #a5b4fc)' }}>Z</span>
                  </div>
                  <h3 className="text-4xl font-black text-transparent bg-clip-text mb-3 drop-shadow-xl" style={{ backgroundImage: 'linear-gradient(to right, #ffffff, #a5b4fc, #67e8f9)' }}>What do you want to learn today?</h3>
                  <p className="text-[14px] font-medium text-indigo-200/60 uppercase tracking-widest drop-shadow-sm">Pick a quick start or type your own question below.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  {QUICK_PROMPTS.map((qp, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(qp.prompt)}
                      className="group flex flex-col items-start gap-4 p-6 rounded-[2rem] text-left transition-all duration-300 hover:scale-[1.02] relative overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderTop: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 10px 30px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/30 transition-all duration-300 shadow-lg">
                        <span className="text-2xl drop-shadow-md transition-transform group-hover:scale-110">{qp.icon}</span>
                      </div>
                      <span className="relative z-10 text-[15px] font-bold tracking-wide text-gray-300 group-hover:text-white transition-colors">{qp.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {activeChat && activeChat.messages?.length > 0 && (
              <div className="max-w-3xl mx-auto space-y-1">
                {activeChat.messages.map((message: any, index: number) => {
                  const isUser = message.senderId === 'user' || (message.senderId && message.senderId !== 'gemini' && message.senderId !== '');
                  // Hide empty streaming bubble to avoid duplicate avatars with TypingIndicator
                  if (message.isStreaming && !message.content) return null;
                  return (
                    <div
                      key={index}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2.5 mb-4 ${message.isStreaming ? '' : 'msg-animate'}`}
                    >
                      {/* AI Avatar */}
                      {!isUser && (
                        <div className="shrink-0 w-10 h-10 rounded-[1.25rem] flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)' }}>
                          <span className="text-[15px] font-black text-white">Z</span>
                        </div>
                      )}

                      <div className={`group relative max-w-[78%] ${isUser ? 'max-w-[65%]' : ''}`}>
                        {isUser ? (
                          /* User bubble */
                          <div className="px-5 py-4 rounded-3xl rounded-br-sm text-[15px] text-white leading-relaxed font-medium shadow-[0_8px_24px_rgba(99,102,241,0.25)]"
                            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', wordBreak: 'break-word', border: '1px solid rgba(255,255,255,0.1)' }}>
                            {message.content}
                          </div>
                        ) : (
                          /* AI bubble */
                          <div className="px-6 py-5 rounded-3xl rounded-bl-sm shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
                            style={{ background: 'rgba(20,20,30,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderTop: '1px solid rgba(255,255,255,0.15)', wordBreak: 'break-word' }}>
                            <MarkdownMessage content={message.content} />
                          </div>
                        )}

                        {/* Timestamp on hover */}
                        {message.createdAt && (
                          <p className="absolute -bottom-5 text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ [isUser ? 'right' : 'left']: 0 }}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}

                        {/* Copy button on AI messages */}
                        {!isUser && (
                          <button
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="absolute -top-2 right-2 hidden group-hover:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-gray-400 hover:text-white transition-all"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            Copy
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isSending && (!activeChat.messages[activeChat.messages.length - 1]?.content || activeChat.messages[activeChat.messages.length - 1]?.content === "") && <TypingIndicator />}
                <div ref={chatEndRef} className="h-4" />
              </div>
            )}
          </div>

          {/* ===================== INPUT BAR ===================== */}
          <div className="shrink-0 px-4 py-6 relative z-20" style={{ background: 'linear-gradient(0deg, #050508 60%, transparent 100%)' }}>
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3 rounded-[2rem] px-5 py-4 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.6)] focus-within:shadow-[0_10px_40px_rgba(99,102,241,0.2)] focus-within:border-indigo-500/50"
                style={{ background: 'linear-gradient(180deg, rgba(30,30,40,0.8) 0%, rgba(15,15,25,0.8) 100%)', backdropFilter: 'blur(30px)', border: '1px solid rgba(255,255,255,0.1)', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeChat ? 'Ask Zeno anything... (Enter to send, Shift+Enter for newline)' : 'Select a chat to start'}
                  disabled={!activeChat || isSending}
                  rows={1}
                  className="flex-1 bg-transparent text-[15px] font-medium text-white placeholder-gray-500 outline-none resize-none leading-7 max-h-[180px] scrollbar-thin py-1.5"
                  style={{ fontFamily: 'inherit' }}
                />

                <div className="flex items-center gap-2 shrink-0 pb-0.5">
                  {/* Voice input */}
                  {hasSpeech && (
                    <button
                      onClick={toggleVoice}
                      title={isListening ? 'Stop listening' : 'Voice input'}
                      className="p-2 rounded-xl transition-all duration-200"
                      style={{
                        background: isListening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isListening ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      }}
                    >
                      <svg className={`w-4 h-4 ${isListening ? 'text-red-400 animate-pulse' : 'text-gray-500 hover:text-gray-300'}`}
                        fill={isListening ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}

                  {/* Send button */}
                  <button
                    onClick={() => handleSend()}
                    disabled={!activeChat || !newMessage.trim() || isSending}
                    className="p-3.5 rounded-2xl transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                      boxShadow: newMessage.trim() ? '0 10px 30px rgba(236,72,153,0.4), inset 0 2px 0 rgba(255,255,255,0.2)' : 'none',
                    }}
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-center text-[10px] text-gray-700 mt-2">
                Zeno can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
