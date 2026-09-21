import Link from "next/link";

async function getStore(slug: string) {
  try {
    const res = await fetch("http://localhost:8080/api/stores/" + slug, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

async function getProducts(storeId: number) {
  try {
    const res = await fetch("http://localhost:8080/api/products?store_id=" + storeId + "&size=20", {
      cache: "no-store",
    });
    const data = await res.json();
    return data.data.content;
  } catch {
    return [];
  }
}

interface Product {
  id: number;
  name: string;
  price: number;
  primary_image_url: string | null;
  rating_avg: number;
  rating_count: number;
}

export default async function StoreDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await getStore(slug);
  if (!store) return <p className="p-8 text-red-500">Tienda no encontrada</p>;

  const products = await getProducts(store.id);

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-[#86868B]">
          <Link href="/stores" className="hover:text-[#1D1D1F]">Tiendas</Link>
          <span>/</span>
          <span className="text-[#1D1D1F]">{store.business_name}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#F5F5F7] rounded-2xl flex items-center justify-center text-3xl">
              🏪
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1D1D1F]">{store.business_name}</h1>
              {store.profile?.tagline && (
                <p className="text-[#86868B] mt-0.5">{store.profile.tagline}</p>
              )}
              {store.description && (
                <p className="text-sm text-[#86868B] mt-2">{store.description}</p>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#1D1D1F] mb-4">Productos</h2>

        {products.length === 0 ? (
          <p className="text-[#86868B]">Esta tienda no tiene productos aún</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((product: Product) => (
              <Link
                key={product.id}
                href={"/catalog/" + product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-40 bg-[#F5F5F7] flex items-center justify-center">
                  <div className="text-4xl">📦</div>
                </div>
                <div className="p-4">
                  <p className="text-sm font-medium text-[#1D1D1F] line-clamp-2">{product.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-[#1D1D1F]">
                      {"L. " + Number(product.price).toLocaleString("es-HN")}
                    </p>
                    {product.rating_count > 0 && (
                      <p className="text-xs text-[#86868B]">★ {Number(product.rating_avg).toFixed(1)}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}