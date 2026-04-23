"use client";

import LoginCard from "@/components/loginCard";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function LoginModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary-foreground transition-transform duration-200 hover:-translate-y-0.5"
        >
          Login
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-1.5rem)] border-none bg-transparent p-0 shadow-none sm:max-w-md" showCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Login to Compendia</DialogTitle>
          <DialogDescription>Sign in with your provider to continue.</DialogDescription>
        </DialogHeader>
        <LoginCard />
      </DialogContent>
    </Dialog>
  );
}