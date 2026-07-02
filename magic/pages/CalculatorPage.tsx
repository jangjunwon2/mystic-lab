import { createAdminClient } from "@/lib/supabase/server";
import MagicCalculator from "@/magic/components/MagicCalculator";
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

export default async function CalculatorPage({ params }: Props) {
  const { locale } = await params;
  const productId = await getProductId();

  return (
    <ClientPwaWrapper locale={locale}>
      <MagicCalculator locale={locale} productId={productId!} />
    </ClientPwaWrapper>
  );
}
