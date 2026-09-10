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
  starPost: (postId: string, userId: string) => Promise<void>;
  deletePost: (postId: string, userId: string) => Promise<void>;
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

    // GitHub-style star toggle — 'up' vote = star, toggled on second click
    starPost: async (postId: string, userId: string) => {
      try {
        const posts = get().posts;
        const postIndex = posts.findIndex(p => p._id === postId);
        
        if (postIndex !== -1) {
          const existingStarIndex = posts[postIndex].votes.findIndex(
            v => typeof v.user === 'string' ? v.user === userId : v.user._id === userId
          );
          
          set((state) => {
            if (existingStarIndex !== -1) {
              // Already starred — remove the star
              state.posts[postIndex].votes.splice(existingStarIndex, 1);
            } else {
              // Add a star
              state.posts[postIndex].votes.push({
                _id: Date.now().toString(),
                user: userId,
                voteType: 'up',
                createdAt: new Date().toISOString()
              });
            }
          });
        }
        
        // Reuse the existing vote API — send 'up' as the star type
        await axios.post(`/api/community/post/${postId}/vote`, { userId, voteType: 'up' });
      } catch (error) {
        console.error("Failed to star post:", error);
        await get().fetchPosts();
      }
    },

    deletePost: async (postId: string, userId: string) => {
      try {
        await axios.delete(`/api/community/post/${postId}`, {
          data: { userId }
        });
        
        set((state) => {
          state.posts = state.posts.filter(p => p._id !== postId);
          if (state.selectedPost?._id === postId) {
            state.selectedPost = null;
          }
        });
      } catch (error) {
        console.error("Failed to delete post:", error);
        set((state) => {
          state.error = "Failed to delete post";
        });
        throw error;
      }
    },

    addAnswer: async (postId: string, userId: string, content: string) => {
      try {
        const response = await axios.post("/api/community/answer", {
          content,
          userId,
          postId
        });
        
        set((state) => {
          const postIndex = state.posts.findIndex(p => p._id === postId);
          if (postIndex !== -1 && response.data.answer) {
            state.posts[postIndex].answers.push(response.data.answer);
          }
          
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
        const selectedPost = get().selectedPost;
        
        set((state) => {
          for (const post of state.posts) {
            const answerIndex = post.answers.findIndex(a => a._id === answerId);
            if (answerIndex !== -1) {
              const answer = post.answers[answerIndex];
              const existingVoteIndex = answer.votes.findIndex(
                v => typeof v.user === 'string' ? v.user === userId : v.user._id === userId
              );
              
              if (existingVoteIndex !== -1) {
                const existingVote = answer.votes[existingVoteIndex];
                if (existingVote.voteType === voteType) {
                  answer.votes.splice(existingVoteIndex, 1);
                } else {
                  answer.votes[existingVoteIndex].voteType = voteType;
                }
              } else {
                answer.votes.push({
                  _id: Date.now().toString(),
                  user: userId,
                  voteType,
                  createdAt: new Date().toISOString()
                });
              }
              break;
            }
          }
          
          if (selectedPost) {
            const answerIndex = selectedPost.answers.findIndex(a => a._id === answerId);
            if (answerIndex !== -1) {
              const answer = state.selectedPost!.answers[answerIndex];
              const existingVoteIndex = answer.votes.findIndex(
                v => typeof v.user === 'string' ? v.user === userId : v.user._id === userId
              );
              
              if (existingVoteIndex !== -1) {
                const existingVote = answer.votes[existingVoteIndex];
                if (existingVote.voteType === voteType) {
                  answer.votes.splice(existingVoteIndex, 1);
                } else {
                  answer.votes[existingVoteIndex].voteType = voteType;
                }
              } else {
                answer.votes.push({
                  _id: Date.now().toString(),
                  user: userId,
                  voteType,
                  createdAt: new Date().toISOString()
                });
              }
            }
          }
        });
        
        await axios.post(`/api/community/answer/${answerId}/vote`, { userId, voteType });
        
      } catch (error) {
        console.error("Failed to vote on answer:", error);
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
        await axios.post(`/api/community/answer/${answerId}/accept`, { userId });
        
        set((state) => {
          for (const post of state.posts) {
            const hasAnswer = post.answers.some(a => a._id === answerId);
            if (hasAnswer) {
              post.answers.forEach(a => {
                a.accepted = a._id === answerId;
              });
              post.status = 'resolved';
              break;
            }
          }
          
          if (state.selectedPost) {
            const hasAnswer = state.selectedPost.answers.some(a => a._id === answerId);
            if (hasAnswer) {
              state.selectedPost!.answers.forEach(a => {
                a.accepted = a._id === answerId;
              });
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