import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { productInfo, style, mode, modelChoice, duration } = body;

        // Select model based on choice
        let modelName = "gemini-2.0-flash-thinking-exp-1219";

        switch (modelChoice) {
            case "gemini-exp-1206":
                modelName = "gemini-exp-1206";
                break;
            case "gemini-2.0-flash":
                modelName = "gemini-2.0-flash-exp";
                break;
            case "gemini-1.5-pro":
                modelName = "gemini-1.5-pro-latest";
                break;
            default:
                modelName = "gemini-2.0-flash-thinking-exp-1219";
        }

        const model = genAI.getGenerativeModel({ model: modelName });

        // Build Thai context prompt
        const styleDescriptions: { [key: string]: string } = {
            minimal: "มินิมอล (Clean & Simple) - ใช้ภาษาง่ายๆ ตรงประเด็น ไม่เยิ่นเย้อ",
            fun: "สนุกสนาน (Fun & Energetic) - ใช้ภาษาสนุก มีพลัง ตื่นเต้น มีอิโมจิ",
            professional: "มืออาชีพ (Professional) - ภาษาเป็นทางการ น่าเชื่อถือ",
            tiktok: "TikTok Shop Viral Style - ภาษาดัง Trendy Gen Z Hook แรง",
            premium: "พรีเมียม (Luxury) - ภาษาหรูหรา เน้นคุณภาพ คุณค่า",
            musthave: "ของต้องมี (Must-Have FOMO) - สร้าง FOMO ต้องรีบซื้อ จำกัดเวลา",
            cute: "น่ารัก (Cute & Lovely) - ภาษาน่ารัก นุ่มนวล ละมุน",
        };

        const durationGuidelines = {
            5: "15-20 คำ (ประมาณ 5 วินาที)",
            10: "25-30 คำ (ประมาณ 10 วินาที)",
            15: "35-45 คำ (ประมาณ 15 วินาที)",
        };

        const wordCount = durationGuidelines[duration as keyof typeof durationGuidelines] || "25-30 คำ";

        const prompt = `
คุณเป็นนักเขียนโฆษณาภาษาไทยมืออาชีพ สร้างบทพูดโฆษณาสำหรับวิดีโอ TikTok Shop

ข้อมูลสินค้า:
- ชื่อ: ${productInfo.name}
- ราคา: ${productInfo.currency} ${productInfo.price}
- รายละเอียด: ${productInfo.description || "ไม่มี"}
- ประเภท: ${productInfo.category || "ทั่วไป"}

สไตล์: ${styleDescriptions[style] || styleDescriptions.tiktok}
ความยาว: ${wordCount}
โหมด: ${mode === "auto" ? "อัตโนมัติ - เลือกจุดขายที่ดีที่สุด" : "กำหนดเอง"}

คำแนะนำ:
1. เขียนเป็นภาษาไทยเท่านั้น
2. เริ่มต้นด้วย Hook ที่แรงดึงดูดความสนใจ
3. เน้นจุดเด่น ประโยชน์ของสินค้า
4. ใส่ราคาและ Call-to-action
5. ใช้อิโมจิให้เหมาะสมกับสไตล์
6. ห้ามเกิน ${wordCount}
7. ต้องฟังแล้วเข้าใจง่าย พูดตามสบาย

ตอบกลับเฉพาะบทพูดโฆษณาเท่านั้น ไม่ต้องอธิบายเพิ่มเติม
`;

        const result = await model.generateContent(prompt);
        const script = result.response.text().trim();

        // Estimate duration (Thai: ~100 characters per 10 seconds)
        const estimatedDuration = Math.ceil(script.length / 10);

        return NextResponse.json({
            script,
            estimatedDuration,
            wordCount: script.split(" ").length,
            characterCount: script.length,
            modelUsed: modelName,
        });
    } catch (error) {
        console.error("Script generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate script" },
            { status: 500 }
        );
    }
}
