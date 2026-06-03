import { Resend } from "resend";
import type { CartItem } from "@/lib/payments/types";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtmlWithLineBreaks(str: string): string {
  return escapeHtml(str).replace(/\n/g, "<br>");
}

const FROM = process.env.RESEND_FROM_EMAIL ?? "Mystic Lab <noreply@mysticlab.com>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";

function isConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && ADMIN_EMAIL);
}

export async function sendOrderConfirmation({
  to,
  items,
  totalUsd,
  orderId,
}: {
  to: string;
  items: CartItem[];
  totalUsd: number;
  orderId: string | null;
}): Promise<void> {
  if (!isConfigured()) return;

  const itemRows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;color:#D1D5DB;border-bottom:1px solid #2D2D4E;">${item.name}</td>
          <td style="padding:8px 0;color:#D1D5DB;border-bottom:1px solid #2D2D4E;text-align:center;">${item.quantity}</td>
          <td style="padding:8px 0;color:#F59E0B;border-bottom:1px solid #2D2D4E;text-align:right;">$${(item.price_usd * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  const html = orderConfirmationHtml({ items, totalUsd, orderId, itemRows });

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Mystic Lab Order Confirmation",
    html,
  });
}

export async function sendCustomOrderNotification({
  customerName,
  customerEmail,
  description,
  budgetRange,
  desiredDeadline,
}: {
  customerName: string;
  customerEmail: string;
  description: string;
  budgetRange: string;
  desiredDeadline?: string | null;
}): Promise<void> {
  if (!isConfigured()) return;

  const html = customOrderAdminHtml({
    customerName,
    customerEmail,
    description,
    budgetRange,
    desiredDeadline,
  });

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: customerEmail,
    subject: `[Mystic Lab] New Custom Order Request from ${customerName}`,
    html,
  });
}

function orderConfirmationHtml({
  items,
  totalUsd,
  orderId,
  itemRows,
}: {
  items: CartItem[];
  totalUsd: number;
  orderId: string | null;
  itemRows: string;
}): string {
  void items;
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:32px;text-align:center;">
            <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:3px;">✦ MYSTIC LAB ✦</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:6px;letter-spacing:1px;">ORDER CONFIRMED</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <p style="color:#F0E6FF;font-size:16px;margin:0 0 8px;">Thank you for your order!</p>
            <p style="color:#9CA3AF;font-size:14px;margin:0 0 24px;">Your magical props are being prepared with care.</p>

            ${orderId ? `<p style="color:#6B7280;font-size:12px;margin:0 0 20px;">Order ID: <span style="color:#7C3AED;">${orderId}</span></p>` : ""}

            <!-- Items table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <th style="padding:8px 0;color:#6B7280;font-size:11px;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #2D2D4E;">Product</th>
                <th style="padding:8px 0;color:#6B7280;font-size:11px;text-align:center;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #2D2D4E;">Qty</th>
                <th style="padding:8px 0;color:#6B7280;font-size:11px;text-align:right;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #2D2D4E;">Price</th>
              </tr>
              ${itemRows}
              <tr>
                <td colspan="2" style="padding:12px 0 0;color:#F0E6FF;font-weight:600;">Total</td>
                <td style="padding:12px 0 0;color:#F59E0B;font-weight:700;font-size:18px;text-align:right;">$${totalUsd.toFixed(2)}</td>
              </tr>
            </table>

            <!-- Solution video note -->
            <div style="background:#13131F;border:1px solid #7C3AED33;border-radius:12px;padding:16px;margin-top:16px;">
              <p style="color:#A855F7;font-size:13px;font-weight:600;margin:0 0 6px;">🎬 Solution Tutorial Access</p>
              <p style="color:#9CA3AF;font-size:13px;margin:0;">
                Log in to your account and visit the product page to access your exclusive solution tutorial video.
                Your purchase has unlocked full tutorial access.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #2D2D4E;text-align:center;">
            <p style="color:#6B7280;font-size:12px;margin:0;">Questions? Reply to this email or contact us at support@mysticlab.com</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendCustomOrderReply({
  to,
  customerName,
  subject,
  message,
}: {
  to: string;
  customerName: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (!isConfigured()) return;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:24px 32px;">
            <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:2px;">✦ MYSTIC LAB</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;">Custom Order Update</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#F0E6FF;font-size:15px;margin:0 0 16px;">Hi ${escapeHtml(customerName)},</p>
            <div style="color:#D1D5DB;font-size:14px;line-height:1.8;white-space:pre-wrap;">${escapeHtmlWithLineBreaks(message)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #2D2D4E;text-align:center;">
            <p style="color:#6B7280;font-size:12px;margin:0;">Mystic Lab — Professional Magic Shop</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    replyTo: ADMIN_EMAIL || undefined,
    subject,
    html,
  });
}

export async function sendNewsletter({
  subject,
  html,
  recipients,
}: {
  subject: string;
  html: string;
  recipients: string[];
}): Promise<{ sent: number; failed: number }> {
  if (!isConfigured() || recipients.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const CHUNK = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const messages = chunk.map((to) => ({
      from: FROM,
      to,
      subject,
      html,
    }));

    try {
      await resend.batch.send(messages);
      sent += chunk.length;
    } catch {
      failed += chunk.length;
    }
  }

  return { sent, failed };
}

export async function sendLowStockAlert(
  items: { productName: string; stock: number }[]
): Promise<void> {
  if (!isConfigured() || items.length === 0) return;

  const rows = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;color:#F0E6FF;border-bottom:1px solid #2D2D4E;">${item.productName}</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;border-bottom:1px solid #2D2D4E;${item.stock === 0 ? "color:#EF4444;" : "color:#F59E0B;"}">${item.stock === 0 ? "품절" : item.stock + "개"}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#EF4444,#F59E0B);padding:24px 32px;">
            <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:2px;">⚠️ MYSTIC LAB — 재고 알림</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.9);margin-top:4px;">재고가 3개 이하인 상품이 있습니다</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2D2D4E;border-radius:8px;overflow:hidden;">
              <tr style="background:#13131F;">
                <th style="padding:8px 12px;text-align:left;color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:1px;">상품명</th>
                <th style="padding:8px 12px;text-align:center;color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:1px;">남은 재고</th>
              </tr>
              ${rows}
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/products"
                 style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;">
                상품 관리 →
              </a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `[Mystic Lab] 재고 부족 알림 — ${items.length}개 상품`,
    html,
  });
}

