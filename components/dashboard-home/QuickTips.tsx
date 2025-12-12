"use client";

import { useState, useEffect } from "react";
import { Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";

const TIPS = [
    { title: "เวลาโพสต์ที่ดี", desc: "โพสต์ช่วง 19:00-22:00 น. มักได้ engagement สูงที่สุด" },
    { title: "วิดีโอแนวตั้ง", desc: "ใช้ format 9:16 สำหรับ TikTok และ Reels ได้รับการมองเห็นมากกว่า" },
    { title: "Hashtag ที่เหมาะสม", desc: "ใช้ 3-5 hashtag ที่เกี่ยวข้องกับสินค้าเพื่อเพิ่มการค้นพบ" },
    { title: "Call-to-action", desc: "ใส่ CTA ใน 3 วินาทีแรกเพื่อดึงดูดความสนใจ" },
    { title: "ปักตะกร้า TikTok", desc: "เชื่อมต่อสินค้า TikTok Shop เพื่อให้ผู้ชมซื้อได้ทันที" },
];

export function QuickTips() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % TIPS.length);
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    const goNext = () => setCurrentIndex((prev) => (prev + 1) % TIPS.length);
    const goPrev = () => setCurrentIndex((prev) => (prev - 1 + TIPS.length) % TIPS.length);

    return (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-5 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">💡 Tips</h3>
            </div>

            <div className="relative min-h-[80px]">
                <div className="transition-opacity duration-300">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {TIPS[currentIndex].title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {TIPS[currentIndex].desc}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
                <div className="flex gap-1">
                    {TIPS.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-yellow-500" : "bg-gray-300 dark:bg-gray-600"
                                }`}
                        />
                    ))}
                </div>

                <div className="flex gap-1">
                    <button onClick={goPrev} className="p-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={goNext} className="p-1 rounded hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
