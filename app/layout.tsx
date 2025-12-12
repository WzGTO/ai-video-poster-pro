import type { Metadata } from "next";
import { Kanit, Prompt, Sarabun } from "next/font/google";
import { SessionProvider } from "@/components/providers/session-provider";
import { OfflineDetector } from "@/components/OfflineDetector";
import "./globals.css";

const kanit = Kanit({
    weight: ["300", "400", "500", "600", "700"],
    subsets: ["thai", "latin"],
    variable: "--font-kanit",
    display: "swap",
});

const prompt = Prompt({
    weight: ["300", "400", "500", "600"],
    subsets: ["thai", "latin"],
    variable: "--font-prompt",
    display: "swap",
});

const sarabun = Sarabun({
    weight: ["300", "400", "500", "600", "700"],
    subsets: ["thai", "latin"],
    variable: "--font-sarabun",
    display: "swap",
});

export const metadata: Metadata = {
    title: "AI Video Poster Pro - Thai Edition | สร้างวิดีโอโฆษณาด้วย AI",
    description:
        "ระบบสร้างวิดีโอโฆษณาด้วย AI และโพสต์อัตโนมัติไปยัง TikTok Shop, Facebook, YouTube - Automated AI video generation and multi-platform posting",
    keywords: [
        "AI Video",
        "TikTok Shop",
        "Video Generator",
        "Thai AI",
        "วิดีโอ AI",
        "โฆษณา TikTok",
    ],
    authors: [{ name: "AI Video Poster Pro" }],
    openGraph: {
        title: "AI Video Poster Pro - Thai Edition",
        description: "สร้างวิดีโอโฆษณาด้วย AI และโพสต์อัตโนมัติ",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="th" suppressHydrationWarning>
            <body
                className={`${kanit.variable} ${prompt.variable} ${sarabun.variable} antialiased`}
            >
                <OfflineDetector />
                <SessionProvider>{children}</SessionProvider>
            </body>
        </html>
    );
}

