"use client";

import Link from "next/link";
import { ArrowRight, Video, Zap, Globe, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
            {/* Navigation */}
            <nav className="container mx-auto px-4 py-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Video className="h-8 w-8 text-purple-600" />
                        <span className="text-2xl font-kanit font-bold gradient-text">
                            AI Video Poster Pro
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">เข้าสู่ระบบ</Button>
                        </Link>
                        <Link href="/login">
                            <Button>เริ่มต้นใช้งาน</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="container mx-auto px-4 py-16">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full mb-8">
                        <Sparkles className="h-4 w-4" />
                        <span className="text-sm font-medium">Thai Edition - รองรับภาษาไทย 100%</span>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-kanit font-bold mb-6">
                        <span className="gradient-text">สร้างวิดีโอโฆษณา</span>
                        <br />
                        <span className="text-gray-900 dark:text-white">ด้วย AI 🤖</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4 font-prompt">
                        Automated AI Video Generation
                    </p>

                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 font-prompt max-w-2xl mx-auto">
                        โพสต์อัตโนมัติไปยัง TikTok Shop, Facebook, YouTube
                        <br />
                        ใช้งานง่าย ใช้เวลาแค่ 2 นาที ✨
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Link href="/login">
                            <Button size="lg" className="text-lg px-8 py-6">
                                เริ่มสร้างวิดีโอฟรี
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Link href="#features">
                            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                                ดูฟีเจอร์ทั้งหมด
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-16">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">15+</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">AI Models</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary">2 นาที</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">ต่อวิดีโอ</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-success">ฟรี!</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">เริ่มต้น</div>
                        </div>
                    </div>
                </div>

                {/* Features Grid */}
                <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <FeatureCard
                        icon={<Zap className="h-8 w-8 text-yellow-500" />}
                        title="AI อัตโนมัติ 100%"
                        description="ให้ AI สร้างวิดีโอที่สวยงามจากสินค้าของคุณ พร้อมบทพูด มุมกล้อง และ Effects"
                    />
                    <FeatureCard
                        icon={<Video className="h-8 w-8 text-purple-500" />}
                        title="15+ AI Models"
                        description="Gemini, Veo 3.1, Luma, Kling, Runway และอื่นๆ เลือกใช้ได้ตามต้องการ"
                    />
                    <FeatureCard
                        icon={<Globe className="h-8 w-8 text-blue-500" />}
                        title="โพสต์หลายแพลตฟอร์ม"
                        description="TikTok Shop, Facebook, YouTube พร้อมกัน พร้อมปักตะกร้าอัตโนมัติ"
                    />
                </div>

                {/* Google Drive Storage Highlight */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-4">
                            <Shield className="h-10 w-10 text-success shrink-0" />
                            <div>
                                <h3 className="text-xl font-kanit font-bold text-gray-800 dark:text-gray-200 mb-2">
                                    🔒 ข้อมูลเก็บบน Google Drive ของคุณ
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 font-prompt mb-4">
                                    ไม่มีการเก็บข้อมูลถาวรบนเซิร์ฟเวอร์ - วิดีโอ, สินค้า, การตั้งค่า ทุกอย่างอยู่บน Drive ของคุณเอง
                                </p>
                                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    <li className="flex items-center gap-2">
                                        <span className="text-success">✓</span>
                                        ปลอดภัย 100% - คุณเป็นเจ้าของข้อมูล
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-success">✓</span>
                                        เข้าถึงได้ทุกที่ - ใช้งานได้หลายอุปกรณ์
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-success">✓</span>
                                        ไม่ต้องกังวลเรื่อง Storage - ใช้ Drive ของคุณ
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400 font-prompt">
                <p>Made with ❤️ in Thailand 🇹🇭</p>
                <p className="text-sm mt-2">AI Video Poster Pro - Thai Edition © 2024</p>
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
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 card-hover">
            <div className="mb-4">{icon}</div>
            <h3 className="text-xl font-kanit font-bold text-gray-800 dark:text-gray-200 mb-2">
                {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 font-prompt">
                {description}
            </p>
        </div>
    );
}
