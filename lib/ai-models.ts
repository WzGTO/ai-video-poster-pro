// AI Model Configurations and Utilities

export interface TextModel {
    id: string;
    name: string;
    description: string;
    provider: "google" | "openai" | "anthropic" | "huggingface";
    free: boolean;
    recommended?: boolean;
}

export interface VideoModel {
    id: string;
    name: string;
    description: string;
    provider: string;
    free: boolean;
    freeLimit?: string;
    recommended?: boolean;
}

export const TEXT_MODELS: TextModel[] = [
    {
        id: "gemini-2.0-flash-thinking",
        name: "Gemini 2.0 Flash Thinking Exp",
        description: "รุ่นล่าสุด! คิดเป็น reasoning + รองรับภาษาไทยดีสุด",
        provider: "google",
        free: true,
        recommended: true,
    },
    {
        id: "gemini-exp-1206",
        name: "Gemini Exp 1206",
        description: "Experimental model คุณภาพสูง",
        provider: "google",
        free: true,
    },
    {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        description: "รุ่น stable เร็วมาก",
        provider: "google",
        free: true,
    },
    {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        description: "คิดลึก เหมาะกับเนื้อหาซับซ้อน",
        provider: "google",
        free: true,
        freeLimit: "50 requests/day",
    },
    {
        id: "llama-3.3-70b-thai",
        name: "Llama 3.3 70B Thai",
        description: "Open source รองรับภาษาไทย",
        provider: "huggingface",
        free: true,
    },
    {
        id: "gpt-4o-mini",
        name: "GPT-4o mini",
        description: "เร็ว ถูก",
        provider: "openai",
        free: false,
    },
    {
        id: "claude-3.5-haiku",
        name: "Claude 3.5 Haiku",
        description: "เร็วที่สุด เนื้อหาคุณภาพ",
        provider: "anthropic",
        free: false,
    },
];

export const VIDEO_MODELS: VideoModel[] = [
    {
        id: "veo-3.1",
        name: "Google Veo 3.1",
        description: "รุ่นล่าสุด! รองรับภาษาไทย + มุมกล้องแม่นยำ + คุณภาพสูงสุด",
        provider: "Google AI Studio",
        free: true,
        recommended: true,
    },
    {
        id: "veo-2",
        name: "Google Veo 2",
        description: "รองรับภาษาไทย คุณภาพดี",
        provider: "Google AI Studio",
        free: true,
    },
    {
        id: "luma-dream",
        name: "Luma Dream Machine",
        description: "คุณภาพใกล้เคียง Sora ใช้งานง่าย",
        provider: "Luma AI",
        free: true,
        freeLimit: "30 videos/month",
    },
    {
        id: "kling-1.6",
        name: "Kling AI 1.6",
        description: "รุ่นใหม่! รองรับ camera controls ดี",
        provider: "Kling AI",
        free: true,
        freeLimit: "66 credits/day",
    },
    {
        id: "hailuo-minimax",
        name: "Hailuo MiniMax AI",
        description: "ฟรีไม่จำกัด คุณภาพดี",
        provider: "HailuoAI",
        free: true,
        freeLimit: "Unlimited",
    },
    {
        id: "runway-gen3",
        name: "Runway Gen-3 Alpha Turbo",
        description: "Cinematic quality มืออาชีพ",
        provider: "Runway ML",
        free: true,
        freeLimit: "Free tier",
    },
    {
        id: "pika-2.0",
        name: "Pika 2.0",
        description: "Effects เยอะ สนุก",
        provider: "Pika Labs",
        free: true,
        freeLimit: "Free tier",
    },
    {
        id: "ltxv",
        name: "LTXV",
        description: "Open source unlimited แต่คุณภาพปานกลาง",
        provider: "Hugging Face",
        free: true,
        freeLimit: "Unlimited",
    },
];

