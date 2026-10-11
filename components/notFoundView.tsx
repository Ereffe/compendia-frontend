import Link from "next/link";

import { Button } from "@/components/ui/button";

type NotFoundViewProps = {
  title: string;
  description: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

export default function NotFoundView({ title, description, primary, secondary }: Readonly<NotFoundViewProps>) {
  return (
    <section className="container-page flex flex-1 items-center py-16">
      <div className="mx-auto w-full max-w-xl">
        <p className="font-serif text-lg italic text-muted-foreground">404</p>
        <h1 className="mt-2 title-page">{title}</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href={primary.href}>{primary.label}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
