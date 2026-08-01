import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { useCommunityStore } from '@/store/communityStore';
import { FiHeart, FiMessageSquare, FiShare2, FiThumbsUp, FiThumbsDown, FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';

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

function CommunityPost({ post }: PostProps) {
  const { userData } = useUserStore();
  const { votePost, addAnswer, voteAnswer, acceptAnswer } = useCommunityStore();
  const [showAnswers, setShowAnswers] = useState(false);
  const [newAnswer, setNewAnswer] = useState('');

  // Check if the current user has voted on this post
  const userVote = post.votes.find(vote => {
    const voteUser = typeof vote.user === 'string' ? vote.user : vote.user._id;
    return voteUser === userData?._id;
  });

  // Count upvotes and downvotes
  const upvotes = post.votes.filter(vote => vote.voteType === 'up').length;
  const downvotes = post.votes.filter(vote => vote.voteType === 'down').length;
  const voteScore = upvotes - downvotes;

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!userData?._id) return;
    await votePost(post._id, userData._id, voteType);
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData?._id || !newAnswer.trim()) return;

    await addAnswer(post._id, userData._id, newAnswer);
    setNewAnswer('');
  };

  const handleAnswerVote = async (answerId: string, voteType: 'up' | 'down') => {
    if (!userData?._id) return;
    await voteAnswer(answerId, userData._id, voteType);
  };

  const handleAcceptAnswer = async (answerId: string) => {
    if (!userData?._id) return;
    await acceptAnswer(answerId, userData._id);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href + '#' + post._id);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link');
    }
  };

  // Check if the current user is the post owner
  const isPostOwner = typeof post.user === 'string' 
    ? post.user === userData?._id 
    : post.user._id === userData?._id;

  // Get the post author's name
  const authorName = typeof post.user === 'string' ? 'User' : post.user.name;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {post.title}
            </h3>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              <span>Posted {format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
              <span className="mx-2">•</span>
              <span>by {authorName}</span>
              {post.status !== 'open' && (
                <>
                  <span className="mx-2">•</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    post.status === 'resolved' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-center ml-4">
            <button 
              onClick={() => handleVote('up')}
              className={`p-1 rounded-full ${userVote?.voteType === 'up' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900' : 'text-gray-400 hover:text-blue-500'}`}
              title="Upvote"
              aria-label="Upvote this post"
            >
              <FiThumbsUp size={18} />
            </button>
            <span className="my-1 font-medium">{voteScore}</span>
            <button 
              onClick={() => handleVote('down')}
              className={`p-1 rounded-full ${userVote?.voteType === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900' : 'text-gray-400 hover:text-red-500'}`}
              title="Downvote"
              aria-label="Downvote this post"
            >
              <FiThumbsDown size={18} />
            </button>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
          {post.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors"
          >
            <FiMessageSquare />
            <span>{post.answers.length} {post.answers.length === 1 ? 'Answer' : 'Answers'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 rounded-lg transition-colors"
          >
            <FiShare2 />
            <span>Share</span>
          </button>
        </div>
      </div>

      {showAnswers && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Answers ({post.answers.length})
          </h4>

          <form onSubmit={handleAnswerSubmit} className="mb-6">
            <div className="flex flex-col gap-4">
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder="Add your answer..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newAnswer.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Answer
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            {post.answers.map((answer) => {
              // Check if the current user has voted on this answer
              const userAnswerVote = answer.votes.find(vote => {
                const voteUser = typeof vote.user === 'string' ? vote.user : vote.user._id;
                return voteUser === userData?._id;
              });

              // Count upvotes and downvotes for this answer
              const answerUpvotes = answer.votes.filter(vote => vote.voteType === 'up').length;
              const answerDownvotes = answer.votes.filter(vote => vote.voteType === 'down').length;
              const answerVoteScore = answerUpvotes - answerDownvotes;

              // Get the answer author's name
              const answerAuthorName = typeof answer.user === 'string' ? 'User' : answer.user.name;

              return (
                <div
                  key={answer._id}
                  className={`flex gap-4 p-4 rounded-lg ${
                    answer.accepted 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => handleAnswerVote(answer._id, 'up')}
                      className={`p-1 rounded-full ${userAnswerVote?.voteType === 'up' ? 'text-blue-500 bg-blue-50 dark:bg-blue-900' : 'text-gray-400 hover:text-blue-500'}`}
                      title="Upvote answer"
                      aria-label="Upvote this answer"
                    >
                      <FiThumbsUp size={16} />
                    </button>
                    <span className="my-1 font-medium text-sm">{answerVoteScore}</span>
                    <button 
                      onClick={() => handleAnswerVote(answer._id, 'down')}
                      className={`p-1 rounded-full ${userAnswerVote?.voteType === 'down' ? 'text-red-500 bg-red-50 dark:bg-red-900' : 'text-gray-400 hover:text-red-500'}`}
                      title="Downvote answer"
                      aria-label="Downvote this answer"
                    >
                      <FiThumbsDown size={16} />
                    </button>
                    {answer.accepted && (
                      <div className="mt-2 text-green-600 dark:text-green-400">
                        <FiCheck size={18} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {answerAuthorName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(answer.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{answer.content}</p>
                    
                    {isPostOwner && !answer.accepted && post.status !== 'resolved' && (
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => handleAcceptAnswer(answer._id)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800"
                        >
                          <FiCheck size={14} />
                          <span>Accept Answer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default CommunityPost;