import { User } from "lucide-react"
import Link from "next/link"
import LoginModal from "./login-modal"
import ThemeToggle from "./themeToggle"

type HeaderProps = {
  hasAccess: boolean
}

export default function Header({ hasAccess }: Readonly<HeaderProps>) {
  return <header className="sticky mx-auto w-full px-6 pt-6 sm:px-8 sm:pt-10">
    <nav className="fade-in-up flex items-center justify-between rounded-full border border-border/60 bg-card/75 px-4 py-2.5 backdrop-blur md:px-6">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link href="/articles" className="text-sm font-semibold tracking-[0.2em] text-foreground">
          COMPENDIA
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="#articles"
          className="rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground/90 transition-colors duration-200 hover:bg-accent"
        >
          Newest Articles
        </Link>
        <Link
          href="#"
          className="rounded-full border border-border/60 bg-background/80 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-foreground transition-colors duration-200 hover:bg-accent"
          aria-label="Open messenger"
        >
          Messenger
        </Link>
        {hasAccess ? <User className="size-5 text-foreground" /> : <LoginModal />}
      </div>
    </nav>
  </header>
}