// Thai Voice Options for TTS
export const THAI_VOICES = [
    {
        id: "iapp-female-warm",
        name: "เสียงผู้หญิงไทย - อบอุ่น",
        provider: "iApp TTS",
        gender: "female",
        description: "เสียงนุ่มนวล อบอุ่น เหมาะกับสินค้าความงาม",
    },
    {
        id: "iapp-female-confident",
        name: "เสียงผู้หญิงไทย - มั่นใจ",
        provider: "Google Cloud TTS",
        gender: "female",
        description: "เสียงชัดเจน มั่นใจ เหมาะกับสินค้าแฟชั่น",
    },
    {
        id: "azure-female-genz",
        name: "เสียงผู้หญิงไทย - Gen Z สดใส",
        provider: "Azure TTS",
        gender: "female",
        description: "เสียงสดใส ทันสมัย เหมาะกับ TikTok",
    },
    {
        id: "iapp-male-natural",
        name: "เสียงผู้ชายไทย - ธรรมชาติ",
        provider: "iApp TTS",
        gender: "male",
        description: "เสียงธรรมชาติ ไว้ใจได้",
    },
    {
        id: "google-male-pro",
        name: "เสียงผู้ชายไทย - มืออาชีพ",
        provider: "Google TTS",
        gender: "male",
        description: "เสียงมืออาชีพ เป็นทางการ",
    },
    {
        id: "did-ai-thai",
        name: "เสียง AI ไทย - ทันสมัย",
        provider: "D-ID",
        gender: "neutral",
        description: "เสียง AI ทันสมัย เทคโนโลยี",
    },
];

// Camera Angles and Movements
export const CAMERA_ANGLES = {
    basic: [
        { id: "closeup", name: "Close-up", icon: "📷", description: "ซูมใกล้รายละเอียด" },
        { id: "medium", name: "Medium shot", icon: "🎬", description: "โชว์สินค้าทั้งหมด" },
        { id: "wide", name: "Wide shot", icon: "🌅", description: "มุมกว้างบรรยากาศ" },
        { id: "topdown", name: "Top-down", icon: "🔝", description: "Bird's eye มองบนลงล่าง" },
        { id: "eyelevel", name: "Eye-level", icon: "👁️", description: "ระดับสายตา" },
        { id: "lowangle", name: "Low angle", icon: "⬆️", description: "มองล่างขึ้นบน ดูใหญ่" },
        { id: "highangle", name: "High angle", icon: "⬇️", description: "มองบนลงล่าง ดูน่ารัก" },
    ],
    movements: [
        { id: "rotate360", name: "360° Rotation", icon: "↩️", description: "หมุนรอบสินค้า" },
        { id: "panleft", name: "Pan left to right", icon: "➡️", description: "แพนซ้ายไปขวา" },
        { id: "panright", name: "Pan right to left", icon: "⬅️", description: "แพนขวาไปซ้าย" },
        { id: "orbit", name: "Orbit around", icon: "🔄", description: "โคจรรอบสินค้า" },
        { id: "zoomin", name: "Zoom in", icon: "🔍", description: "ซูมเข้าช้าๆ" },
        { id: "zoomout", name: "Zoom out", icon: "🔎", description: "ซูมออกช้าๆ" },
        { id: "pushin", name: "Push in", icon: "📹", description: "เข้าหาสินค้า" },
        { id: "pullout", name: "Pull out", icon: "📹", description: "ถอยห่างสินค้า" },
        { id: "dollyin", name: "Dolly in", icon: "🎥", description: "กล้องเลื่อนเข้า" },
        { id: "dollyout", name: "Dolly out", icon: "🎥", description: "กล้องเลื่อนออก" },
        { id: "craneup", name: "Crane up", icon: "🎢", description: "ยกกล้องขึ้น" },
        { id: "cranedown", name: "Crane down", icon: "🎢", description: "ลดกล้องลง" },
    ],
    creative: [
        { id: "dutch", name: "Dutch angle", icon: "🎨", description: "กล้องเอียง" },
        { id: "pov", name: "POV shot", icon: "🎭", description: "มุมมองบุคคลที่หนึ่ง" },
        { id: "mirror", name: "Mirror reflection", icon: "🪞", description: "สะท้อนกระจก" },
        { id: "throughglass", name: "Through glass/water", icon: "💧", description: "ผ่านแก้ว/น้ำ" },
        { id: "bokeh", name: "Bokeh background", icon: "🌈", description: "พื้นหลังเบลอสวย" },
        { id: "floating", name: "Floating objects", icon: "✨", description: "ของลอย" },
        { id: "macro", name: "Extreme macro", icon: "🔥", description: "ซูมสุดๆ" },
        { id: "split", name: "Split screen", icon: "🎬", description: "แบ่งหน้าจอ" },
        { id: "whippan", name: "Whip pan", icon: "🎪", description: "แพนเร็วมาก" },
        { id: "focuspull", name: "Focus pull", icon: "🎯", description: "เปลี่ยนโฟกัส" },
    ],
    effects: [
        { id: "slowmo", name: "Slow motion", icon: "🎞️", description: "สโลว์โมชั่น" },
        { id: "speedramp", name: "Speed ramp", icon: "⚡", description: "เร็วช้าสลับ" },
        { id: "freeze", name: "Freeze frame", icon: "⏸️", description: "หยุดภาพ" },
        { id: "glitch", name: "Glitch effect", icon: "🌟", description: "กระตุก" },
        { id: "colorgrade", name: "Color grading", icon: "🎨", description: "ปรับสีโทน" },
        { id: "particles", name: "Particle effects", icon: "💫", description: "อนุภาคกระจาย" },
        { id: "motionblur", name: "Motion blur", icon: "🌊", description: "เบลอการเคลื่อนไหว" },
        { id: "lightleaks", name: "Light leaks", icon: "✨", description: "แสงรั่ว" },
        { id: "lensflare", name: "Lens flare", icon: "🎆", description: "แสงส่องเลนส์" },
        { id: "vhs", name: "VHS/Retro effect", icon: "📺", description: "เอฟเฟกต์โบราณ" },
    ],
};

