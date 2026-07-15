import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductOrderForm } from "@/components/ProductOrderForm";
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
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full grid md:grid-cols-[1fr_1.1fr] gap-10">
        <div>
          <div className="relative aspect-[4/5] bg-paper-raised border border-line sticky top-12 overflow-hidden">
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
                priority
              />
            ) : null}
          </div>
        </div>

        <div>
          <h1 className="font-display font-medium text-2xl">{product.name}</h1>
          <p className="text-sm text-ink-soft mt-2 mb-8 leading-relaxed max-w-md">
            {product.description}
          </p>

          <Suspense fallback={null}>
            <ProductOrderForm product={product} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}