export async function sendContactInquiry({
  name,
  email,
  type,
  message,
  locale,
}: {
  name: string;
  email: string;
  type: string;
  message: string;
  locale: string;
}): Promise<void> {
  if (!isConfigured()) return;

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:24px 32px;">
            <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:2px;">✦ MYSTIC LAB — ADMIN</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">New Contact Inquiry</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:8px 0;border-bottom:1px solid #2D2D4E;">
                <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">From</div>
                <div style="color:#F0E6FF;font-size:14px;">${escapeHtml(name)} &lt;<a href="mailto:${escapeHtml(email)}" style="color:#A855F7;">${escapeHtml(email)}</a>&gt;</div>
              </td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #2D2D4E;">
                <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Topic</div>
                <div style="color:#F59E0B;font-size:14px;font-weight:600;">${escapeHtml(type)}</div>
              </td></tr>
              <tr><td style="padding:8px 0;border-bottom:1px solid #2D2D4E;">
                <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Locale</div>
                <div style="color:#D1D5DB;font-size:14px;">${escapeHtml(locale)}</div>
              </td></tr>
              <tr><td style="padding:8px 0;">
                <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Message</div>
                <div style="color:#D1D5DB;font-size:14px;line-height:1.6;background:#13131F;border-radius:8px;padding:12px;">${escapeHtmlWithLineBreaks(message)}</div>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: email,
    subject: `[Mystic Lab] Contact: ${type} from ${name}`,
    html,
  });
}

export async function sendShippingNotification({
  to,
  orderId,
  trackingNumber,
  carrier,
}: {
  to: string;
  orderId: string;
  trackingNumber: string;
  carrier?: string | null;
}): Promise<void> {
  if (!isConfigured()) return;

  const carrierLine = carrier ? `<p style="color:#9CA3AF;font-size:13px;margin:4px 0 0;">Carrier: ${carrier}</p>` : "";
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:24px 32px;">
            <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:2px;">✦ MYSTIC LAB</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:4px;letter-spacing:1px;">YOUR ORDER HAS SHIPPED</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="color:#F0E6FF;font-size:16px;margin:0 0 16px;">Great news — your order is on its way!</p>
            <p style="color:#9CA3AF;font-size:14px;margin:0 0 24px;">
              Order ID: <span style="color:#7C3AED;">${orderId.slice(0, 8).toUpperCase()}</span>
            </p>
            <div style="background:#13131F;border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:20px;text-align:center;">
              <p style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px;">Tracking Number</p>
              <p style="color:#F59E0B;font-size:22px;font-weight:700;font-family:monospace;margin:0;">${trackingNumber}</p>
              ${carrierLine}
            </div>
            <p style="color:#9CA3AF;font-size:13px;margin:24px 0 0;">
              Use your tracking number on the carrier&apos;s website to follow your shipment.
              Magic is coming your way!
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #2D2D4E;text-align:center;">
            <p style="color:#6B7280;font-size:12px;margin:0;">Questions? Contact us at support@mysticlab.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your Mystic Lab Order Has Shipped!",
    html,
  });
}

