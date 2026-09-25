import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { manifest: "/manifest.webmanifest", title: "Daybell · Your private calendar", description: "Your calendar, to-dos and timely reminders in one place.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{
    children: React.ReactNode;
}>) { return <html lang="en"><body>{children}</body></html>; }

