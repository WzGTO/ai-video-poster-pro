import { logger } from "@/lib/logger";

// Types
export interface NotificationData {
    title: string;
    message: string;
    link?: string;
}

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

/**
 * ส่ง notification ให้ผู้ใช้
 *
 * ใช้ Resend (ฟรี 100 emails/day) หรือ SendGrid
 */
export async function sendNotification(
    email: string,
    data: NotificationData
): Promise<boolean> {
    const html = generateNotificationHtml(data);

    return sendEmail({
        to: email,
        subject: data.title,
        html,
        text: `${data.title}\n\n${data.message}${data.link ? `\n\nดูที่: ${data.link}` : ""}`,
    });
}

/**
 * ส่ง error notification
 */
export async function sendErrorNotification(
    email: string,
    post: { platform: string; caption?: string },
    error: string
): Promise<boolean> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Sarabun', sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">❌ การโพสต์ล้มเหลว</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            การโพสต์ไปยัง <strong>${post.platform}</strong> ไม่สำเร็จ
          </p>
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="color: #dc2626; margin: 0; font-size: 14px;">
              <strong>ข้อผิดพลาด:</strong> ${error}
            </p>
          </div>
          ${post.caption ? `<p style="color: #6b7280; font-size: 14px;">วิดีโอ: ${post.caption.slice(0, 100)}...</p>` : ""}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/posts" 
             style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            ดูรายละเอียด
          </a>
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            AI Video Poster Pro - Thai Edition
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: `❌ การโพสต์ไปยัง ${post.platform} ล้มเหลว`,
        html,
        text: `การโพสต์ไปยัง ${post.platform} ล้มเหลว\n\nข้อผิดพลาด: ${error}`,
    });
}

/**
 * Generate notification HTML
 */
function generateNotificationHtml(data: NotificationData): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Sarabun', sans-serif; background-color: #f5f5f5; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${data.title}</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ${data.message}
          </p>
          ${data.link
            ? `
            <a href="${data.link}" 
               style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
              ดูโพสต์
            </a>
          `
            : ""
        }
        </div>
        <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            AI Video Poster Pro - Thai Edition
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * ส่ง email ผ่าน provider ที่เลือก
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
    // Try Resend first
    if (process.env.RESEND_API_KEY) {
        return sendWithResend(options);
    }

    // Try SendGrid
    if (process.env.SENDGRID_API_KEY) {
        return sendWithSendGrid(options);
    }

    // Fallback: just log (for development)
    logger.info("Email would be sent (no provider configured)", {
        to: options.to,
        subject: options.subject,
    });
    return true;
}

/**
 * ส่ง email ผ่าน Resend
 * https://resend.com - ฟรี 100 emails/day
 */
async function sendWithResend(options: EmailOptions): Promise<boolean> {
    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: process.env.EMAIL_FROM || "AI Video Poster <noreply@resend.dev>",
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            logger.error("Resend email failed", error);
            return false;
        }

        logger.info("Email sent via Resend", { to: options.to, subject: options.subject });
        return true;
    } catch (error) {
        logger.error("Resend email error", error);
        return false;
    }
}

/**
 * ส่ง email ผ่าน SendGrid
 */
async function sendWithSendGrid(options: EmailOptions): Promise<boolean> {
    try {
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                personalizations: [
                    {
                        to: [{ email: options.to }],
                        subject: options.subject,
                    },
                ],
                from: {
                    email: process.env.EMAIL_FROM || "noreply@example.com",
                    name: "AI Video Poster Pro",
                },
                content: [
                    {
                        type: "text/html",
                        value: options.html,
                    },
                ],
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error("SendGrid email failed", { error });
            return false;
        }

        logger.info("Email sent via SendGrid", { to: options.to, subject: options.subject });
        return true;
    } catch (error) {
        logger.error("SendGrid email error", error);
        return false;
    }
}

/**
 * ส่ง welcome email
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    return sendNotification(email, {
        title: `ยินดีต้อนรับ ${name}! 🎉`,
        message: "ขอบคุณที่ใช้งาน AI Video Poster Pro เริ่มต้นสร้างวิดีโอโฆษณาอัตโนมัติได้เลย!",
        link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });
}

/**
 * ส่ง video ready notification
 */
export async function sendVideoReadyNotification(
    email: string,
    videoId: string,
    videoTitle: string
): Promise<boolean> {
    return sendNotification(email, {
        title: "วิดีโอพร้อมแล้ว! 🎬",
        message: `วิดีโอ "${videoTitle}" สร้างเสร็จเรียบร้อยแล้ว พร้อมโพสต์ได้ทันที`,
        link: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/videos/${videoId}`,
    });
}
