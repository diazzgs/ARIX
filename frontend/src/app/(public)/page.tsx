import Link from "next/link";
import { ArrowRight, Store, ShoppingBag, Shield } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1D1D1F]">ARIX</h1>
          <div className="flex items-center gap-4">
            <Link href="/catalog" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">
              Catálogo
            </Link>
            <Link href="/login" className="text-sm bg-[#1D1D1F] text-white px-4 py-2 rounded-xl hover:bg-black transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 py-24 text-center">
        <h2 className="text-6xl font-bold text-[#1D1D1F] mb-6 leading-tight">
          El marketplace que<br />conecta todo.
        </h2>
        <p className="text-xl text-[#86868B] mb-10 max-w-2xl mx-auto">
          Compra productos de múltiples tiendas en una sola experiencia.
          Vendedores, gestiona tu negocio con herramientas de nivel empresarial.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/catalog"
            className="flex items-center gap-2 bg-[#1D1D1F] text-white px-6 py-3.5 rounded-2xl font-medium hover:bg-black transition-colors"
          >
            Explorar catálogo
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/register"
            className="px-6 py-3.5 rounded-2xl font-medium border border-gray-200 text-[#1D1D1F] hover:bg-gray-50 transition-colors"
          >
            Crear cuenta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#F5F5F7] py-20">
        <div className="max-w-6xl mx-auto px-8">
          <h3 className="text-3xl font-bold text-[#1D1D1F] text-center mb-12">
            Una plataforma, infinitas posibilidades
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShoppingBag,
                title: "Compra sin límites",
                desc: "Explora productos de múltiples tiendas y paga todo en un solo checkout.",
              },
              {
                icon: Store,
                title: "Vende con herramientas pro",
                desc: "Panel de administración completo con inventario, pedidos, tickets y estadísticas.",
              },
              {
                icon: Shield,
                title: "Seguro y confiable",
                desc: "Autenticación JWT, roles por usuario y auditoría completa de acciones.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-[#F5F5F7] rounded-xl flex items-center justify-center mb-4">
                  <Icon size={22} className="text-[#1D1D1F]" />
                </div>
                <h4 className="font-bold text-[#1D1D1F] mb-2">{title}</h4>
                <p className="text-sm text-[#86868B] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-8 py-20 text-center">
        <h3 className="text-3xl font-bold text-[#1D1D1F] mb-4">¿Listo para empezar?</h3>
        <p className="text-[#86868B] mb-8">Únete a ARIX y empieza a comprar o vender hoy mismo.</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 bg-[#1D1D1F] text-white px-8 py-4 rounded-2xl font-medium hover:bg-black transition-colors"
        >
          Crear cuenta gratis
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <p className="text-sm font-bold text-[#1D1D1F]">ARIX</p>
          <p className="text-sm text-[#86868B]">Plataforma SaaS Marketplace Multi-Tienda</p>
        </div>
      </footer>
    </div>
  );
}