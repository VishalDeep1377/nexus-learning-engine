import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import axios from "axios";

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

interface CommunityState {
  posts: Post[];
  selectedPost: Post | null;
  isLoading: boolean;
  error: string | null;
  fetchPosts: () => Promise<void>;
  fetchPostById: (postId: string) => Promise<void>;
  createPost: (postData: { title: string; description: string; tags: string[]; userId: string }) => Promise<void>;
  votePost: (postId: string, userId: string, voteType: 'up' | 'down') => Promise<void>;
  addAnswer: (postId: string, userId: string, content: string) => Promise<void>;
  voteAnswer: (answerId: string, userId: string, voteType: 'up' | 'down') => Promise<void>;
  acceptAnswer: (answerId: string, userId: string) => Promise<void>;
}

export const useCommunityStore = create<CommunityState>()(
  immer<CommunityState>((set, get) => ({
    posts: [] as Post[],
    selectedPost: null,
    isLoading: false,
    error: null,

    fetchPosts: async () => {
      try {
        set({ isLoading: true, error: null });
        const response = await axios.get("/api/community/post");
        set((state) => {
          state.posts = response.data.posts;
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Failed to fetch posts:", error);
        set((state) => {
          state.error = "Failed to fetch posts";
          state.isLoading = false;
        });
      }
    },

    fetchPostById: async (postId: string) => {
      try {
        set({ isLoading: true, error: null });
        const response = await axios.get(`/api/community/post/${postId}`);
        set((state) => {
          state.selectedPost = response.data.post;
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Failed to fetch post:", error);
        set((state) => {
          state.error = "Failed to fetch post";
          state.isLoading = false;
        });
      }
    },

    createPost: async (postData) => {
      try {
        set({ isLoading: true, error: null });
        const response = await axios.post("/api/community/post", postData);
        
        // Add the new post to the state
        set((state) => {
          if (response.data.post) {
            state.posts.unshift(response.data.post);
          }
          state.isLoading = false;
        });
      } catch (error) {
        console.error("Failed to create post:", error);
        set((state) => {
          state.error = "Failed to create post";
          state.isLoading = false;
        });
      }
    },

    votePost: async (postId: string, userId: string, voteType: 'up' | 'down') => {
      try {
        // Optimistic update
        const posts = get().posts;
        const selectedPost = get().selectedPost;
        
        // Find the post in the state
        const postIndex = posts.findIndex(p => p._id === postId);
        
        if (postIndex !== -1) {
          // Check if user already voted
          const existingVoteIndex = posts[postIndex].votes.findIndex(
            v => typeof v.user === 'string' ? v.user === userId : v.user._id === userId
          );
          
          set((state) => {
            // Handle existing vote
            if (existingVoteIndex !== -1) {
              const existingVote = state.posts[postIndex].votes[existingVoteIndex];
              
              // If same vote type, remove the vote
              if (existingVote.voteType === voteType) {
                state.posts[postIndex].votes.splice(existingVoteIndex, 1);
              } else {
                // Change vote type
                state.posts[postIndex].votes[existingVoteIndex].voteType = voteType;
              }
            } else {
              // Add new vote
              state.posts[postIndex].votes.push({
                _id: Date.now().toString(), // Temporary ID
                user: userId,
                voteType,
                createdAt: new Date().toISOString()
              });
            }
            
            // Update selected post if it's the same post
            if (selectedPost && selectedPost._id === postId) {
              state.selectedPost = { ...state.posts[postIndex] };
            }
          });
        }
        
        // Make API call
        await axios.post(`/api/community/post/${postId}/vote`, { userId, voteType });
        
        // No need to update state again as we've already done it optimistically
      } catch (error) {
        console.error("Failed to vote on post:", error);
        // Revert optimistic update by refetching the post
        if (get().selectedPost && get().selectedPost?._id === postId) {
          await get().fetchPostById(postId);
        } else {
          await get().fetchPosts();
        }
      }
    },

    addAnswer: async (postId: string, userId: string, content: string) => {
      try {
        const response = await axios.post("/api/community/answer", {
          content,
          userId,
          postId
        });
        
        // Update the post with the new answer
        set((state) => {
          // Update in posts array
          const postIndex = state.posts.findIndex(p => p._id === postId);
          if (postIndex !== -1 && response.data.answer) {
            state.posts[postIndex].answers.push(response.data.answer);
          }
          
          // Update in selected post if it's the same post
          if (state.selectedPost && state.selectedPost._id === postId && response.data.answer) {
            state.selectedPost.answers.push(response.data.answer);
          }
        });
      } catch (error) {
        console.error("Failed to add answer:", error);
        set((state) => {
          state.error = "Failed to add answer";
        });
      }
    },

    voteAnswer: async (answerId: string, userId: string, voteType: 'up' | 'down') => {
      try {
        // Find the post containing this answer
        const posts = get().posts;
        const selectedPost = get().selectedPost;
        
        // Optimistic update
        set((state) => {
          // Update in posts array
          for (const post of state.posts) {
            const answerIndex = post.answers.findIndex(a => a._id === answerId);
            if (answerIndex !== -1) {
              const answer = post.answers[answerIndex];
              
              // Check if user already voted
              const existingVoteIndex = answer.votes.findIndex(
                v => typeof v.user === 'string' ? v.user === userId : v.user._id === userId
              );
              
              if (existingVoteIndex !== -1) {
                const existingVote = answer.votes[existingVoteIndex];
                
                // If same vote type, remove the vote
                if (existingVote.voteType === voteType) {
                  answer.votes.splice(existingVoteIndex, 1);
                } else {
                  // Change vote type
                  answer.votes[existingVoteIndex].voteType = voteType;
                }
              } else {
                // Add new vote
                answer.votes.push({
                  _id: Date.now().toString(), // Temporary ID
                  user: userId,
                  voteType,
                  createdAt: new Date().toISOString()
                });
              }
              
              break;
            }
          }
          
          // Update in selected post if it exists
          if (selectedPost) {
            const answerIndex = selectedPost.answers.findIndex(a => a._id === answerId);
            if (answerIndex !== -1) {
              const answer = state.selectedPost!.answers[answerIndex];
              
              // Check if user already voted
              const existingVoteIndex = answer.votes.findIndex(
                v => typeof v.user === 'string' ? v.user === userId : v.user._id === userId
              );
              
              if (existingVoteIndex !== -1) {
                const existingVote = answer.votes[existingVoteIndex];
                
                // If same vote type, remove the vote
                if (existingVote.voteType === voteType) {
                  answer.votes.splice(existingVoteIndex, 1);
                } else {
                  // Change vote type
                  answer.votes[existingVoteIndex].voteType = voteType;
                }
              } else {
                // Add new vote
                answer.votes.push({
                  _id: Date.now().toString(), // Temporary ID
                  user: userId,
                  voteType,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        });
        
        // Make API call
        await axios.post(`/api/community/answer/${answerId}/vote`, { userId, voteType });
        
      } catch (error) {
        console.error("Failed to vote on answer:", error);
        // Revert optimistic update by refetching
        const selectedPostId = get().selectedPost?._id;
        if (get().selectedPost && selectedPostId) {
          await get().fetchPostById(selectedPostId);
        } else {
          await get().fetchPosts();
        }
      }
    },

    acceptAnswer: async (answerId: string, userId: string) => {
      try {
        // Make API call first to ensure it succeeds
        await axios.post(`/api/community/answer/${answerId}/accept`, { userId });
        
        // Find the post containing this answer
        const posts = get().posts;
        const selectedPost = get().selectedPost;
        
        set((state) => {
          // Update in posts array
          for (const post of state.posts) {
            const hasAnswer = post.answers.some(a => a._id === answerId);
            if (hasAnswer) {
              // Mark all answers as not accepted
              post.answers.forEach(a => {
                a.accepted = a._id === answerId;
              });
              
              // Mark post as resolved
              post.status = 'resolved';
              break;
            }
          }
          
          // Update in selected post if it exists
          if (selectedPost) {
            const hasAnswer = selectedPost.answers.some(a => a._id === answerId);
            if (hasAnswer) {
              // Mark all answers as not accepted
              state.selectedPost!.answers.forEach(a => {
                a.accepted = a._id === answerId;
              });
              
              // Mark post as resolved
              state.selectedPost!.status = 'resolved';
            }
          }
        });
      } catch (error) {
        console.error("Failed to accept answer:", error);
        set((state) => {
          state.error = "Failed to accept answer";
        });
      }
    }
  }))
); 