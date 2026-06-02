import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — Mystic Lab",
  description: "Mystic Lab shipping methods, delivery times, and international shipping information.",
};

const UPDATED = "June 1, 2026";

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0D0D1A] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1
          className="text-3xl font-bold text-[#F0E6FF] mb-2"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Shipping Policy
        </h1>
        <p className="text-sm text-[#6B7280] mb-10">Last updated: {UPDATED}</p>

        <div className="space-y-8 text-sm text-[#9CA3AF] leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">1. Processing Time</h2>
            <p>
              Orders are typically processed and dispatched within{" "}
              <strong className="text-[#F0E6FF]">1–3 business days</strong> after payment confirmation.
              Custom orders may require additional lead time (communicated at order placement).
              Orders placed on Korean public holidays may be delayed by 1 business day.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">2. Shipping Options</h2>
            <div className="space-y-3">
              {[
                {
                  name: "Standard International — EMS",
                  time: "7–14 business days",
                  cost: "Free",
                  note: "Korea Post EMS. Tracking included. Available to most countries.",
                },
                {
                  name: "Express International — DHL / FedEx",
                  time: "3–5 business days",
                  cost: "+USD 15",
                  note: "Door-to-door express courier. Faster customs clearance. Signature required.",
                },
                {
                  name: "Domestic — Korea Post / CJ Logistics",
                  time: "1–3 business days",
                  cost: "Free",
                  note: "For orders with Korean delivery address. Full tracking included.",
                },
              ].map((s) => (
                <div key={s.name} className="p-4 rounded-xl bg-[#1A1A2E] border border-[#2D2D4E]">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <span className="font-semibold text-[#F0E6FF]">{s.name}</span>
                    <span className={`text-xs font-bold shrink-0 ${s.cost === "Free" ? "text-[#10B981]" : "text-[#F59E0B]"}`}>{s.cost}</span>
                  </div>
                  <p className="text-xs text-[#A855F7] mb-1">Est. delivery: {s.time}</p>
                  <p className="text-xs">{s.note}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">3. International Customs &amp; Duties</h2>
            <p>
              International shipments may be subject to import duties, VAT, or customs fees imposed
              by the destination country. These charges are{" "}
              <strong className="text-[#F0E6FF]">the buyer&apos;s sole responsibility</strong> and are
              not included in our prices or shipping fees. We cannot predict or control these
              charges; please check with your local customs authority before ordering.
            </p>
            <p className="mt-3">
              We declare accurate values on customs forms and cannot mark items as &ldquo;gifts&rdquo; or
              under-declare values. Requests to do so will be refused.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">4. Tracking</h2>
            <p>
              A tracking number will be sent by email once your order ships. Tracking may take up
              to 24 hours to activate in the carrier&apos;s system. For EMS, use{" "}
              <a href="https://ems.epost.go.kr" target="_blank" rel="noopener noreferrer" className="text-[#A855F7] hover:text-[#C084FC]">
                ems.epost.go.kr
              </a>
              . For DHL/FedEx, use the respective carrier website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">5. Lost or Undelivered Packages</h2>
            <p>
              If your package shows as delivered but you have not received it, contact us within{" "}
              <strong className="text-[#F0E6FF]">7 days</strong> of the marked delivery date. For
              packages lost in transit (no movement for 30+ days), contact us and we will file a
              claim with the carrier. Resolution may take 4–8 weeks depending on the carrier&apos;s
              investigation process.
            </p>
            <p className="mt-3">
              We are not responsible for packages that are delivered to an incorrect address
              provided by the customer, stolen after delivery, or refused at customs due to
              restricted items.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">6. Restricted Destinations</h2>
            <p>
              We currently do not ship to countries under international sanctions or where postal
              services are suspended. If your country is unavailable at checkout, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#F0E6FF] mb-3">7. Contact</h2>
            <p>
              Shipping questions:{" "}
              <a href="mailto:support@mystic-lab.com" className="text-[#A855F7] hover:text-[#C084FC]">
                support@mystic-lab.com
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
