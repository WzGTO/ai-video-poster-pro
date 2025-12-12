"use client";

import { useState, useEffect } from "react";
import { Check, AlertCircle, Loader2, Link2, Clock, Rocket, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateTimePicker, RecommendedTimes } from "@/components/scheduling";
import { HashtagInput, TagInput } from "@/components/forms";
import { cn } from "@/lib/utils";

// Types
interface FacebookPage {
    id: string;
    name: string;
    category?: string;
    pictureUrl?: string;
}

interface SocialStatus {
    tiktok: boolean;
    facebook: boolean;
    youtube: boolean;
}

interface AdvancedPublishingFormProps {
    video: {
        id: string;
        title?: string;
        public_url: string;
        product_id?: string;
        duration?: number;
    };
    tiktokProductId?: string;
    socialStatus: SocialStatus;
    onPublish: (data: PublishData) => Promise<void>;
    onSaveDraft?: (data: PublishData) => void;
}

interface PublishData {
    videoId: string;
    platforms: string[];
    captions: Record<string, string>;
    hashtags: Record<string, string[]>;
    tiktokProductId?: string;
    facebook: {
        targetType: "page" | "profile";
        targetId?: string;
        videoType: "reel" | "regular";
    };
    youtube: {
        title: string;
        description: string;
        tags: string[];
        videoType: "short" | "regular";
    };
    scheduleAt: string | null;
}

// Hashtag suggestions
const TIKTOK_HASHTAGS = ["fyp", "foryou", "viral", "tiktokshop", "รีวิวสินค้า", "ช้อปปิ้ง", "ลดราคา", "ของดี"];
const FACEBOOK_HASHTAGS = ["ช้อปปิ้งออนไลน์", "สินค้าดี", "รีวิว", "ลดราคา", "โปรโมชั่น"];

