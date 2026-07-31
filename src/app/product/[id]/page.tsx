import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductDetail } from "@/components/ProductDetail";
import { getProduct } from "@/lib/data";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <ProductDetail product={product} />
      </main>
    </div>
  );
}
