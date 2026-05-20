import NewsletterClient from "@/components/admin/NewsletterClient";

export const metadata = { title: "Newsletter — Admin" };

export default function AdminNewsletterPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#F0E6FF" }}>
          Newsletter
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#9CA3AF" }}>
          Send email campaigns to members or buyers via Resend.
        </p>
      </div>

      <NewsletterClient />
    </div>
  );
}
