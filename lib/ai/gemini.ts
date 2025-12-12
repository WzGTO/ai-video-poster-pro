// Gemini AI Integration for Script Generation and Product Analysis
// Using Gemini 2.0 Flash and Gemini Vision

import { GoogleGenerativeAI } from "@google/generative-ai";

// ===== Types =====

export interface ScriptParams {
    productName: string;
    description?: string;
    price: number;
    currency?: string;
    style: ScriptStyle;
    duration: number; // seconds
    language?: "th" | "en";
    highlights?: string[];
    targetAudience?: string;
}

export type ScriptStyle =
    | "professional"
    | "casual"
    | "fun"
    | "luxury"
    | "musthave"
    | "tiktok"
    | "cute"
    | "minimal";

export interface ProductAnalysis {
    productType: string;
    category: string;
    keyFeatures: string[];
    targetAudience: string[];
    suggestedStyle: ScriptStyle;
    suggestedTone: string;
    suggestedCameraAngles: string[];
    suggestedEffects: string[];
    suggestedDuration: number;
    colorPalette: string[];
    moodKeywords: string[];
}

export interface RefineScriptParams {
    originalScript: string;
    feedback: string;
    style?: ScriptStyle;
}

// ===== Constants =====

const WORDS_PER_SECOND_TH = 2.5; // คนไทยพูดประมาณ 2.5 คำ/วินาที
const WORDS_PER_SECOND_EN = 2.8;

const STYLE_PROMPTS: Record<ScriptStyle, string> = {
    professional:
        "น่าเชื่อถือ เป็นทางการ ใช้ข้อมูลและตัวเลขสนับสนุน เน้นคุณภาพและความน่าไว้วางใจ",
    casual: "เป็นกันเอง พูดคุยเหมือนเพื่อน ใช้ภาษาง่ายๆ สบายๆ",
    fun: "สนุกสนาน มีอารมณ์ขัน ใช้คำพูดติดหู เป็นไวรัลได้",
    luxury: "หรูหรา พรีเมียม เน้นความเอ็กซ์คลูซีฟ ใช้คำที่สื่อถึงความพิเศษ",
    musthave: "เร่งด่วน ต้องมี อย่าพลาด ใช้ FOMO technique",
    tiktok:
        "สั้น กระชับ ติดหู เหมาะกับ TikTok มี hook แรกที่ดึงดูด ใช้คำแสลงได้",
    cute: "น่ารัก อ่อนหวาน ใช้คำน่ารักๆ เหมาะกับ target กลุ่มวัยรุ่น",
    minimal: "สั้น กระชับ ได้ใจความ ไม่เยิ่นเย้อ เน้นสาระสำคัญ",
};

// ===== Gemini Client =====

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
    }
    return new GoogleGenerativeAI(apiKey);
}

// ===== Main Functions =====

/**
 * Generate video script using Gemini 2.0 Flash
 */
