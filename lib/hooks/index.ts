/**
 * Hooks Module Exports
 */

// SWR Data Fetching Hooks
export {
    useProducts,
    useProduct,
    useVideos,
    useVideo,
    useVideoStatus,
    usePosts,
    useTemplates,
    useStorageInfo,
    useSocialStatus,
    useAnalytics,
    useDashboardStats,
    prefetch,
    globalMutate,
} from './useSWR';

// Video Creation Hook
export { useVideoCreation } from './useVideoCreation';

// Products Hook (legacy, use useProducts from useSWR instead)
// export { useProducts } from './useProducts';
