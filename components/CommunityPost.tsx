'use client';
import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useCommunityStore } from '@/store/communityStore';
import { FiStar, FiMessageSquare, FiShare2, FiCheck, FiTrash2, FiUser, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Vote {
  _id: string;
  user: string | User;
  voteType: 'up' | 'down';
  createdAt: string;
}

interface Answer {
  _id: string;
  content: string;
  user: string | User;
  post: string;
  votes: Vote[];
  accepted: boolean;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  user: string | User;
  votes: Vote[];
  answers: Answer[];
  status: 'open' | 'closed' | 'resolved';
  createdAt: string;
}

interface PostProps {
  post: Post;
}

const tagColors = [
  'from-violet-500/20 to-purple-500/20 border-violet-500/30 text-violet-300',
  'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300',
  'from-emerald-500/20 to-green-500/20 border-emerald-500/30 text-emerald-300',
  'from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-300',
  'from-pink-500/20 to-rose-500/20 border-pink-500/30 text-pink-300',
];

function CommunityPost({ post }: PostProps) {
  const { userData } = useUserStore();
  const { starPost, deletePost, addAnswer, voteAnswer, acceptAnswer } = useCommunityStore();
  const [showAnswers, setShowAnswers] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if current user has starred this post
  const hasStarred = post.votes.some(vote => {
    const voteUser = typeof vote.user === 'string' ? vote.user : vote.user._id;
    return voteUser === userData?._id && vote.voteType === 'up';
  });

  const starCount = post.votes.filter(v => v.voteType === 'up').length;

  const handleStar = async () => {
    if (!userData?._id) {
      toast.error('Please log in to star posts');
      return;
    }
    await starPost(post._id, userData._id);
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?._id || !newAnswer.trim()) return;
    await addAnswer(post._id, userData._id, newAnswer);
    setNewAnswer('');
    toast.success('Answer posted!');
  };

  const handleAnswerVote = async (answerId: string, voteType: 'up' | 'down') => {
    if (!userData?._id) return;
    await voteAnswer(answerId, userData._id, voteType);
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!userData?._id) return;
    await acceptAnswer(answerId, userData._id);
    toast.success('Answer accepted! 🎉');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href + '#' + post._id);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleDelete = async () => {
    if (!userData?._id) return;
    setIsDeleting(true);
    try {
      await deletePost(post._id, userData._id);
      toast.success('Post deleted');
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const isPostOwner = typeof post.user === 'string'
    ? post.user === userData?._id
    : post.user._id === userData?._id;

  const authorName = typeof post.user === 'string' ? 'User' : post.user.name;
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <>
      <style jsx>{`
        .post-card {
          background: linear-gradient(135deg, rgba(17,24,39,0.9) 0%, rgba(31,41,55,0.85) 100%);
          border: 1px solid rgba(99,102,241,0.15);
          backdrop-filter: blur(12px);
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .post-card:hover {
          border-color: rgba(139,92,246,0.35);
          box-shadow: 0 0 0 1px rgba(139,92,246,0.15), 0 20px 40px rgba(0,0,0,0.4), 0 0 60px rgba(139,92,246,0.05);
          transform: translateY(-1px);
        }
        .star-btn {
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .star-btn:hover {
          transform: scale(1.15);
        }
        .star-btn.starred svg {
          filter: drop-shadow(0 0 6px rgba(251,191,36,0.8));
        }
        .answer-item {
          animation: slideIn 0.3s ease-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .tag-badge {
          background: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
          border: 1px solid;
          transition: all 0.2s ease;
        }
        .tag-badge:hover {
          filter: brightness(1.2);
        }
        .delete-confirm-overlay {
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .glow-input {
          background: rgba(17,24,39,0.8);
          border: 1px solid rgba(99,102,241,0.2);
          transition: all 0.2s ease;
        }
        .glow-input:focus {
          border-color: rgba(139,92,246,0.6);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1), 0 0 20px rgba(139,92,246,0.05);
          outline: none;
        }
        .submit-btn {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          transition: all 0.2s ease;
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
          box-shadow: 0 0 20px rgba(139,92,246,0.4);
          transform: translateY(-1px);
        }
        .answer-vote-btn {
          transition: all 0.2s ease;
        }
        .answer-vote-btn:hover {
          transform: scale(1.1);
        }
      `}</style>

      <div id={post._id} className="post-card relative rounded-2xl overflow-hidden">
        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="delete-confirm-overlay absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-2xl">
            <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6 mx-4 text-center shadow-2xl max-w-xs w-full">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="text-red-400" size={22} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Delete Post?</h3>
              <p className="text-gray-400 text-sm mb-6">This action cannot be undone. The post will be permanently removed.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2 px-4 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors text-sm disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative p-5 sm:p-6">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            {/* Author + Meta */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                {authorInitial}
              </div>
              <div className="text-sm text-gray-400 truncate">
                <span className="text-gray-200 font-medium">{authorName}</span>
                <span className="mx-1.5 opacity-40">·</span>
                <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
                {post.status !== 'open' && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs inline-flex ${
                    post.status === 'resolved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                )}
              </div>
            </div>

            {/* Star + Delete */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Star Button */}
              <button
                onClick={handleStar}
                className={`star-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${
                  hasStarred
                    ? 'starred bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-gray-800/60 border-gray-600/40 text-gray-400 hover:border-amber-500/40 hover:text-amber-400'
                }`}
                title={hasStarred ? 'Unstar this post' : 'Star this post'}
                aria-label="Star this post"
              >
                <FiStar size={14} className={hasStarred ? 'fill-amber-300' : ''} />
                <span>{starCount}</span>
              </button>

              {/* Delete (author only) */}
              {isPostOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                  title="Delete your post"
                  aria-label="Delete this post"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 leading-snug">
            {post.title}
          </h3>

          {/* Description */}
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap mb-4">
            {post.description}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className={`tag-badge px-2.5 py-1 rounded-full text-xs font-medium ${tagColors[index % tagColors.length]}`}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-400 transition-colors duration-200 group"
            >
              <FiMessageSquare size={15} className="group-hover:scale-110 transition-transform" />
              <span>
                {post.answers.length} {post.answers.length === 1 ? 'Answer' : 'Answers'}
              </span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors duration-200 group"
            >
              <FiShare2 size={15} className="group-hover:scale-110 transition-transform" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Answers Panel */}
        {showAnswers && (
          <div className="border-t border-white/5 bg-black/20 p-5 sm:p-6">
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-5 flex items-center gap-2">
              <FiMessageSquare size={14} className="text-indigo-400" />
              Answers ({post.answers.length})
            </h4>

            {/* Add Answer Form */}
            <form onSubmit={handleAnswerSubmit} className="mb-6">
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Write your answer... (share knowledge, not opinions)"
                rows={4}
                className="glow-input w-full px-4 py-3 rounded-xl text-gray-200 text-sm resize-none mb-3 placeholder-gray-600"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newAnswer.trim()}
                  className="submit-btn px-5 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Post Answer
                </button>
              </div>
            </form>

            {/* Answers List */}
            <div className="space-y-4">
              {post.answers.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm">
                  No answers yet. Be the first to help!
                </div>
              )}
              {post.answers.map((answer) => {
                const answerUpvotes = answer.votes.filter(v => v.voteType === 'up').length;
                const answerDownvotes = answer.votes.filter(v => v.voteType === 'down').length;
                const answerScore = answerUpvotes - answerDownvotes;
                const userAnswerVote = answer.votes.find(vote => {
                  const voteUser = typeof vote.user === 'string' ? vote.user : vote.user._id;
                  return voteUser === userData?._id;
                });
                const answerAuthorName = typeof answer.user === 'string' ? 'User' : answer.user.name;
                const answerAuthorInitial = answerAuthorName.charAt(0).toUpperCase();

                return (
                  <div
                    key={answer._id}
                    className={`answer-item rounded-xl p-4 ${
                      answer.accepted
                        ? 'bg-emerald-500/10 border border-emerald-500/25'
                        : 'bg-white/3 border border-white/5'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Vote Controls */}
                      <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleAnswerVote(answer._id, 'up')}
                          className={`answer-vote-btn p-1 rounded ${
                            userAnswerVote?.voteType === 'up'
                              ? 'text-indigo-400'
                              : 'text-gray-600 hover:text-indigo-400'
                          }`}
                          aria-label="Upvote answer"
                        >
                          <FiThumbsUp size={13} />
                        </button>
                        <span className={`text-xs font-bold ${answerScore > 0 ? 'text-indigo-400' : answerScore < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                          {answerScore}
                        </span>
                        <button
                          onClick={() => handleAnswerVote(answer._id, 'down')}
                          className={`answer-vote-btn p-1 rounded ${
                            userAnswerVote?.voteType === 'down'
                              ? 'text-red-400'
                              : 'text-gray-600 hover:text-red-400'
                          }`}
                          aria-label="Downvote answer"
                        >
                          <FiThumbsDown size={13} />
                        </button>
                        {answer.accepted && (
                          <div className="mt-1 text-emerald-400" title="Accepted answer">
                            <FiCheck size={14} />
                          </div>
                        )}
                      </div>

                      {/* Answer Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {answerAuthorInitial}
                            </div>
                            <span className="text-sm font-medium text-gray-200">{answerAuthorName}</span>
                          </div>
                          <span className="text-xs text-gray-600 flex-shrink-0">
                            {format(new Date(answer.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{answer.content}</p>

                        {isPostOwner && !answer.accepted && post.status !== 'resolved' && (
                          <div className="mt-3 flex justify-end">
                            <button
                              onClick={() => handleAcceptAnswer(answer._id)}
                              className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors"
                            >
                              <FiCheck size={12} />
                              Accept Answer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default CommunityPost;