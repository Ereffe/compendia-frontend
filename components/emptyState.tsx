import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function EmptyState({
  message,
  action,
}: Readonly<{ message: string; action?: { href: string; label: string } }>) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <p className="max-w-md text-base leading-7 text-muted-foreground">{message}</p>
      {action ? (
        <Button asChild variant="outline">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
