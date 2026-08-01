'use client'
import React, { FormEvent, useState, useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { useCommunityStore } from '@/store/communityStore';
import CommunityPost from '@/components/CommunityPost';
import toast from 'react-hot-toast';
import { FiPlus, FiX, FiSearch } from 'react-icons/fi';
import LoadingSkeleton from '@/components/Skeleton/LoadingSkeleton';

function LearnersCommunity() {
  const { userData } = useUserStore();
  const { posts, isLoading, error, fetchPosts, createPost } = useCommunityStore();
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', tags: [] as string[] });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePopup = () => {
    setIsVisible(!isVisible);
    if (!isVisible) {
      setFormData({ title: '', description: '', tags: [] });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePostSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    try {
      await createPost({
        title: formData.title,
        description: formData.description,
        tags: formData.tags,
        userId: userData?._id || '',
      });
      
      toast.success("Post created successfully!");
      handlePopup();
    } catch (error) {
      toast.error("Failed to create post");
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => {
    const searchLower = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(searchLower) ||
      post.description.toLowerCase().includes(searchLower) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      (typeof post.user !== 'string' && post.user.name.toLowerCase().includes(searchLower))
    );
  });

  if (isLoading && posts.length === 0) {
    return <LoadingSkeleton />;
  }

  return (
    <div className='w-full min-h-screen dark:bg-gray-900 bg-gray-50 flex flex-col items-center p-2 sm:p-4 lg:p-6 pb-16 lg:pb-6'>
      <div className="w-full max-w-4xl">
        <div className="text-center mb-4 sm:mb-8">
          <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Welcome to the Learners Community
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-300 mb-4 sm:mb-6">
            Discuss, ask questions, and help others learn
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, tags, or users..."
              className="block w-full pl-10 pr-3 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        {/* Create Post Button - adjusted for mobile */}
        <button 
          className='fixed bottom-16 lg:bottom-6 right-4 sm:right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 sm:p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-10'
          onClick={handlePopup}
          aria-label="Create new post"
          title="Create new post"
        >
          {isVisible ? <FiX size={20} className="sm:w-6 sm:h-6" /> : <FiPlus size={20} className="sm:w-6 sm:h-6" />}
        </button>

        {/* Create Post Modal */}
        {isVisible && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">Create a Post</h2>
                  <button 
                    onClick={handlePopup} 
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    title="Close dialog"
                    aria-label="Close dialog"
                  >
                    <FiX size={20} className="sm:w-6 sm:h-6" />
                  </button>
                </div>

                <form onSubmit={handlePostSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Title
                    </label>
                    <input 
                      id="title"
                      type="text" 
                      name="title"
                      placeholder="What's on your mind?"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea 
                      id="description"
                      name="description"
                      placeholder="Provide more details..."
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={6}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="tags" className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags
                    </label>
                    <input 
                      id="tags"
                      type="text" 
                      name="tags" 
                      placeholder="Add tags separated by commas"
                      value={formData.tags.join(',')}
                      onChange={handleTagsChange}
                      className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      type="button" 
                      onClick={handlePopup}
                      className="mr-4 px-4 sm:px-6 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Post
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-4 sm:space-y-6">
          {error && (
            <div className="text-center text-red-600 dark:text-red-400 py-4 text-sm sm:text-base">
              {error}
            </div>
          )}
          
          {posts.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-400 py-8 sm:py-12 text-sm sm:text-base">
              No posts yet. Be the first to share something!
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-400 py-8 sm:py-12 text-sm sm:text-base">
              No posts match your search. Try different keywords.
            </div>
          ) : (
            filteredPosts.map((post) => (
              <CommunityPost key={post._id} post={post} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default LearnersCommunity;
