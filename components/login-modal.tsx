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
          Zaloguj się
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-[calc(100%-1.5rem)] border-none bg-transparent p-0 shadow-none sm:max-w-md" showCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Zaloguj się do Compendia</DialogTitle>
          <DialogDescription>Zaloguj się za pomocą swojego dostawcy, aby kontynuować.</DialogDescription>
        </DialogHeader>
        <LoginCard />
      </DialogContent>
    </Dialog>
  );
}