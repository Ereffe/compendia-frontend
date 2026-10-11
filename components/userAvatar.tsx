import { cn } from "@/lib/utils";

type UserAvatarProps = Readonly<{
    name: string;
    size: number;
    className?: string;
}>;

const initials = (name: string) =>
    name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => Array.from(word)[0] ?? "")
        .join("")
        .toUpperCase();

export default function UserAvatar({ name, size, className }: UserAvatarProps) {
    return (
        <span
            aria-hidden
            className={cn(
                "inline-flex shrink-0 select-none items-center justify-center rounded-full border border-border bg-muted font-serif font-medium leading-none text-muted-foreground",
                className,
            )}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        >
            {initials(name)}
        </span>
    );
}
