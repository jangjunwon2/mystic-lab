import { Resend } from "resend";
import type { CartItem } from "@/lib/payments/types";

const resend = new Resend(process.env.RESEND_API_KEY);

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
                  <div style="color:#F0E6FF;font-size:14px;">${customerName}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Email</div>
                  <div style="color:#A855F7;font-size:14px;"><a href="mailto:${customerEmail}" style="color:#A855F7;">${customerEmail}</a></div>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Budget Range</div>
                  <div style="color:#F59E0B;font-size:14px;font-weight:600;">${budgetRange}</div>
                </td>
              </tr>
              ${desiredDeadline ? `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #2D2D4E;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Desired Deadline</div>
                  <div style="color:#D1D5DB;font-size:14px;">${desiredDeadline}</div>
                </td>
              </tr>` : ""}
              <tr>
                <td style="padding:10px 0;">
                  <div style="color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Description</div>
                  <div style="color:#D1D5DB;font-size:14px;line-height:1.6;background:#13131F;border-radius:8px;padding:12px;">${description.replace(/\n/g, "<br>")}</div>
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
