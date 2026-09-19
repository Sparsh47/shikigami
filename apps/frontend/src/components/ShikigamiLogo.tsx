import React from "react";
import Image from "next/image";

interface ShikigamiLogoProps {
    className?: string;
    priority?: boolean;
    alt?: string;
}

export function ShikigamiLogo({
    className = "h-7 w-7",
    priority = false,
    alt = "Shikigami",
}: ShikigamiLogoProps) {
    return (
        <Image
            src="/shikigami.png"
            alt={alt}
            width={64}
            height={64}
            className={`object-contain shrink-0 drop-shadow-[0_0_8px_rgba(201,107,62,0.25)] ${className}`}
            priority={priority}
        />
    );
}
