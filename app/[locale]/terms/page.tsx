import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Mystic Lab",
  description: "Terms and conditions governing your use of Mystic Lab.",
};

const UPDATED = "June 1, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1
          className="text-3xl font-bold text-[#F0E6FF] mb-2"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Terms of Service
        </h1>
        <p className="text-sm text-[#6B7280] mb-10">Last updated: {UPDATED}</p>

        <div className="space-y-8 text-sm text-[#9CA3AF] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">1. Acceptance</h2>
            <p>
              By accessing or using Mystic Lab (&ldquo;the Service&rdquo;) you agree to these Terms of
              Service (&ldquo;Terms&rdquo;). If you do not agree, you may not use the Service. We reserve
              the right to update these Terms at any time; continued use after changes constitutes
              acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">2. Account Registration</h2>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>You must be at least 14 years old to create an account.</li>
              <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
              <li>You must provide accurate and current information during registration.</li>
              <li>You may not create accounts for fraudulent purposes or impersonate others.</li>
              <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">3. Products &amp; Purchases</h2>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>All prices are listed in USD unless otherwise stated. KRW pricing is indicative and based on live exchange rates.</li>
              <li>We reserve the right to modify prices at any time. Your order is binding at the price displayed at checkout.</li>
              <li>Product descriptions and images are for illustrative purposes; minor variations may occur.</li>
              <li>We reserve the right to cancel any order, for any reason, with a full refund.</li>
              <li>Availability is not guaranteed; we will notify you if an ordered item is out of stock.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">4. Intellectual Property &amp; Tutorial Content</h2>
            <div className="p-4 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 mb-4">
              <p className="text-[#F0E6FF] font-medium mb-2">⚠ Strict Confidentiality Obligation</p>
              <p className="text-xs">
                The solution tutorials, working methods, and secrets associated with our products
                constitute proprietary trade secrets. Access to this content creates a binding
                confidentiality obligation.
              </p>
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>All tutorial videos, instructions, and method descriptions are the exclusive intellectual property of Mystic Lab.</li>
              <li>You may not record, screenshot, copy, distribute, share, upload, or otherwise reproduce tutorial content in any medium.</li>
              <li>You may not share device unlock codes with any third party.</li>
              <li>You may not disclose the working method of any Mystic Lab product publicly or privately outside your own performance practice.</li>
              <li>Violation of this section may result in account termination, removal of access, and legal action for trade secret misappropriation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">5. Prohibited Uses</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
              <li>Reverse-engineer, decompile, or disassemble any component of the Service.</li>
              <li>Use automated bots, scrapers, or tools to access the Service without permission.</li>
              <li>Post false reviews or manipulate the review system.</li>
              <li>Conduct or facilitate fraud, including chargeback fraud.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">6. Refunds &amp; Returns</h2>
            <p>
              Our refund and return policy is set out separately in our{" "}
              <a href="./refund-policy" className="text-[#A855F7] hover:text-[#C084FC]">
                Refund &amp; Return Policy
              </a>
              , which is incorporated into these Terms by reference. By purchasing you acknowledge
              the strict non-refund rules applicable to magic apparatus.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">7. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; without warranties of any kind, express or
              implied. We do not warrant that the Service will be uninterrupted, error-free, or
              free of viruses. We do not guarantee that products will achieve any specific
              performance result in any given performance context.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">8. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Mystic Lab and its principals, employees, and
              agents shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages arising from your use of the Service. Our total liability for any
              claim shall not exceed the amount you paid for the specific product giving rise to the
              claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">9. Governing Law &amp; Disputes</h2>
            <p>
              These Terms are governed by the laws of the Republic of Korea. Any dispute shall first
              be submitted to good-faith negotiation. If unresolved within 30 days, disputes shall
              be submitted to the Seoul Central District Court as the court of first instance.
              Consumers in the EU/EEA may also use the EU Online Dispute Resolution platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">10. Contact</h2>
            <p>
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@mystic-lab.com" className="text-[#A855F7] hover:text-[#C084FC]">
                legal@mystic-lab.com
              </a>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
