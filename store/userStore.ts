import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import axios from "axios";

interface IState {
  userData: Record<string, any> | null;
  setUserData: () => void;
  logoutUser: () => void;
  userTheme: string;
  setUserTheme: (theme: string) => void;
}

// Create the store
  export const useUserStore = create<IState>()(
  immer<IState>((set) => ({
    userData: null,
    userTheme: "dark",
    setUserData: async (): Promise<void> => {
      try {
        const response = await axios.post('/api/user',{});
        set((state) => {
          state.userData = response.data.user;
          console.log("user fetched from the db and stored in store",state.userData);
        });
      } catch (error) {
        console.error("Failed to fetch user data", error);
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
