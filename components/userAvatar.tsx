"use client";

import { Blobatar } from "@blobatar/react";
import "blobatar/motion.css";

import { cn } from "@/lib/utils";

type UserAvatarProps = Readonly<{
    userId: string;
    size: number;
    animated?: boolean;
    className?: string;
}>;

export default function UserAvatar({ userId, size, animated = false, className }: UserAvatarProps) {
    if (animated) {
        return <Blobatar name={userId} size={size} background="squircle" animate="always" aria-hidden className={cn("shrink-0", className)} />;
    }

    return <Blobatar name={userId} size={size} background="circle" alt="" className={cn("shrink-0", className)} />;
}
