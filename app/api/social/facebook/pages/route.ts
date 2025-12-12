import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { FacebookAPI } from "@/lib/social/facebook";
import { logger } from "@/lib/logger";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/social/facebook/pages
 * ดึงรายการ Facebook Pages ที่ผู้ใช้จัดการ
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // ดึง Facebook token จาก database
        const { data: tokenData, error: tokenError } = await supabase
            .from("user_tokens")
            .select("access_token")
            .eq("user_id", session.user.id)
            .eq("provider", "facebook")
            .single();

        if (tokenError || !tokenData?.access_token) {
            return NextResponse.json(
                { error: "Facebook not connected", connected: false },
                { status: 400 }
            );
        }

        const fbAPI = new FacebookAPI(tokenData.access_token);
        const pages = await fbAPI.getPages();

        // อัปเดต pages ใน database
        for (const page of pages) {
            await supabase.from("user_pages").upsert(
                {
                    user_id: session.user.id,
                    provider: "facebook",
                    page_id: page.id,
                    page_name: page.name,
                    access_token: page.accessToken,
                    picture_url: page.pictureUrl,
                    metadata: { category: page.category },
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,provider,page_id" }
            );
        }

        return NextResponse.json({
            pages: pages.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                pictureUrl: p.pictureUrl,
            })),
        });
    } catch (error) {
        logger.error("Failed to fetch Facebook pages", error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch pages" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/social/facebook/pages
 * เลือก page ที่จะใช้โพสต์
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { pageId } = await request.json();

        if (!pageId) {
            return NextResponse.json({ error: "Page ID required" }, { status: 400 });
        }

        // อัปเดต default page สำหรับ user
        await supabase
            .from("users")
            .update({ default_facebook_page_id: pageId })
            .eq("id", session.user.id);

        return NextResponse.json({ success: true, selectedPageId: pageId });
    } catch (error) {
        logger.error("Failed to select Facebook page", error);

        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to select page" },
            { status: 500 }
        );
    }
}