export async function generateVideoScript(
    params: ScriptParams
): Promise<string> {
    const {
        productName,
        description,
        price,
        currency = "฿",
        style,
        duration,
        language = "th",
        highlights = [],
        targetAudience,
    } = params;

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
    });

    // Calculate target word count based on duration
    const wordsPerSecond =
        language === "th" ? WORDS_PER_SECOND_TH : WORDS_PER_SECOND_EN;
    const targetWordCount = Math.floor(duration * wordsPerSecond);

    // Build style description
    const styleDescription =
        STYLE_PROMPTS[style] || STYLE_PROMPTS.professional;

    // Build prompt
    const prompt = `คุณเป็นผู้เชี่ยวชาญด้านการเขียนบทโฆษณาสำหรับวิดีโอสั้นบน TikTok และ Social Media

สร้างบทพูดโฆษณาสินค้า${language === "th" ? "ภาษาไทย" : "ภาษาอังกฤษ"}สำหรับวิดีโอความยาว ${duration} วินาที

📦 ข้อมูลสินค้า:
- ชื่อ: ${productName}
- ราคา: ${currency}${price.toLocaleString()}
${description ? `- รายละเอียด: ${description}` : ""}
${highlights.length > 0 ? `- จุดเด่น: ${highlights.join(", ")}` : ""}
${targetAudience ? `- กลุ่มเป้าหมาย: ${targetAudience}` : ""}

🎨 สไตล์ที่ต้องการ: ${style}
${styleDescription}

📝 ข้อกำหนด:
1. ความยาวประมาณ ${targetWordCount} คำ (พอดีกับ ${duration} วินาที)
2. มี Hook แรกที่ดึงดูดความสนใจใน 3 วินาทีแรก
3. กล่าวถึงราคาและ call-to-action ชัดเจน
4. ใช้ภาษาที่เป็นธรรมชาติ เหมาะกับการพูด
5. ไม่ใช้ emoji หรือสัญลักษณ์พิเศษ

ให้เฉพาะบทพูดเท่านั้น ไม่ต้องมีคำอธิบายหรือหัวข้อ`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const script = response.text().trim();

        return script;
    } catch (error) {
        console.error("Gemini generateVideoScript error:", error);
        throw new Error(
            `Failed to generate script: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

/**
 * Analyze product using Gemini Vision
 */
export async function analyzeProduct(
    productData: {
        name: string;
        description?: string;
        price: number;
        category?: string;
    },
    imageUrls: string[]
): Promise<ProductAnalysis> {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
    });

    // Build image parts
    const imageParts = await Promise.all(
        imageUrls.slice(0, 4).map(async (url) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const base64 = Buffer.from(arrayBuffer).toString("base64");
                const mimeType = response.headers.get("content-type") || "image/jpeg";
                return {
                    inlineData: {
                        data: base64,
                        mimeType,
                    },
                };
            } catch {
                return null;
            }
        })
    );

    const validImageParts = imageParts.filter((p) => p !== null);

    const prompt = `วิเคราะห์สินค้านี้และให้คำแนะนำสำหรับการสร้างวิดีโอโฆษณา

📦 ข้อมูลสินค้า:
- ชื่อ: ${productData.name}
- ราคา: ${productData.price} บาท
${productData.description ? `- รายละเอียด: ${productData.description}` : ""}
${productData.category ? `- หมวดหมู่: ${productData.category}` : ""}

กรุณาวิเคราะห์และตอบในรูปแบบ JSON ดังนี้:
{
  "productType": "ประเภทสินค้า เช่น เครื่องสำอาง, เสื้อผ้า, อิเล็กทรอนิกส์",
  "category": "หมวดหมู่ย่อย",
  "keyFeatures": ["จุดเด่น 1", "จุดเด่น 2", "จุดเด่น 3"],
  "targetAudience": ["กลุ่มเป้าหมาย 1", "กลุ่มเป้าหมาย 2"],
  "suggestedStyle": "professional | casual | fun | luxury | musthave | tiktok | cute | minimal",
  "suggestedTone": "โทนการสื่อสารที่แนะนำ",
  "suggestedCameraAngles": ["มุมกล้องที่แนะนำ 1", "มุมกล้องที่แนะนำ 2"],
  "suggestedEffects": ["เอฟเฟกต์ที่แนะนำ 1", "เอฟเฟกต์ที่แนะนำ 2"],
  "suggestedDuration": 15,
  "colorPalette": ["#สีหลัก", "#สีรอง"],
  "moodKeywords": ["คีย์เวิร์ด mood 1", "คีย์เวิร์ด mood 2"]
}

ตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown code block`;

    try {
        const result = await model.generateContent([prompt, ...validImageParts]);
        const response = result.response;
        const text = response.text().trim();

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("Failed to parse analysis response");
        }

        const analysis = JSON.parse(jsonMatch[0]) as ProductAnalysis;
        return analysis;
    } catch (error) {
        console.error("Gemini analyzeProduct error:", error);

        // Return default analysis on error
        return {
            productType: "สินค้าทั่วไป",
            category: productData.category || "อื่นๆ",
            keyFeatures: ["คุณภาพดี", "ราคาคุ้มค่า"],
            targetAudience: ["ผู้ใช้ทั่วไป"],
            suggestedStyle: "tiktok",
            suggestedTone: "เป็นกันเอง สนุกสนาน",
            suggestedCameraAngles: ["close-up", "product-showcase"],
            suggestedEffects: ["zoom-in", "fade"],
            suggestedDuration: 15,
            colorPalette: ["#3B82F6", "#10B981"],
            moodKeywords: ["น่าสนใจ", "คุ้มค่า"],
        };
    }
}

/**
 * Refine script based on feedback
 */
export async function refineScript(
    params: RefineScriptParams
): Promise<string> {
    const { originalScript, feedback, style } = params;

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
    });

    const styleDescription = style
        ? STYLE_PROMPTS[style]
        : "";

    const prompt = `ปรับปรุงบทพูดโฆษณานี้ตาม feedback ที่ได้รับ

📝 บทพูดเดิม:
${originalScript}

💬 Feedback:
${feedback}

${styleDescription ? `🎨 สไตล์: ${styleDescription}` : ""}

ข้อกำหนด:
1. รักษาความยาวใกล้เคียงเดิม
2. ปรับตาม feedback อย่างเหมาะสม
3. คงจุดแข็งของบทเดิมไว้
4. ใช้ภาษาที่เป็นธรรมชาติ เหมาะกับการพูด

ให้เฉพาะบทพูดที่ปรับปรุงแล้ว ไม่ต้องมีคำอธิบาย`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const refinedScript = response.text().trim();

        return refinedScript;
    } catch (error) {
        console.error("Gemini refineScript error:", error);
        throw new Error(
            `Failed to refine script: ${error instanceof Error ? error.message : "Unknown error"}`
        );
    }
}

/**
 * Translate text using Gemini
 */
export async function translateText(
    text: string,
    fromLang: "th" | "en",
    toLang: "th" | "en"
): Promise<string> {
    if (fromLang === toLang) {
        return text;
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
    });

    const langNames = {
        th: "ภาษาไทย",
        en: "ภาษาอังกฤษ",
    };

    const prompt = `แปล${langNames[fromLang]}ต่อไปนี้เป็น${langNames[toLang]}

"${text}"

ให้เฉพาะคำแปลเท่านั้น ไม่ต้องมีคำอธิบาย`;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        return response.text().trim().replace(/^["']|["']$/g, "");
    } catch (error) {
        console.error("Gemini translateText error:", error);
        return text; // Return original on error
    }
}