export function AdvancedPublishingForm({
    video,
    tiktokProductId,
    socialStatus,
    onPublish,
    onSaveDraft,
}: AdvancedPublishingFormProps) {
    // Platform selection
    const [platforms, setPlatforms] = useState({
        tiktok: false,
        facebook: false,
        youtube: false,
    });

    // Captions
    const [captions, setCaptions] = useState({
        tiktok: "",
        facebook: "",
        youtube: "",
    });

    // Hashtags
    const [hashtags, setHashtags] = useState<Record<string, string[]>>({
        tiktok: [],
        facebook: [],
    });

    // Facebook options
    const [facebookTarget, setFacebookTarget] = useState<"page" | "profile">("page");
    const [selectedPageId, setSelectedPageId] = useState("");
    const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
    const [loadingPages, setLoadingPages] = useState(false);
    const [facebookVideoType, setFacebookVideoType] = useState<"reel" | "regular">("reel");

    // YouTube options
    const [youtubeVideoType, setYoutubeVideoType] = useState<"short" | "regular">("short");
    const [youtubeTitle, setYoutubeTitle] = useState(video.title || "");
    const [youtubeDescription, setYoutubeDescription] = useState("");
    const [youtubeTags, setYoutubeTags] = useState<string[]>([]);

    // Scheduling
    const [scheduleOption, setScheduleOption] = useState<"now" | "schedule">("now");
    const [scheduledDateTime, setScheduledDateTime] = useState<Date | null>(null);

    // Loading state
    const [isPublishing, setIsPublishing] = useState(false);

    // Check if any platform is selected
    const hasSelectedPlatform = Object.values(platforms).some(Boolean);

    // Fetch Facebook pages function
    const fetchFacebookPages = async () => {
        if (facebookPages.length > 0) return; // Already have pages
        setLoadingPages(true);
        try {
            const res = await fetch("/api/social/facebook/pages");
            if (res.ok) {
                const data = await res.json();
                setFacebookPages(data.pages || []);
                if (data.pages?.length > 0) {
                    setSelectedPageId(data.pages[0].id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch Facebook pages:", error);
        } finally {
            setLoadingPages(false);
        }
    };

    // Fetch Facebook pages when needed
    useEffect(() => {
        if (platforms.facebook && facebookTarget === "page") {
            fetchFacebookPages();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [platforms.facebook, facebookTarget]);

    function togglePlatform(platform: keyof typeof platforms) {
        setPlatforms((prev) => ({ ...prev, [platform]: !prev[platform] }));
    }

    async function handlePublish() {
        if (!hasSelectedPlatform) return;

        setIsPublishing(true);

        const publishData: PublishData = {
            videoId: video.id,
            platforms: Object.keys(platforms).filter((k) => platforms[k as keyof typeof platforms]),
            captions,
            hashtags,
            tiktokProductId,
            facebook: {
                targetType: facebookTarget,
                targetId: facebookTarget === "page" ? selectedPageId : undefined,
                videoType: facebookVideoType,
            },
            youtube: {
                title: youtubeTitle,
                description: youtubeDescription,
                tags: youtubeTags,
                videoType: youtubeVideoType,
            },
            scheduleAt: scheduleOption === "schedule" && scheduledDateTime ? scheduledDateTime.toISOString() : null,
        };

        try {
            await onPublish(publishData);
        } finally {
            setIsPublishing(false);
        }
    }

    function handleSaveDraft() {
        if (onSaveDraft) {
            onSaveDraft({
                videoId: video.id,
                platforms: Object.keys(platforms).filter((k) => platforms[k as keyof typeof platforms]),
                captions,
                hashtags,
                tiktokProductId,
                facebook: {
                    targetType: facebookTarget,
                    targetId: facebookTarget === "page" ? selectedPageId : undefined,
                    videoType: facebookVideoType,
                },
                youtube: {
                    title: youtubeTitle,
                    description: youtubeDescription,
                    tags: youtubeTags,
                    videoType: youtubeVideoType,
                },
                scheduleAt: null,
            });
        }
    }

    return (
        <div className="space-y-8">
            {/* Section: Platform Selection */}
            <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">เลือกแพลตฟอร์ม</h3>

                <div className="space-y-4">
                    {/* TikTok */}
                    <PlatformCard
                        platform="tiktok"
                        label="TikTok Shop"
                        icon="🛒"
                        connected={socialStatus.tiktok}
                        selected={platforms.tiktok}
                        onToggle={() => togglePlatform("tiktok")}
                    >
                        {platforms.tiktok && (
                            <div className="mt-4 space-y-4">
                                {tiktokProductId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Product ID
                                        </label>
                                        <input
                                            type="text"
                                            value={tiktokProductId}
                                            readOnly
                                            className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-900 text-gray-500"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caption</label>
                                    <textarea
                                        value={captions.tiktok}
                                        onChange={(e) => setCaptions({ ...captions, tiktok: e.target.value })}
                                        placeholder="เขียน caption โฆษณา..."
                                        rows={3}
                                        maxLength={2000}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                    />
                                    <p className="text-xs text-gray-500 text-right mt-1">{captions.tiktok.length}/2000</p>
                                </div>

                                <HashtagInput
                                    label="Hashtags"
                                    value={hashtags.tiktok}
                                    onChange={(tags) => setHashtags({ ...hashtags, tiktok: tags })}
                                    suggestions={TIKTOK_HASHTAGS}
                                    maxTags={10}
                                />
                            </div>
                        )}
                    </PlatformCard>

                    {/* Facebook */}
                    <PlatformCard
                        platform="facebook"
                        label="Facebook"
                        icon="📘"
                        connected={socialStatus.facebook}
                        selected={platforms.facebook}
                        onToggle={() => togglePlatform("facebook")}
                    >
                        {platforms.facebook && (
                            <div className="mt-4 space-y-4">
                                {/* Target Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">โพสต์ไปที่</label>
                                    <div className="flex gap-2">
                                        <RadioButton
                                            value="page"
                                            selected={facebookTarget === "page"}
                                            onChange={() => setFacebookTarget("page")}
                                            label="📄 Facebook Page"
                                        />
                                        <RadioButton
                                            value="profile"
                                            selected={facebookTarget === "profile"}
                                            onChange={() => setFacebookTarget("profile")}
                                            label="👤 Profile ส่วนตัว"
                                        />
                                    </div>
                                </div>

                                {/* Page Selector */}
                                {facebookTarget === "page" && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">เลือก Page</label>
                                        {loadingPages ? (
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>กำลังโหลด Pages...</span>
                                            </div>
                                        ) : facebookPages.length > 0 ? (
                                            <select
                                                value={selectedPageId}
                                                onChange={(e) => setSelectedPageId(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                            >
                                                {facebookPages.map((page) => (
                                                    <option key={page.id} value={page.id}>
                                                        {page.name}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-sm text-gray-500">ไม่พบ Pages กรุณาเชื่อมต่อ Facebook ใหม่</p>
                                        )}
                                    </div>
                                )}

                                {/* Video Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ประเภทวิดีโอ</label>
                                    <div className="space-y-2">
                                        <RadioButton
                                            value="reel"
                                            selected={facebookVideoType === "reel"}
                                            onChange={() => setFacebookVideoType("reel")}
                                            label="🎬 Reels (คลิปสั้น - แนะนำ)"
                                            description="เหมาะกับวิดีโอ 15-90 วินาที"
                                        />
                                        <RadioButton
                                            value="regular"
                                            selected={facebookVideoType === "regular"}
                                            onChange={() => setFacebookVideoType("regular")}
                                            label="📹 วิดีโอปกติ"
                                            description="เหมาะกับวิดีโอยาว"
                                        />
                                    </div>
                                </div>

                                {/* Caption */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Caption</label>
                                    <textarea
                                        value={captions.facebook}
                                        onChange={(e) => setCaptions({ ...captions, facebook: e.target.value })}
                                        placeholder="เขียน caption..."
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                    />
                                </div>

                                <HashtagInput
                                    label="Hashtags"
                                    value={hashtags.facebook}
                                    onChange={(tags) => setHashtags({ ...hashtags, facebook: tags })}
                                    suggestions={FACEBOOK_HASHTAGS}
                                />
                            </div>
                        )}
                    </PlatformCard>

                    {/* YouTube */}
                    <PlatformCard
                        platform="youtube"
                        label="YouTube"
                        icon="📺"
                        connected={socialStatus.youtube}
                        selected={platforms.youtube}
                        onToggle={() => togglePlatform("youtube")}
                    >
                        {platforms.youtube && (
                            <div className="mt-4 space-y-4">
                                {/* Video Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ประเภทวิดีโอ</label>
                                    <div className="space-y-2">
                                        <RadioButton
                                            value="short"
                                            selected={youtubeVideoType === "short"}
                                            onChange={() => setYoutubeVideoType("short")}
                                            label="⚡ YouTube Shorts (แนะนำ)"
                                            description="วิดีโอแนวตั้ง สูงสุด 60 วินาที"
                                        />
                                        <RadioButton
                                            value="regular"
                                            selected={youtubeVideoType === "regular"}
                                            onChange={() => setYoutubeVideoType("regular")}
                                            label="🎥 วิดีโอปกติ"
                                            description="วิดีโอยาว มี monetization"
                                        />
                                    </div>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={youtubeTitle}
                                        onChange={(e) => setYoutubeTitle(e.target.value)}
                                        placeholder={youtubeVideoType === "short" ? "จะเพิ่ม #Shorts ให้อัตโนมัติ" : "ชื่อวิดีโอ"}
                                        maxLength={100}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                    />
                                    <p className="text-xs text-gray-500 text-right mt-1">{youtubeTitle.length}/100</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                    <textarea
                                        value={youtubeDescription}
                                        onChange={(e) => setYoutubeDescription(e.target.value)}
                                        placeholder="รายละเอียดวิดีโอ..."
                                        rows={4}
                                        maxLength={5000}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                    />
                                    <p className="text-xs text-gray-500 text-right mt-1">{youtubeDescription.length}/5000</p>
                                </div>

                                {/* Tags */}
                                <TagInput label="Tags" value={youtubeTags} onChange={setYoutubeTags} maxTags={30} />
                            </div>
                        )}
                    </PlatformCard>
                </div>
            </section>

            {/* Section: Scheduling */}
            <section>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ตั้งเวลาโพสต์</h3>

                <div className="space-y-4">
                    <div className="flex gap-2">
                        <RadioButton
                            value="now"
                            selected={scheduleOption === "now"}
                            onChange={() => setScheduleOption("now")}
                            label="🚀 โพสต์ทันที"
                        />
                        <RadioButton
                            value="schedule"
                            selected={scheduleOption === "schedule"}
                            onChange={() => setScheduleOption("schedule")}
                            label="📅 กำหนดเวลา"
                        />
                    </div>

                    {scheduleOption === "schedule" && (
                        <div className="ml-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                            <DateTimePicker
                                label="วันที่และเวลาที่ต้องการโพสต์"
                                value={scheduledDateTime}
                                onChange={setScheduledDateTime}
                                minDate={new Date()}
                                timeZone="Asia/Bangkok"
                            />

                            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    💡 เวลาแนะนำสำหรับคนไทย: 19:00-22:00 น.
                                </p>
                            </div>

                            <RecommendedTimes onSelect={setScheduledDateTime} />
                        </div>
                    )}
                </div>
            </section>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                    size="lg"
                    onClick={handlePublish}
                    disabled={!hasSelectedPlatform || isPublishing}
                    className="flex-1"
                >
                    {isPublishing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            กำลังโพสต์...
                        </>
                    ) : scheduleOption === "now" ? (
                        <>
                            <Rocket className="w-4 h-4 mr-2" />
                            🚀 โพสต์ไปทุกแพลตฟอร์ม
                        </>
                    ) : (
                        <>
                            <Clock className="w-4 h-4 mr-2" />
                            📅 ตั้งเวลาโพสต์
                        </>
                    )}
                </Button>

                {onSaveDraft && (
                    <Button variant="outline" size="lg" onClick={handleSaveDraft}>
                        <Save className="w-4 h-4 mr-2" />
                        💾 บันทึกแบบร่าง
                    </Button>
                )}
            </div>
        </div>
    );
}

// Platform Card Component
function PlatformCard({
    platform,
    label,
    icon,
    connected,
    selected,
    onToggle,
    children,
}: {
    platform: string;
    label: string;
    icon: string;
    connected: boolean;
    selected: boolean;
    onToggle: () => void;
    children?: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "rounded-2xl border-2 p-4 transition-all",
                selected
                    ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            )}
        >
            <div className="flex items-center justify-between">
                <button
                    onClick={connected ? onToggle : undefined}
                    disabled={!connected}
                    className={cn("flex items-center gap-3", !connected && "opacity-50 cursor-not-allowed")}
                >
                    <div
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
                            selected ? "bg-blue-100 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-700"
                        )}
                    >
                        {icon}
                    </div>
                    <div className="text-left">
                        <div className="font-medium text-gray-900 dark:text-white">{label}</div>
                        {connected ? (
                            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                เชื่อมต่อแล้ว
                            </div>
                        ) : (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                ยังไม่เชื่อมต่อ
                            </div>
                        )}
                    </div>
                </button>

                <div
                    className={cn(
                        "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer",
                        selected
                            ? "bg-blue-500 border-blue-500 text-white"
                            : "border-gray-300 dark:border-gray-600"
                    )}
                    onClick={connected ? onToggle : undefined}
                >
                    {selected && <Check className="w-4 h-4" />}
                </div>
            </div>

            {/* Expanded Content */}
            {selected && connected && <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">{children}</div>}

            {/* Connect Button */}
            {!connected && (
                <a
                    href={`/api/social/connect/${platform}`}
                    className="mt-4 block w-full text-center py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    เชื่อมต่อ {label}
                </a>
            )}
        </div>
    );
}

// Radio Button Component
function RadioButton({
    value,
    selected,
    onChange,
    label,
    description,
}: {
    value: string;
    selected: boolean;
    onChange: () => void;
    label: string;
    description?: string;
}) {
    return (
        <button
            onClick={onChange}
            className={cn(
                "flex-1 p-3 rounded-xl border-2 text-left transition-all",
                selected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
            )}
        >
            <div className="flex items-center gap-2">
                <div
                    className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        selected ? "border-blue-500" : "border-gray-300"
                    )}
                >
                    {selected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
            </div>
            {description && <p className="text-xs text-gray-500 mt-1 ml-6">{description}</p>}
        </button>
    );
}
