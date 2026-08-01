import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import axios from "axios";

interface Message {
  content: string;
  senderId: string;
  receiverId: string;
  createdAt?: string;
}

interface Chat {
  _id: string;
  name: string;
  messages: Message[];
}

interface ChatState {
  allChats: Chat[];
  activeChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  fetchAllChats: () => Promise<void>;
  setActiveChat: (chatId: string) => void;
  createNewChat: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  updateCurrentChat: () => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    allChats: [],
    activeChat: null,
    isLoading: false,
    error: null,

    fetchAllChats: async () => {
      try {
        set({ isLoading: true });
        const response = await axios.get("/api/mentor/chat/allchats", { withCredentials: true });
        set((state) => {
          state.allChats = response.data.allChats;
          state.isLoading = false;
          state.error = null;
        });
      } catch (error) {
        set((state) => {
          state.error = "Failed to fetch chats";
          state.isLoading = false;
        });
      }
    },

    setActiveChat: (chatId: string) => {
      set((state) => {
        const chat = state.allChats.find((c) => c._id === chatId);
        if (chat) {
          state.activeChat = chat;
        }
      });
    },

    createNewChat: async () => {
      try {
        set({ isLoading: true });
        await axios.post("/api/mentor/chat", { withCredentials: true });
        await get().fetchAllChats();
      } catch (error) {
        set((state) => {
          state.error = "Failed to create new chat";
          state.isLoading = false;
        });
      }
    },

    sendMessage: async (message: string) => {
      const activeChat = get().activeChat;
      if (!activeChat) return;

      try {
        set((state) => {
          if (state.activeChat) {
            state.activeChat.messages.push({
              content: message,
              senderId: "user",
              receiverId: "gemini"
            });
          }
        });

        const response = await axios.post("/api/mentor", { 
          message, 
          chatId: activeChat._id 
        });

        await get().updateCurrentChat();
      } catch (error) {
        set((state) => {
          state.error = "Failed to send message";
        });
      }
    },

    updateCurrentChat: async () => {
      const activeChat = get().activeChat;
      if (!activeChat) return;

      try {
        const response = await axios.post("/api/mentor/chat/allchats/currentChat", { 
          chatId: activeChat._id 
        });

        if (response.data && response.data.updatedChatMessages) {
          set((state) => {
            if (state.activeChat) {
              state.activeChat.messages = response.data.updatedChatMessages.messages;
            }
          });
        }
      } catch (error) {
        set((state) => {
          state.error = "Failed to update chat";
        });
      }
    },
  }))
); 