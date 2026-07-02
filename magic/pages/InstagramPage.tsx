import { createAdminClient } from "@/lib/supabase/server";
import FakeInstagramApp from "@/magic/components/FakeInstagramApp";
import ClientPwaWrapper from "@/magic/components/ClientPwaWrapper";

interface Props {
  params: Promise<{ locale: string }>;
}

async function getProductId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createAdminClient()) as any;
  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", "magic-calculator")
    .maybeSingle();
  return product?.id ?? null;
}

export default async function InstagramPage({ params }: Props) {
  const { locale } = await params;
  const productId = await getProductId();

  return (
    <ClientPwaWrapper locale={locale} appName="Instagram">
      <FakeInstagramApp locale={locale} productId={productId!} slug="magic-calculator" />
    </ClientPwaWrapper>
  );
}
