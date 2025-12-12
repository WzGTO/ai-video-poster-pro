"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Video,
    Sparkles,
    Shield,
    Zap,
    Globe,
    ArrowRight,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
    const error = searchParams.get("error");

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
            {/* Navigation */}
            <nav className="container mx-auto px-4 py-6">
                <Link href="/" className="flex items-center gap-2 w-fit">
                    <Video className="h-8 w-8 text-purple-600" />
                    <span className="text-2xl font-kanit font-bold gradient-text">
                        AI Video Poster Pro
                    </span>
                </Link>
            </nav>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Hero Section */}
                        <div className="space-y-8">
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Thai Edition - รองรับภาษาไทย 100%
                                </span>
                            </div>

                            {/* Heading */}
                            <div>
                                <h1 className="text-4xl md:text-5xl font-kanit font-bold mb-4">
                                    <span className="gradient-text">สร้างวิดีโอโฆษณา</span>
                                    <br />
                                    <span className="text-gray-900 dark:text-white">
                                        ด้วย AI อัตโนมัติ 🤖
                                    </span>
                                </h1>
                                <p className="text-xl text-gray-600 dark:text-gray-300 font-prompt">
                                    โพสต์ไปยัง TikTok Shop, Facebook, YouTube
                                    <br />
                                    ใช้เวลาแค่ 2 นาที ✨
                                </p>
                            </div>

                            {/* Feature Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <FeatureCard
                                    icon={<Zap className="h-6 w-6 text-yellow-500" />}
                                    title="AI อัตโนมัติ"
                                    description="สร้างวิดีโอสวยๆ จากสินค้าของคุณ"
                                />
                                <FeatureCard
                                    icon={<Globe className="h-6 w-6 text-blue-500" />}
                                    title="หลายแพลตฟอร์ม"
                                    description="โพสต์ TikTok, FB, YouTube พร้อมกัน"
                                />
                                <FeatureCard
                                    icon={<Shield className="h-6 w-6 text-green-500" />}
                                    title="ข้อมูลปลอดภัย"
                                    description="เก็บบน Google Drive ของคุณ"
                                />
                            </div>

                            {/* Stats */}
                            <div className="flex gap-8">
                                <div>
                                    <div className="text-3xl font-kanit font-bold text-purple-600">
                                        15+
                                    </div>
                                    <div className="text-sm text-gray-500">AI Models</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-kanit font-bold text-primary">
                                        2 นาที
                                    </div>
                                    <div className="text-sm text-gray-500">ต่อวิดีโอ</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-kanit font-bold text-success">
                                        ฟรี!
                                    </div>
                                    <div className="text-sm text-gray-500">เริ่มต้น</div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Login Card */}
                        <div className="flex justify-center lg:justify-end">
                            <Card className="w-full max-w-md shadow-2xl">
                                <CardHeader className="text-center pb-2">
                                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                        <Video className="h-8 w-8 text-white" />
                                    </div>
                                    <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
                                    <CardDescription className="text-base">
                                        เชื่อมต่อบัญชี Google เพื่อเริ่มใช้งาน
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Error Message */}
                                    {error && (
                                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span>
                                                {error === "session_expired"
                                                    ? "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่"
                                                    : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"}
                                            </span>
                                        </div>
                                    )}

                                    {/* Google Login Button */}
                                    <Button
                                        onClick={handleGoogleLogin}
                                        size="lg"
                                        className="w-full h-14 text-base gap-3"
                                        variant="outline"
                                    >
                                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                                            <path
                                                fill="#4285F4"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="#34A853"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="#FBBC05"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="#EA4335"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        เข้าสู่ระบบด้วย Google
                                        <ArrowRight className="h-4 w-4 ml-auto" />
                                    </Button>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-card px-2 text-muted-foreground">
                                                ทำไมต้อง Google?
                                            </span>
                                        </div>
                                    </div>

                                    {/* Benefits */}
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <span className="text-green-600 text-xs">✓</span>
                                            </div>
                                            <span>
                                                ข้อมูลทั้งหมดเก็บบน <strong>Google Drive</strong> ของคุณ
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <span className="text-green-600 text-xs">✓</span>
                                            </div>
                                            <span>
                                                ปลอดภัย 100% - <strong>คุณเป็นเจ้าของข้อมูล</strong>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                                <span className="text-green-600 text-xs">✓</span>
                                            </div>
                                            <span>Login ครั้งเดียว ใช้ได้ทุกอุปกรณ์</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                <p className="text-sm">
                    การเข้าสู่ระบบหมายความว่าคุณยอมรับ{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                        เงื่อนไขการใช้งาน
                    </Link>{" "}
                    และ{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                        นโยบายความเป็นส่วนตัว
                    </Link>
                </p>
                <p className="mt-2 text-sm">Made with ❤️ in Thailand 🇹🇭</p>
            </footer>
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="mb-2">{icon}</div>
            <h3 className="font-kanit font-semibold text-gray-900 dark:text-white">
                {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
    );
}
