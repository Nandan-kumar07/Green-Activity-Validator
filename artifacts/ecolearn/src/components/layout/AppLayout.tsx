import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import Chatbot from "@/components/Chatbot";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
      <Chatbot />
    </div>
  );
}
