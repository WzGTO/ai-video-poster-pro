"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Product } from "@/types/database";

// ===== Types =====

export interface VideoCreationState {
    // Step 1
    mode: "auto" | "manual" | null;

    // Step 2
    productId: string | null;
    product: Product | null;

    // Step 3
    aspectRatio: "9:16" | "16:9" | "1:1";
    duration: number;
    style: string;
    voice: string;
    music: string;
    highlights: string;

    // Manual mode
    selectedImages: string[];
    script: string;
    cameraAngles: string[];

    // Options
    subtitle: { enabled: boolean; style?: string };
    watermark: { enabled: boolean; text: string; position: string; opacity: number };

    // Step 4
    textModel: string;
    videoModel: string;
    imageEnhancement: boolean;
}

interface Progress {
    status: string;
    progress: number;
    stepMessage: string;
}

// ===== Initial State =====

const initialState: VideoCreationState = {
    mode: null,
    productId: null,
    product: null,
    aspectRatio: "9:16",
    duration: 15,
    style: "auto",
    voice: "auto",
    music: "none",
    highlights: "",
    selectedImages: [],
    script: "",
    cameraAngles: [],
    subtitle: { enabled: true, style: "minimal" },
    watermark: { enabled: false, text: "", position: "bottom-right", opacity: 0.8 },
    textModel: "gemini-2.0-flash",
    videoModel: "veo-3.1",
    imageEnhancement: false,
};

// ===== Hook =====

export function useVideoCreation() {
    const [state, setState] = useState<VideoCreationState>(initialState);
    const [isCreating, setIsCreating] = useState(false);
    const [videoId, setVideoId] = useState<string | null>(null);
    const [progress, setProgress] = useState<Progress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Update state
    const updateState = useCallback((updates: Partial<VideoCreationState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Reset state
    const resetState = useCallback(() => {
        setState(initialState);
        setIsCreating(false);
        setVideoId(null);
        setProgress(null);
        setError(null);
    }, []);

    // Validation
    const validate = useCallback((step: number): boolean => {
        switch (step) {
            case 1: return state.mode !== null;
            case 2: return state.productId !== null;
            case 3: return true; // All have defaults
            case 4: return !!state.textModel && !!state.videoModel;
            case 5: return true;
            default: return false;
        }
    }, [state]);

    // Poll for progress
    const pollProgress = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/videos/status/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProgress({
                    status: data.status,
                    progress: data.progress || 0,
                    stepMessage: data.stepMessage || "",
                });

                if (data.status === "completed" || data.status === "failed") {
                    if (pollingRef.current) {
                        clearInterval(pollingRef.current);
                        pollingRef.current = null;
                    }
                    if (data.status === "failed") {
                        setError(data.error || "สร้างวิดีโอไม่สำเร็จ");
                    }
                }
            }
        } catch (err) {
            console.error("Poll error:", err);
        }
    }, []);

    // Create video
    const createVideo = useCallback(async () => {
        setIsCreating(true);
        setError(null);
        setProgress({ status: "pending", progress: 0, stepMessage: "เริ่มต้น..." });

        try {
            const res = await fetch("/api/videos/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: state.productId,
                    mode: state.mode,
                    aspectRatio: state.aspectRatio,
                    duration: state.duration || undefined,
                    style: state.style !== "auto" ? state.style : undefined,
                    voice: state.voice !== "auto" ? state.voice : undefined,
                    music: state.music !== "none" ? state.music : undefined,
                    highlights: state.highlights || undefined,
                    selectedImages: state.selectedImages.length > 0 ? state.selectedImages : undefined,
                    script: state.script || undefined,
                    cameraAngles: state.cameraAngles.length > 0 ? state.cameraAngles : undefined,
                    subtitle: state.subtitle,
                    watermark: state.watermark,
                    models: {
                        text: state.textModel,
                        video: state.videoModel,
                    },
                    imageEnhancement: state.imageEnhancement,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create video");
            }

            setVideoId(data.videoId);

            // Start polling for progress
            pollingRef.current = setInterval(() => pollProgress(data.videoId), 3000);

        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            setIsCreating(false);
        }
    }, [state, pollProgress]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    return {
        state,
        updateState,
        resetState,
        validate,
        createVideo,
        isCreating,
        videoId,
        progress,
        error,
    };
}
