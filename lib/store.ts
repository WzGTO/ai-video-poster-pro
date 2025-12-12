import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, UserSettings, Video, Post } from "@/types";

interface AppState {
    // Products
    products: Product[];
    setProducts: (products: Product[]) => void;
    addProduct: (product: Product) => void;

    // Current Product (for video creation)
    currentProduct: Product | null;
    setCurrentProduct: (product: Product | null) => void;

    // Videos
    videos: Video[];
    setVideos: (videos: Video[]) => void;
    addVideo: (video: Video) => void;
    updateVideo: (id: string, updates: Partial<Video>) => void;

    // Posts
    posts: Post[];
    setPosts: (posts: Post[]) => void;
    addPost: (post: Post) => void;

    // User Settings
    settings: UserSettings;
    updateSettings: (settings: Partial<UserSettings>) => void;

    // UI State
    isLoading: boolean;
    setLoading: (loading: boolean) => void;

    // Error handling
    error: string | null;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Products
            products: [],
            setProducts: (products) => set({ products }),
            addProduct: (product) =>
                set((state) => ({ products: [...state.products, product] })),

            // Current Product
            currentProduct: null,
            setCurrentProduct: (product) => set({ currentProduct: product }),

            // Videos
            videos: [],
            setVideos: (videos) => set({ videos }),
            addVideo: (video) =>
                set((state) => ({ videos: [...state.videos, video] })),
            updateVideo: (id, updates) =>
                set((state) => ({
                    videos: state.videos.map((v) =>
                        v.id === id ? { ...v, ...updates } : v
                    ),
                })),

            // Posts
            posts: [],
            setPosts: (posts) => set({ posts }),
            addPost: (post) =>
                set((state) => ({ posts: [...state.posts, post] })),

            // Settings
            settings: {
                autoWatermark: true,
                watermarkPosition: "bottom-right",
                watermarkOpacity: 40,
            },
            updateSettings: (newSettings) =>
                set((state) => ({
                    settings: { ...state.settings, ...newSettings },
                })),

            // UI State
            isLoading: false,
            setLoading: (loading) => set({ isLoading: loading }),

            // Error
            error: null,
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),
        }),
        {
            name: "ai-video-poster-storage",
            partialize: (state) => ({
                settings: state.settings,
            }),
        }
    )
);