export async function sendRefundConfirmation({
  to,
  orderId,
  totalUsd,
}: {
  to: string;
  orderId: string;
  totalUsd: number;
}): Promise<void> {
  if (!isConfigured()) return;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#EF4444,#F87171);padding:24px 32px;">
          <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:2px;">✦ MYSTIC LAB</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px;letter-spacing:1px;">REFUND PROCESSED</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#F0E6FF;font-size:16px;margin:0 0 12px;">Your refund has been processed.</p>
          <p style="color:#9CA3AF;font-size:14px;margin:0 0 24px;">Order ID: <span style="color:#EF4444;">${orderId.slice(0, 8).toUpperCase()}</span></p>
          <div style="background:#13131F;border:1px solid #2D2D4E;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px;">Refund Amount</p>
            <p style="color:#F87171;font-size:28px;font-weight:700;margin:0;">$${totalUsd.toFixed(2)}</p>
          </div>
          <p style="color:#9CA3AF;font-size:13px;line-height:1.7;margin:0;">
            Please allow <strong style="color:#F0E6FF;">3–5 business days</strong> for the refund to appear on your original payment method.
            Questions? Reply to this email or contact support@mysticlab.com.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #2D2D4E;text-align:center;">
          <p style="color:#6B7280;font-size:12px;margin:0;">Thank you for shopping at Mystic Lab.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await resend.emails.send({ from: FROM, to, subject: "Your Mystic Lab Refund Has Been Processed", html });
}

export async function sendReviewRequestEmail({
  to,
  orderId,
  items,
  locale = "en",
  siteUrl,
}: {
  to: string;
  orderId: string;
  items: { name: string; slug: string }[];
  locale?: string;
  siteUrl: string;
}): Promise<void> {
  if (!isConfigured()) return;

  const itemLinks = items
    .map((item) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;color:#D1D5DB;font-size:14px;">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;text-align:right;">
        <a href="${siteUrl}/${locale}/products/${item.slug}#review"
           style="display:inline-block;background:#7C3AED22;color:#A855F7;border:1px solid #7C3AED44;border-radius:20px;padding:4px 12px;font-size:12px;text-decoration:none;">
          Leave a Review
        </a>
      </td>
    </tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:24px 32px;">
          <div style="font-size:18px;font-weight:700;color:#fff;letter-spacing:2px;">✦ MYSTIC LAB</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px;letter-spacing:1px;">HOW WAS YOUR ORDER?</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <p style="color:#F0E6FF;font-size:16px;margin:0 0 8px;">Your order is complete!</p>
          <p style="color:#9CA3AF;font-size:14px;margin:0 0 24px;">
            Order #<span style="color:#7C3AED;">${orderId.slice(0, 8).toUpperCase()}</span> — we'd love to hear what you think.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">${itemLinks}</table>
          <p style="color:#6B7280;font-size:12px;margin:0;">Reviews help other magicians make the right choice. Thank you!</p>
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #2D2D4E;text-align:center;">
          <p style="color:#6B7280;font-size:12px;margin:0;">Questions? Contact support@mysticlab.com</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await resend.emails.send({ from: FROM, to, subject: "How did you like your Mystic Lab order?", html });
}

function customOrderAdminHtml({
  customerName,
  customerEmail,
  description,
  budgetRange,
  desiredDeadline,
}: {
  customerName: string;
  customerEmail: string;
  description: string;
  budgetRange: string;
  desiredDeadline?: string | null;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0D0D1A;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D0D1A;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#1A1A2E;border-radius:16px;border:1px solid #2D2D4E;overflow:hidden;">

        <tr>
          <td style="background:linear-gradient(135deg,#7C3AED,#A855F7);padding:24px 32px;">
            <div style="font-size:16px;font-weight:700;color:#fff;letter-spacing:2px;">✦ MYSTIC LAB — ADMIN</div>
            <div style="font-size:13px;color:rgba(255,255,255,0.8);margin-top:4px;">New Custom Order Request</div>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Customer</div>
                  <div style="color:#F0E6FF;font-size:14px;">${escapeHtml(customerName)}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Email</div>
                  <div style="color:#A855F7;font-size:14px;"><a href="mailto:${escapeHtml(customerEmail)}" style="color:#A855F7;">${escapeHtml(customerEmail)}</a></div>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Budget Range</div>
                  <div style="color:#F59E0B;font-size:14px;font-weight:600;">${escapeHtml(budgetRange)}</div>
                </td>
              </tr>
              ${desiredDeadline ? `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Desired Deadline</div>
                  <div style="color:#D1D5DB;font-size:14px;">${escapeHtml(desiredDeadline)}</div>
                </td>
              </tr>` : ""}
              <tr>
                <td style="padding:10px 0;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Description</div>
                  <div style="color:#D1D5DB;font-size:14px;line-height:1.6;background:#13131F;border-radius:8px;padding:12px;">${escapeHtmlWithLineBreaks(description)}</div>
                </td>
              </tr>
            </table>

            <div style="margin-top:20px;text-align:center;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/custom-orders"
                 style="display:inline-block;background:linear-gradient(135deg,#7C3AED,#A855F7);color:#fff;text-decoration:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;">
                View in Admin Dashboard →
              </a>
            </div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
