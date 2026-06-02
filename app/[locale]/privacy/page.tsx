import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Mystic Lab",
  description: "How Mystic Lab collects, uses, and protects your personal information.",
};

const UPDATED = "June 1, 2026";
const EMAIL = "privacy@mystic-lab.com";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1
          className="text-3xl font-bold text-[#F0E6FF] mb-2"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Privacy Policy
        </h1>
        <p className="text-sm text-[#6B7280] mb-10">Last updated: {UPDATED}</p>

        <div className="space-y-8 text-sm text-[#9CA3AF] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">1. Who We Are</h2>
            <p>
              Mystic Lab (&ldquo;we&rdquo;, &ldquo;our&rdquo;, &ldquo;us&rdquo;) operates the online store at{" "}
              <strong className="text-[#F0E6FF]">mystic-lab.vercel.app</strong>. We are committed to
              protecting your personal information in compliance with the Korean Personal Information
              Protection Act (개인정보 보호법, &ldquo;PIPA&rdquo;), the EU General Data Protection Regulation
              (&ldquo;GDPR&rdquo;), and other applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">2. Data We Collect</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#2D2D4E]">
                    <th className="text-left py-2 pr-4 text-[#F0E6FF] font-semibold">Category</th>
                    <th className="text-left py-2 pr-4 text-[#F0E6FF] font-semibold">Examples</th>
                    <th className="text-left py-2 text-[#F0E6FF] font-semibold">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2D4E]">
                  {[
                    ["Account data", "Email address, display name, password (hashed)", "Authentication, account management"],
                    ["Order data", "Items purchased, total amount, order status", "Order processing, legal records"],
                    ["Shipping data", "Name, phone, address, country", "Delivery of physical products"],
                    ["Payment data", "Card type, last 4 digits (processed by LemonSqueezy / Toss — we never store full card numbers)", "Payment processing"],
                    ["Device unlock data", "Code hash, first-use timestamp", "Tutorial access control"],
                    ["Usage data", "Pages visited, timestamps, browser type", "Analytics, fraud prevention"],
                    ["Communications", "Support email content", "Customer service"],
                  ].map(([cat, ex, purpose]) => (
                    <tr key={cat}>
                      <td className="py-2 pr-4 text-[#F0E6FF]">{cat}</td>
                      <td className="py-2 pr-4">{ex}</td>
                      <td className="py-2">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">3. Legal Basis for Processing (GDPR)</h2>
            <ul className="space-y-1.5 list-disc list-inside">
              <li><strong className="text-[#F0E6FF]">Contract performance</strong> — processing orders, delivering products.</li>
              <li><strong className="text-[#F0E6FF]">Legitimate interest</strong> — fraud prevention, security, analytics.</li>
              <li><strong className="text-[#F0E6FF]">Legal obligation</strong> — tax records, consumer protection compliance.</li>
              <li><strong className="text-[#F0E6FF]">Consent</strong> — marketing emails (you may opt out at any time).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">4. Third-Party Processors</h2>
            <p className="mb-3">We share data with the following sub-processors solely to operate our services:</p>
            <div className="space-y-2">
              {[
                ["Supabase (USA)", "Database, authentication, file storage", "supabase.com/privacy"],
                ["LemonSqueezy (USA)", "International payment processing", "lemonsqueezy.com/privacy"],
                ["Toss Payments (Korea)", "Domestic KRW payment processing", "tosspayments.com/privacy"],
                ["Resend (USA)", "Transactional email delivery", "resend.com/privacy"],
                ["Cloudflare (USA)", "CDN, DDoS protection, video streaming", "cloudflare.com/privacy"],
                ["Vercel (USA)", "Web hosting and deployment", "vercel.com/legal/privacy-policy"],
                ["Google Analytics (USA)", "Anonymous usage analytics (opt-out via browser extension)", "policies.google.com/privacy"],
              ].map(([name, role, url]) => (
                <div key={name} className="flex items-start gap-3 p-3 rounded-lg bg-[#1A1A2E] border border-[#2D2D4E]">
                  <div className="flex-1">
                    <span className="text-[#F0E6FF] font-medium">{name}</span>
                    <span className="text-[#6B7280] mx-2">·</span>
                    <span>{role}</span>
                  </div>
                  <a href={`https://${url}`} target="_blank" rel="noopener noreferrer" className="text-[#A855F7] hover:text-[#C084FC] text-xs shrink-0">
                    Privacy →
                  </a>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">5. Data Retention</h2>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Account data: retained while your account is active + 3 years after deletion request.</li>
              <li>Order records: 5 years (Korean accounting law requirement).</li>
              <li>Payment data: retained by the payment processor per their policy; we store only order references.</li>
              <li>Analytics data: 26 months (Google Analytics default).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">6. Your Rights</h2>
            <p className="mb-3">
              Depending on your jurisdiction, you may have the following rights. To exercise any of
              them, email <a href={`mailto:${EMAIL}`} className="text-[#A855F7] hover:text-[#C084FC]">{EMAIL}</a>:
            </p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li><strong className="text-[#F0E6FF]">Access</strong> — request a copy of your personal data.</li>
              <li><strong className="text-[#F0E6FF]">Rectification</strong> — correct inaccurate data.</li>
              <li><strong className="text-[#F0E6FF]">Erasure</strong> — &ldquo;right to be forgotten&rdquo; where legally permissible.</li>
              <li><strong className="text-[#F0E6FF]">Portability</strong> — receive your data in a machine-readable format.</li>
              <li><strong className="text-[#F0E6FF]">Objection</strong> — object to processing based on legitimate interests.</li>
              <li><strong className="text-[#F0E6FF]">Withdrawal of consent</strong> — opt out of marketing at any time.</li>
            </ul>
            <p className="mt-3">
              EU/EEA residents may lodge a complaint with their local supervisory authority. Korean
              residents may contact the Personal Information Protection Commission (개인정보 보호위원회,{" "}
              <a href="https://www.pipc.go.kr" target="_blank" rel="noopener noreferrer" className="text-[#A855F7]">pipc.go.kr</a>).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and cart persistence. Analytics cookies
              (Google Analytics) are used with your implicit consent by continuing to use the site.
              You may disable cookies in your browser settings; this may affect site functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">8. Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to children under 14. We do not knowingly collect data
              from minors. If you believe a minor has provided us data, contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">9. Changes</h2>
            <p>
              We may update this policy. Material changes will be notified by email or a banner on
              the site at least 7 days before taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">10. Contact</h2>
            <p>
              Privacy Officer:{" "}
              <a href={`mailto:${EMAIL}`} className="text-[#A855F7] hover:text-[#C084FC]">{EMAIL}</a>
              <br />
              Mystic Lab · Republic of Korea
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
