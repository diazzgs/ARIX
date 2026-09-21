import Link from "next/link";
import Logo from "@/components/shared/Logo";

async function getStores() {
  try {
    const res = await fetch("http://localhost:8080/api/stores?size=50", {
      cache: "no-store",
    });
    const data = await res.json();
    return data.data.content;
  } catch {
    return [];
  }
}

export default async function StoresPage() {
  const stores = await getStores();

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <div className="bg-white border-b border-gray-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#1D1D1F]">ARIX</Link>
          <Link href="/catalog" className="text-sm text-[#86868B] hover:text-[#1D1D1F]">
            Catálogo →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
<h1 className="text-xl font-bold text-[#1D1D1F]">Tiendas</h1>        <p className="text-[#86868B] mb-8">Descubre todas las tiendas disponibles en ARIX</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store: { id: number; business_name: string; slug: string; logo_url: string | null }) => (
            <Link
              key={store.id}
              href={"/stores/" + store.slug}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-[#F5F5F7] rounded-xl flex items-center justify-center mb-4 text-2xl">
                🏪
              </div>
              <p className="font-bold text-[#1D1D1F]">{store.business_name}</p>
              <p className="text-sm text-[#86868B] mt-1">{store.slug}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}