// Visual Styles
export const VISUAL_STYLES = [
    { id: "realistic", name: "ธรรมชาติ (Realistic)", icon: "🎨" },
    { id: "vibrant", name: "สีสันสดใส (Vibrant & Bold)", icon: "🌈" },
    { id: "cinematic", name: "Cinematic (ละครสวยหรู)", icon: "🎭" },
    { id: "pastel", name: "พาสเทล (Pastel Soft)", icon: "🌸" },
    { id: "monochrome", name: "ขาวดำ (Monochrome)", icon: "🖤" },
    { id: "warm", name: "Warm tone (โทนอบอุ่น)", icon: "🔥" },
    { id: "cool", name: "Cool tone (โทนเย็น)", icon: "❄️" },
    { id: "dreamy", name: "Dreamy (ฝันนุ่มนวล)", icon: "✨" },
    { id: "dark", name: "Dark & Moody (มืดลึกลับ)", icon: "🌃" },
    { id: "highcontrast", name: "High contrast (คอนทราสต์สูง)", icon: "💎" },
];

// Ad Templates
export const AD_TEMPLATES = [
    {
        id: "discount",
        name: "ลดแลกแจก",
        template: "{{name}} ลดราคา! จาก {{originalPrice}} เหลือ {{price}}! {{benefits}} สั่งเลย! 🔥",
    },
    {
        id: "review",
        name: "รีวิวสั้น",
        template: "ใช้แล้วชอบมาก! {{name}} {{benefits}} ราคาเพียง {{price}} คุ้มค่า 💕",
    },
    {
        id: "question",
        name: "คำถาม Hook",
        template: "รู้มั้ย {{problem}}? ลอง {{name}} สิ! {{benefits}} เพียง {{price}} ✨",
    },
    {
        id: "before-after",
        name: "Before/After",
        template: "ก่อนใช้ {{problem}} พอใช้ {{name}} {{results}} ราคา {{price}} 🌟",
    },
    {
        id: "pov",
        name: "POV TikTok",
        template: "POV: เมื่อเจอ {{name}} ราคา {{price}} 🔥💕 {{benefits}} #โคตรคุ้ม",
    },
    {
        id: "musthave",
        name: "ของต้องมี",
        template: "จะบอกให้! {{name}} {{benefits}} ราคาแค่ {{price}} ไม่ซื้อเสียดาย! 😱",
    },
    {
        id: "unboxing",
        name: "Unboxing",
        template: "มาดูกันว่า {{name}} ดีจริงมั้ย? {{benefits}} ราคา {{price}} 📦✨",
    },
];
