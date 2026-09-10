import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import axios from "axios";

interface IState {
  userData: Record<string, any> | null;
  setUserData: (data?: any) => void;
  logoutUser: () => void;
  userTheme: string;
  setUserTheme: (theme: string) => void;
}

// Create the store
  export const useUserStore = create<IState>()(
  immer<IState>((set) => ({
    userData: null,
    userTheme: "dark",
    setUserData: async (data?: any): Promise<void> => {
      try {
        if (data) {
          set((state) => {
            state.userData = data;
          });
          return;
        }
        const response = await axios.post('/api/user',{});
        set((state) => {
          state.userData = response.data.user;
          console.log("user fetched from the db and stored in store",state.userData);
        });
      } catch (error: any) {
        if (error?.response?.status === 404 || error?.response?.status === 401 || error?.response?.status === 403) {
          set((state) => {
            state.userData = null;
          });
          console.warn("User session is inactive or user not found.");
        } else {
          console.log("Failed to fetch user data: ", error?.message || "Unknown error");
        }
      }
    },
    logoutUser: () => {
      set((state) => {
        state.userData = null;
      });
    },
    setUserTheme: (theme: string) => {
      set((state) => {
        state.userTheme = theme;
      });
    },
  }))
);
