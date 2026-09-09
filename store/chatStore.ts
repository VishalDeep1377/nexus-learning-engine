import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import axios from "axios";

interface Message {
  content: string;
  senderId: string;
  receiverId?: string;
  createdAt?: string;
  isStreaming?: boolean;
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
  isSending: boolean;
  error: string | null;
  fetchAllChats: () => Promise<void>;
  setActiveChat: (chatId: string) => void;
  createNewChat: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  updateCurrentChat: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newName: string) => Promise<void>;
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    allChats: [],
    activeChat: null,
    isLoading: false,
    isSending: false,
    error: null,

    // ── Fetch all chats ───────────────────────────────────────────────────────
    fetchAllChats: async () => {
      try {
        set({ isLoading: true });
        const res = await axios.get("/api/mentor/chat/allchats", { withCredentials: true });
        set(state => {
          state.allChats = res.data.allChats;
          state.isLoading = false;
          state.error = null;
        });
      } catch {
        set(state => {
          state.error = "Failed to fetch chats";
          state.isLoading = false;
        });
      }
    },

    // ── Set active chat ───────────────────────────────────────────────────────
    setActiveChat: (chatId: string) => {
      set(state => {
        const chat = state.allChats.find(c => c._id === chatId);
        if (chat) state.activeChat = chat;
      });
    },

    // ── Create new chat ───────────────────────────────────────────────────────
    createNewChat: async () => {
      try {
        set({ isLoading: true });
        const res = await axios.post("/api/mentor/chat", { withCredentials: true });
        await get().fetchAllChats();
        // Auto-select the newly created chat
        const newChatId = res.data?.chat?._id;
        if (newChatId) {
          set(state => {
            const chat = state.allChats.find(c => c._id === newChatId);
            if (chat) state.activeChat = chat;
          });
        } else {
          // Fallback: select last chat
          const allChats = get().allChats;
          if (allChats.length > 0) {
            set(state => { state.activeChat = state.allChats[state.allChats.length - 1]; });
          }
        }
      } catch {
        set(state => {
          state.error = "Failed to create new chat";
          state.isLoading = false;
        });
      }
    },

    // ── Send message with streaming support ───────────────────────────────────
    sendMessage: async (message: string) => {
      const activeChat = get().activeChat;
      if (!activeChat) return;

      // Optimistically add user message
      set(state => {
        if (state.activeChat) {
          state.activeChat.messages.push({
            content: message,
            senderId: "user",
            receiverId: "gemini",
          });
        }
      });

      // Add placeholder AI message with isStreaming flag
      set(state => {
        if (state.activeChat) {
          state.activeChat.messages.push({
            content: "",
            senderId: "gemini",
            receiverId: "user",
            isStreaming: true,
          });
          state.isSending = true;
        }
      });

      try {
        const response = await fetch("/api/mentor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message, chatId: activeChat._id }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Update the streaming placeholder message
          set(state => {
            if (state.activeChat) {
              const msgs = state.activeChat.messages;
              const lastIdx = msgs.length - 1;
              if (lastIdx >= 0 && msgs[lastIdx].isStreaming) {
                msgs[lastIdx].content = accumulated;
              }
            }
          });
        }

        // Mark streaming complete
        set(state => {
          if (state.activeChat) {
            const msgs = state.activeChat.messages;
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].isStreaming) {
              msgs[lastIdx].isStreaming = false;
            }
          }
          state.isSending = false;
        });

        // Refresh chats to get updated name and synced messages from DB
        await get().fetchAllChats();
        // Re-select the active chat to get fresh data with new name
        const updatedChat = get().allChats.find(c => c._id === activeChat._id);
        if (updatedChat) {
          set(state => { state.activeChat = updatedChat; });
        }

      } catch (err) {
        console.error("[ChatStore] sendMessage error:", err);
        set(state => {
          if (state.activeChat) {
            const msgs = state.activeChat.messages;
            const lastIdx = msgs.length - 1;
            if (lastIdx >= 0 && msgs[lastIdx].isStreaming) {
              msgs[lastIdx].content = "⚠️ Something went wrong. Please try again.";
              msgs[lastIdx].isStreaming = false;
            }
          }
          state.isSending = false;
          state.error = "Failed to send message";
        });
      }
    },

    // ── Update current chat from DB ───────────────────────────────────────────
    updateCurrentChat: async () => {
      const activeChat = get().activeChat;
      if (!activeChat) return;
      try {
        const res = await axios.post("/api/mentor/chat/allchats/currentChat", {
          chatId: activeChat._id,
        });
        if (res.data?.updatedChatMessages) {
          set(state => {
            if (state.activeChat) {
              state.activeChat.messages = res.data.updatedChatMessages.messages;
            }
          });
        }
      } catch {
        set(state => { state.error = "Failed to update chat"; });
      }
    },

    // ── Delete a chat ─────────────────────────────────────────────────────────
    deleteChat: async (chatId: string) => {
      try {
        await axios.delete(`/api/mentor/chat?chatId=${chatId}`, { withCredentials: true });
        set(state => {
          state.allChats = state.allChats.filter(c => c._id !== chatId);
          if (state.activeChat?._id === chatId) {
            state.activeChat = state.allChats.length > 0 ? state.allChats[0] : null;
          }
        });
      } catch {
        set(state => { state.error = "Failed to delete chat"; });
      }
    },

    // ── Rename a chat ─────────────────────────────────────────────────────────
    renameChat: async (chatId: string, newName: string) => {
      try {
        await axios.patch(`/api/mentor/chat`, { chatId, name: newName }, { withCredentials: true });
        set(state => {
          const chat = state.allChats.find(c => c._id === chatId);
          if (chat) chat.name = newName;
          if (state.activeChat?._id === chatId) state.activeChat.name = newName;
        });
      } catch {
        set(state => { state.error = "Failed to rename chat"; });
      }
    },
  }))
);