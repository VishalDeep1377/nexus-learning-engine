"use client";
import { SessionProvider } from "next-auth/react";
import { NotificationProvider } from "./Notification";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchInterval={process.env.NODE_ENV === "production" ? 5 * 60 : 0}>
        <NotificationProvider>{children}</NotificationProvider>
          
    </SessionProvider>
  );
}