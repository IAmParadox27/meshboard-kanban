"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle()
{
    const { resolvedTheme, setTheme } = useTheme();
    const [m_isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!m_isMounted)
    {
        return (
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0"
                aria-label="Toggle theme"
            >
                <SunIcon className="h-4 w-4" />
            </Button>
        );
    }

    const isDark = resolvedTheme === "dark";

    return (
        <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
            {isDark ? (
                <SunIcon className="h-4 w-4" />
            ) : (
                <MoonIcon className="h-4 w-4" />
            )}
        </Button>
    );
}