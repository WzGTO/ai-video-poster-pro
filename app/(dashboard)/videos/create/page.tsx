"use client";

import { useSearchParams } from "next/navigation";
import { VideoCreationWizard } from "@/components/video-creation/VideoCreationWizard";

export default function CreateVideoPage() {
    const searchParams = useSearchParams();
    const productId = searchParams.get("productId");

    return (
        <div className="max-w-4xl mx-auto">
            <VideoCreationWizard initialProductId={productId} />
        </div>
    );
}
