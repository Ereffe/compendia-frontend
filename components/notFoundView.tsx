import Link from "next/link";

type NotFoundViewProps = {
  title: string;
  description: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
};

export default function NotFoundView({ title, description, primary, secondary }: Readonly<NotFoundViewProps>) {
  return (
    <section className="container-page relative flex flex-1 items-center py-12">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold sm:text-7xl">404</h1>
          <p className="text-2xl font-semibold text-foreground">{title}</p>
        </div>

        <p className="mx-auto max-w-md text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href={primary.href}
            className="inline-flex justify-center rounded-lg border border-border/70 bg-teal-600 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-teal-700"
          >
            {primary.label}
          </Link>
          <Link
            href={secondary.href}
            className="inline-flex justify-center rounded-lg border border-border/70 bg-card/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-accent"
          >
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
