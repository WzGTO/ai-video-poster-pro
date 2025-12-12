"use client";

import { useState, useEffect } from "react";
import { Check, Calendar, Clock, Loader2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublishingFormProps {
    video: {
        id: string;
        product?: {
            name: string;
            tiktok_product_id: string;
        };
        script: string;
    };
    onPublishSuccess: (results: Array<{ platform: string; success: boolean; postUrl?: string; error?: string }>) => void;
}

const HASHTAG_SUGGESTIONS = ["สินค้าดี", "ลดราคา", "ส่งฟรี", "ของดี", "ขายดี", "แนะนำ", "TikTokShop", "โปรโมชั่น"];

export function PublishingForm({ video, onPublishSuccess }: PublishingFormProps) {
    // Platform states
    const [platforms, setPlatforms] = useState({
        tiktok: false,
        facebook: false,
        youtube: false,
    });

    // Connection status
    const [connected, setConnected] = useState({
        tiktok: false,
        facebook: false,
        youtube: false,
    });

    // Captions
    const [tiktokCaption, setTiktokCaption] = useState(video.script?.slice(0, 150) || "");
    const [tiktokHashtags, setTiktokHashtags] = useState<string[]>([]);
    const [fbCaption, setFbCaption] = useState(video.script || "");
    const [fbPageId, setFbPageId] = useState("");
    const [fbPages, setFbPages] = useState<Array<{ id: string; name: string }>>([]);
    const [ytTitle, setYtTitle] = useState(video.product?.name || "");
    const [ytDesc, setYtDesc] = useState(video.script || "");
    const [ytTags, setYtTags] = useState("");

    // Schedule
    const [scheduleType, setScheduleType] = useState<"now" | "later">("now");
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("19:00");

    // Loading
    const [isPublishing, setIsPublishing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch connection status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/social/status");
                if (res.ok) {
                    const data = await res.json();
                    setConnected({
                        tiktok: data.platforms.tiktok.connected,
                        facebook: data.platforms.facebook.connected,
                        youtube: data.platforms.youtube.connected,
                    });
                    if (data.platforms.facebook.pages?.length > 0) {
                        setFbPages(data.platforms.facebook.pages);
                        setFbPageId(data.platforms.facebook.pages[0].id);
                    }
                }
            } catch (err) {
                console.error("Fetch status error:", err);
            }
        };
        fetchStatus();
    }, []);

    // Toggle platform
    const togglePlatform = (platform: keyof typeof platforms) => {
        if (!connected[platform]) {
            window.location.href = `/api/social/connect/${platform}`;
            return;
        }
        setPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
    };

    // Add hashtag
    const addHashtag = (tag: string) => {
        if (!tiktokHashtags.includes(tag)) {
            setTiktokHashtags([...tiktokHashtags, tag]);
        }
    };

    // Remove hashtag
    const removeHashtag = (tag: string) => {
        setTiktokHashtags(tiktokHashtags.filter(t => t !== tag));
    };

    // Publish
    const handlePublish = async () => {
        const selectedPlatforms = Object.entries(platforms).filter(([_, v]) => v).map(([k]) => k);
        if (selectedPlatforms.length === 0) {
            setError("กรุณาเลือกแพลตฟอร์มอย่างน้อย 1 แพลตฟอร์ม");
            return;
        }

        setIsPublishing(true);
        setError(null);

        try {
            const body: Record<string, unknown> = {
                videoId: video.id,
                platforms: selectedPlatforms,
                captions: {
                    tiktok: tiktokCaption,
                    facebook: fbCaption,
                    youtube: ytTitle,
                },
                hashtags: {
                    tiktok: tiktokHashtags,
                    youtube: ytTags.split(",").map(t => t.trim()).filter(Boolean),
                },
                tiktokProductId: video.product?.tiktok_product_id,
                facebookPageId: fbPageId,
            };

            if (scheduleType === "later") {
                body.scheduleAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
            }

            const res = await fetch("/api/posts/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to publish");

            if (data.scheduled) {
                onPublishSuccess([{ platform: "scheduled", success: true }]);
            } else {
                onPublishSuccess(data.results);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
        } finally {
            setIsPublishing(false);
        }
    };

    const hasSelected = Object.values(platforms).some(Boolean);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🚀 โพสต์วิดีโอ</h3>

            {/* Platform Selection */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { key: "tiktok", label: "TikTok", icon: "🎵", color: "bg-gray-900 dark:bg-white dark:text-gray-900" },
                    { key: "facebook", label: "Facebook", icon: "📘", color: "bg-blue-600" },
                    { key: "youtube", label: "YouTube", icon: "📺", color: "bg-red-600" },
                ].map(p => (
                    <button
                        key={p.key}
                        onClick={() => togglePlatform(p.key as keyof typeof platforms)}
                        className={cn(
                            "relative p-4 rounded-xl border-2 transition-all text-center",
                            platforms[p.key as keyof typeof platforms]
                                ? `border-blue-500 ${p.color} text-white`
                                : connected[p.key as keyof typeof connected]
                                    ? "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                                    : "border-dashed border-gray-300 dark:border-gray-600 opacity-60"
                        )}
                    >
                        <span className="text-2xl">{p.icon}</span>
                        <p className="text-sm mt-1">{p.label}</p>
                        {!connected[p.key as keyof typeof connected] && (
                            <span className="absolute -top-2 -right-2 text-xs px-2 py-0.5 bg-yellow-500 text-white rounded-full">เชื่อมต่อ</span>
                        )}
                        {platforms[p.key as keyof typeof platforms] && (
                            <Check className="absolute top-2 right-2 w-4 h-4" />
                        )}
                    </button>
                ))}
            </div>

            {/* TikTok Section */}
            {platforms.tiktok && (
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">🎵 TikTok</h4>

                    {video.product?.tiktok_product_id && (
                        <div className="text-xs text-green-600 dark:text-green-400 mb-2">
                            ✓ ปักตะกร้าอัตโนมัติ: {video.product.tiktok_product_id}
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Caption</label>
                        <textarea
                            value={tiktokCaption}
                            onChange={e => setTiktokCaption(e.target.value)}
                            maxLength={150}
                            rows={2}
                            className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                        />
                        <div className="text-xs text-gray-400 text-right">{tiktokCaption.length}/150</div>
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Hashtags</label>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {tiktokHashtags.map(tag => (
                                <span key={tag} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full flex items-center gap-1">
                                    #{tag}
                                    <button onClick={() => removeHashtag(tag)} className="hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {HASHTAG_SUGGESTIONS.filter(t => !tiktokHashtags.includes(t)).map(tag => (
                                <button key={tag} onClick={() => addHashtag(tag)} className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-blue-100">
                                    +#{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Facebook Section */}
            {platforms.facebook && (
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">📘 Facebook</h4>

                    {fbPages.length > 0 && (
                        <div className="mb-3">
                            <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Page</label>
                            <select value={fbPageId} onChange={e => setFbPageId(e.target.value)} className="w-full p-2 text-sm rounded-lg border">
                                {fbPages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Caption</label>
                        <textarea value={fbCaption} onChange={e => setFbCaption(e.target.value)} rows={3} className="w-full p-2 text-sm rounded-lg border" />
                    </div>
                </div>
            )}

            {/* YouTube Section */}
            {platforms.youtube && (
                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-medium mb-3 flex items-center gap-2">📺 YouTube Shorts</h4>

                    <div className="mb-3">
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Title</label>
                        <input value={ytTitle} onChange={e => setYtTitle(e.target.value)} className="w-full p-2 text-sm rounded-lg border" />
                    </div>

                    <div className="mb-3">
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Description</label>
                        <textarea value={ytDesc} onChange={e => setYtDesc(e.target.value)} rows={2} className="w-full p-2 text-sm rounded-lg border" />
                    </div>

                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Tags (คั่นด้วย ,)</label>
                        <input value={ytTags} onChange={e => setYtTags(e.target.value)} placeholder="shorts, ขายของ, สินค้า" className="w-full p-2 text-sm rounded-lg border" />
                    </div>
                </div>
            )}

            {/* Schedule Section */}
            {hasSelected && (
                <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">เวลาโพสต์</label>
                    <div className="flex gap-3 mb-3">
                        <button onClick={() => setScheduleType("now")} className={cn("flex-1 p-3 rounded-lg border text-center", scheduleType === "now" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200")}>
                            <span className="text-lg">⚡</span>
                            <p className="text-sm">โพสต์ทันที</p>
                        </button>
                        <button onClick={() => setScheduleType("later")} className={cn("flex-1 p-3 rounded-lg border text-center", scheduleType === "later" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-gray-200")}>
                            <Calendar className="w-5 h-5 mx-auto" />
                            <p className="text-sm">กำหนดเวลา</p>
                        </button>
                    </div>

                    {scheduleType === "later" && (
                        <div className="grid grid-cols-2 gap-3">
                            <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="p-2 rounded-lg border" />
                            <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="p-2 rounded-lg border" />
                            <div className="col-span-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                <Info className="w-4 h-4" />
                                แนะนำ: 19:00-22:00 น. มักได้ engagement สูง
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Submit */}
            <Button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                disabled={!hasSelected || isPublishing}
                onClick={handlePublish}
            >
                {isPublishing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />กำลังโพสต์...</>
                ) : (
                    <>🚀 {scheduleType === "later" ? "ตั้งเวลาโพสต์" : "โพสต์ไปทุกแพลตฟอร์ม"}</>
                )}
            </Button>
        </div>
    );
}
