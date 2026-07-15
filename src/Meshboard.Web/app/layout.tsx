import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import {AppHeader} from "@/components/layout/app-header";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
})

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html
            lang="en"
            suppressHydrationWarning
            className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
        >
        <body className="min-h-screen bg-muted/30 text-foreground antialiased">
        <ThemeProvider>
            <TooltipProvider>
                <div className="min-h-screen">
                    {children}
                </div>
            </TooltipProvider>
        </ThemeProvider>
        <Toaster />
        </body>
        </html>
    )
}
