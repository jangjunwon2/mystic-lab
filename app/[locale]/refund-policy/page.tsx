import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Return Policy — Mystic Lab",
  description: "Mystic Lab refund and return policy for magic props, electronic devices, and digital content.",
};

const UPDATED = "June 1, 2026";

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1
          className="text-3xl font-bold text-[#F0E6FF] mb-2"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Refund &amp; Return Policy
        </h1>
        <p className="text-sm text-[#6B7280] mb-10">Last updated: {UPDATED}</p>

        <div className="prose-mystic space-y-8">

          {/* 1. General Principle */}
          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">1. General Principle</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Mystic Lab sells professional magic apparatus and custom electronic devices. Because the
              intellectual value of a magic prop — its secret working — is irreversibly revealed upon
              opening or use, our refund policy is necessarily strict. Please read carefully before
              purchasing.
            </p>
          </section>

          {/* 2. No-Refund Items */}
          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">2. Non-Refundable Items</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed mb-3">
              The following items are <strong className="text-[#F0E6FF]">non-refundable and
              non-returnable</strong> under any circumstances except those listed in Section 3:
            </p>
            <ul className="space-y-2 text-sm text-[#9CA3AF]">
              {[
                "All magic props, gimmicks, and apparatus — without exception. Upon completing a purchase, the solution tutorial video is immediately unlocked, making the trick secret available regardless of whether the physical item has been opened. The intellectual value of the product is therefore disclosed at the moment of purchase.",
                "Items with intact/unopened packaging are not eligible for return for the same reason: tutorial access is granted at the time of payment, not at the time of opening.",
                "Digital content (solution tutorial videos, access codes, downloadable instructions) once accessed or viewed.",
                "Custom-manufactured electronic devices — all custom orders are made-to-specification and non-transferable.",
                "Bundle purchases where any component has been opened.",
                "Items purchased during a sale or with a discount code.",
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[#7C3AED] shrink-0 mt-0.5">▸</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30">
              <p className="text-sm text-[#F0E6FF] font-medium mb-1">⚠ Why magic props are non-refundable</p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                Under Korean e-commerce law (전자상거래법 제17조), the statutory 7-day cancellation right
                does not apply to goods "where the product value is significantly diminished upon use
                or upon the opening of packaging, and adequate prior notice was provided." Magic
                apparatus falls squarely within this exception. By completing a purchase you
                acknowledge this exception and waive your statutory cancellation right with respect
                to opened magic props.
              </p>
            </div>
          </section>

          {/* 3. Exceptions */}
          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">3. Exceptions — When We Accept Returns</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed mb-3">
              We will accept a return or issue a refund <em>only</em> in the following situations:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#1A1A2E] border border-[#2D2D4E]">
                <p className="text-sm font-semibold text-[#F0E6FF] mb-1">A. Wrong item shipped</p>
                <p className="text-xs text-[#9CA3AF]">
                  If we ship a product that is materially different from what you ordered, contact us
                  within <strong className="text-[#F0E6FF]">14 days</strong> of delivery. We will
                  arrange a prepaid return and ship the correct item at no additional cost, or issue
                  a full refund if the correct item is unavailable.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#1A1A2E] border border-[#2D2D4E]">
                <p className="text-sm font-semibold text-[#F0E6FF] mb-1">B. Defective or damaged on arrival (DOA)</p>
                <p className="text-xs text-[#9CA3AF]">
                  If a product arrives physically broken or mechanically non-functional due to a
                  manufacturing defect — <em>not user handling</em> — contact us within{" "}
                  <strong className="text-[#F0E6FF]">7 days</strong> of delivery with photo or video
                  evidence. We will replace the defective component or issue store credit. A full
                  cash refund is issued only when replacement is not feasible. This does not cover
                  cosmetic damage or damage caused in transit after delivery confirmation.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#13131F] border border-[#2D2D4E]">
                <p className="text-sm font-semibold text-[#F0E6FF] mb-1">C. &ldquo;Unopened&rdquo; does not qualify for a return</p>
                <p className="text-xs text-[#9CA3AF]">
                  Every Mystic Lab purchase grants immediate access to the solution tutorial video.
                  Because the intellectual secret of the product is disclosed at the moment of
                  purchase — regardless of whether the physical item has been opened — there is
                  no state in which a product can be considered &ldquo;unexamined&rdquo; after payment.
                  Accordingly, <strong className="text-[#F0E6FF]">no return is accepted on the
                  grounds that the physical packaging is intact</strong>. The only valid grounds
                  for a return are wrong item shipped (Section A) or confirmed manufacturing
                  defect (Section B).
                </p>
              </div>
            </div>
          </section>

          {/* 4. Claim Process */}
          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">4. How to File a Claim</h2>
            <ol className="space-y-2 text-sm text-[#9CA3AF] list-decimal list-inside">
              <li>Email <strong className="text-[#A855F7]">support@mystic-lab.com</strong> with subject line "Return Request – Order #[your order ID]".</li>
              <li>Include clear photos or video of the item, packaging, and the issue.</li>
              <li>We will respond within 2 business days with a decision.</li>
              <li>Do <strong className="text-[#F0E6FF]">not</strong> ship any item back without our written approval — unauthorized returns will not be accepted.</li>
            </ol>
          </section>

          {/* 5. Refund Timeline */}
          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">5. Refund Processing Time</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Approved refunds are processed within <strong className="text-[#F0E6FF]">5–10 business
              days</strong> to the original payment method. LemonSqueezy (international) and Toss
              Payments (Korea) processing times may vary. Shipping charges are non-refundable unless
              the return is due to our error.
            </p>
          </section>

          {/* 6. Chargebacks */}
          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">6. Chargebacks &amp; Disputes</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Filing a chargeback or payment dispute without first contacting us is a violation of
              these terms. We maintain comprehensive records of all orders, delivery confirmations,
              and access logs. We will respond to disputes with full documentation. Fraudulent
              chargebacks may result in permanent account suspension and legal action.
            </p>
          </section>

          {/* 7. Contact */}
          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">7. Contact</h2>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">
              Questions? Email us at{" "}
              <a href="mailto:support@mystic-lab.com" className="text-[#A855F7] hover:text-[#C084FC]">
                support@mystic-lab.com
              </a>
              . We typically respond within 1–2 business days.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
