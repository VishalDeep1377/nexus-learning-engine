'use client'
import React, { FormEvent, useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useCommunityStore } from '@/store/communityStore';
import CommunityPost from '@/components/CommunityPost';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiSearch, FiZap, FiTrendingUp, FiClock, FiCheckCircle, FiMessageSquare } from 'react-icons/fi';
import LoadingSkeleton from '@/components/Skeleton/LoadingSkeleton';

type SortMode = 'recent' | 'starred' | 'resolved';

function LearnersCommunity() {
  const { userData } = useUserStore();
  const { posts, isLoading, error, fetchPosts, createPost } = useCommunityStore();
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', tags: [] as string[] });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePopup = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setFormData({ title: '', description: '', tags: [] });
      setTagInput('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    try {
      await createPost({
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        userId: userData?._id || '',
      });
      toast.success('Post created successfully! 🚀');
      handlePopup();
    } catch {
      toast.error('Failed to create post');
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTagInput(val);
    const tags = val.split(',').map(t => t.trim()).filter(t => t);
    setFormData(prev => ({ ...prev, tags }));
  };

  // Filter + sort
  const filteredPosts = posts
    .filter(post => {
      const q = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.tags.some(tag => tag.toLowerCase().includes(q)) ||
        (typeof post.user !== 'string' && post.user.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortMode === 'starred') {
        const aStars = a.votes.filter(v => v.voteType === 'up').length;
        const bStars = b.votes.filter(v => v.voteType === 'up').length;
        return bStars - aStars;
      }
      if (sortMode === 'resolved') {
        return (b.status === 'resolved' ? 1 : 0) - (a.status === 'resolved' ? 1 : 0);
      }
      // recent
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (isLoading && posts.length === 0) {
    return <LoadingSkeleton />;
  }

  const sortTabs: { key: SortMode; label: string; icon: React.ReactNode }[] = [
    { key: 'recent',   label: 'Recent',   icon: <FiClock size={13} /> },
    { key: 'starred',  label: 'Top Starred', icon: <FiTrendingUp size={13} /> },
    { key: 'resolved', label: 'Resolved', icon: <FiCheckCircle size={13} /> },
  ];

  return (
    <>
      <style jsx global>{`
        .community-bg {
          background:
            radial-gradient(ellipse 80% 40% at 50% -10%, rgba(99,102,241,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 30% at 80% 80%, rgba(139,92,246,0.05) 0%, transparent 50%),
            #0a0d14;
          min-height: 100vh;
        }
        .hero-title {
          background: linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 40%, #818cf8 70%, #c084fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .search-bar {
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(99,102,241,0.2);
          backdrop-filter: blur(12px);
          transition: all 0.25s ease;
        }
        .search-bar:focus-within {
          border-color: rgba(139,92,246,0.5);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1), 0 0 30px rgba(139,92,246,0.06);
        }
        .sort-tab {
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .sort-tab.active {
          background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15));
          border-color: rgba(139,92,246,0.35);
          color: #a5b4fc;
        }
        .sort-tab:not(.active) {
          color: #6b7280;
        }
        .sort-tab:not(.active):hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
          color: #9ca3af;
        }
        .fab-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
        }
        .fab-btn:hover {
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
          box-shadow: 0 8px 30px rgba(139,92,246,0.5);
          transform: scale(1.08) rotate(90deg);
        }
        .fab-btn.active {
          transform: scale(1.08) rotate(45deg);
        }
        .modal-overlay {
          animation: overlayIn 0.2s ease;
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .modal-panel {
          animation: modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.93) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(99,102,241,0.2);
          color: #e5e7eb;
          transition: all 0.2s ease;
        }
        .modal-input:focus {
          border-color: rgba(139,92,246,0.5);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.08);
          outline: none;
        }
        .modal-input::placeholder {
          color: #4b5563;
        }
        .post-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          transition: all 0.2s ease;
        }
        .post-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
          box-shadow: 0 0 20px rgba(139,92,246,0.35);
          transform: translateY(-1px);
        }
        .stats-pill {
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.15);
        }
      `}</style>

      <div className="community-bg w-full flex flex-col items-center p-3 sm:p-6 lg:p-8 pb-20 lg:pb-10">
        <div className="w-full max-w-3xl">

          {/* ── Hero Header ── */}
          <div className="text-center mb-8 sm:mb-10 pt-4">
            <div className="inline-flex items-center gap-2 stats-pill px-3 py-1.5 rounded-full text-xs text-indigo-400 mb-4 font-medium">
              <FiZap size={12} className="text-amber-400" />
              {posts.length} Discussion{posts.length !== 1 ? 's' : ''} · {posts.filter(p => p.status === 'resolved').length} Resolved
            </div>
            <h1 className="hero-title text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 tracking-tight leading-tight">
              Learners Community
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Ask questions, share knowledge, and grow together with fellow developers.
            </p>

            {/* Search Bar */}
            <div className="search-bar relative max-w-lg mx-auto rounded-xl mt-6 flex items-center">
              <FiSearch className="absolute left-4 text-gray-500 pointer-events-none" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts, tags, or users…"
                className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-gray-600 hover:text-gray-300 transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Sort Tabs ── */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {sortTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setSortMode(tab.key)}
                className={`sort-tab flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${sortMode === tab.key ? 'active' : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <div className="ml-auto text-xs text-gray-600 whitespace-nowrap">
              {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* ── Posts List ── */}
          <div className="space-y-4">
            {error && (
              <div className="text-center text-red-400 py-4 text-sm bg-red-500/10 border border-red-500/20 rounded-xl">
                {error}
              </div>
            )}

            {posts.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <FiMessageSquare size={24} className="text-indigo-500" />
                </div>
                <p className="text-gray-500 text-sm">No posts yet. Be the first to start a discussion!</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-sm">No results for <span className="text-gray-300">"{searchQuery}"</span></p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <CommunityPost key={post._id} post={post} />
              ))
            )}
          </div>
        </div>

        {/* ── Floating Action Button ── */}
        <button
          className={`fab-btn fixed bottom-16 lg:bottom-8 right-5 sm:right-8 text-white rounded-full p-4 shadow-2xl focus:outline-none z-10 ${isVisible ? 'active' : ''}`}
          onClick={handlePopup}
          aria-label="Create new post"
          title="Create new post"
        >
          <FiPlus size={22} />
        </button>

        {/* ── Create Post Modal ── */}
        {isVisible && (
          <div className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="modal-panel bg-gray-950 border border-indigo-500/20 rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 sm:p-7">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Start a Discussion</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Share a question, idea, or insight</p>
                  </div>
                  <button
                    onClick={handlePopup}
                    className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all"
                    aria-label="Close dialog"
                  >
                    <FiX size={18} />
                  </button>
                </div>

                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Title
                    </label>
                    <input
                      id="title"
                      type="text"
                      name="title"
                      placeholder="What's your question or topic?"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="modal-input w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      placeholder="Provide details, context, or your current understanding…"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className="modal-input w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
                      Tags <span className="text-gray-600 normal-case">(comma separated)</span>
                    </label>
                    <input
                      id="tags"
                      type="text"
                      name="tags"
                      placeholder="e.g. react, typescript, career"
                      value={tagInput}
                      onChange={handleTagsChange}
                      className="modal-input w-full px-4 py-2.5 rounded-xl text-sm"
                    />
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handlePopup}
                      className="px-5 py-2 text-sm text-gray-400 hover:text-gray-200 rounded-xl border border-white/8 hover:border-white/15 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="post-btn px-6 py-2 text-sm font-medium text-white rounded-xl"
                    >
                      Post Discussion
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default LearnersCommunity;
