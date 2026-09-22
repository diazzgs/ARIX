"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Store, ShoppingBag, Shield, Star, Zap, Globe, HeadphonesIcon, BarChart3, Package, MessageCircle } from "lucide-react";
import Logo from "@/components/shared/Logo";

function AnimatedSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCard({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100"
      >
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <Logo size={28} showText={true} />
          <div className="flex items-center gap-6">
            <Link href="/#conocenos" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">
              Conócenos
            </Link>
            <Link href="/#features" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">
              Características
            </Link>
            <Link href="/register" className="text-sm text-[#86868B] hover:text-[#1D1D1F] transition-colors">
              Registro
            </Link>
            <Link href="/login" className="text-sm bg-[#1D1D1F] text-white px-4 py-2 rounded-xl hover:bg-black transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-[#F5F5F7] text-[#1D1D1F] px-4 py-2 rounded-full text-sm font-medium mb-8"
          >
            <Zap size={14} className="text-yellow-500" />
            Plataforma SaaS Multi-Tienda
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-7xl font-bold text-[#1D1D1F] mb-6 leading-tight tracking-tight"
          >
            El marketplace que<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-600 to-gray-900">
              conecta todo.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-[#86868B] mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Compra productos de múltiples tiendas en una sola experiencia.
            Vendedores, gestiona tu negocio con herramientas de nivel empresarial.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="flex items-center gap-2 bg-[#1D1D1F] text-white px-7 py-4 rounded-2xl font-medium hover:bg-black transition-all hover:scale-105 active:scale-95"
            >
              Comenzar gratis
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/#conocenos"
              className="px-7 py-4 rounded-2xl font-medium border border-gray-200 text-[#1D1D1F] hover:bg-gray-50 transition-all hover:scale-105 active:scale-95"
            >
              Conócenos
            </Link>
          </motion.div>

          {/* Stats flotantes */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-16"
          >
            {[
              { value: "3", label: "Roles de usuario" },
              { value: "13", label: "Módulos del sistema" },
              { value: "100%", label: "API documentada" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-[#1D1D1F]">{value}</p>
                <p className="text-sm text-[#86868B] mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[#F5F5F7] py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1D1D1F] mb-4">
              Una plataforma, infinitas posibilidades
            </h2>
            <p className="text-[#86868B] text-lg max-w-xl mx-auto">
              Todo lo que necesitas para comprar, vender y gestionar un negocio digital.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: ShoppingBag,
                title: "Checkout multi-tienda",
                desc: "Compra productos de diferentes tiendas en un solo pedido. Una sola dirección, un solo pago, múltiples tiendas.",
                color: "bg-blue-50 text-blue-600",
              },
              {
                icon: Store,
                title: "Panel de tienda completo",
                desc: "Gestiona productos, inventario, pedidos, tickets y el perfil de tu tienda desde un panel intuitivo.",
                color: "bg-purple-50 text-purple-600",
              },
              {
                icon: Shield,
                title: "Seguridad empresarial",
                desc: "Autenticación JWT, roles y permisos por usuario, auditoría completa de cada acción del sistema.",
                color: "bg-green-50 text-green-600",
              },
              {
                icon: BarChart3,
                title: "Estadísticas en tiempo real",
                desc: "Dashboards con métricas de ventas, stock bajo, tickets abiertos y actividad de la plataforma.",
                color: "bg-orange-50 text-orange-600",
              },
              {
                icon: MessageCircle,
                title: "Chat y soporte integrado",
                desc: "Sistema de mensajería directa entre clientes y vendedores, y tickets de soporte con seguimiento.",
                color: "bg-pink-50 text-pink-600",
              },
              {
                icon: Package,
                title: "Facturación automática",
                desc: "Generación automática de facturas PDF por tienda y consolidadas por orden. Descarga con un clic.",
                color: "bg-yellow-50 text-yellow-600",
              },
            ].map(({ icon: Icon, title, desc, color }, index) => (
              <AnimatedCard key={title} delay={index * 0.08}>
                <motion.div
                  whileHover={{ y: -4, shadow: "lg" }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow h-full"
                >
                  <div className={"inline-flex p-3 rounded-xl mb-4 " + color}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-[#1D1D1F] mb-2">{title}</h3>
                  <p className="text-sm text-[#86868B] leading-relaxed">{desc}</p>
                </motion.div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1D1D1F] mb-4">Diseñado para cada rol</h2>
            <p className="text-[#86868B] text-lg">Tres experiencias distintas, una sola plataforma.</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                role: "Cliente",
                emoji: "🛍️",
                color: "bg-blue-600",
                features: [
                  "Catálogo con búsqueda y filtros",
                  "Carrito multi-tienda",
                  "Historial de órdenes y facturas PDF",
                  "Favoritos persistentes",
                  "Tickets de soporte",
                  "Chat directo con tiendas",
                ],
              },
              {
                role: "Admin de Tienda",
                emoji: "🏪",
                color: "bg-purple-600",
                features: [
                  "Dashboard con métricas",
                  "Gestión de productos e inventario",
                  "Control de pedidos y estados",
                  "Perfil completo de tienda",
                  "Respuesta a tickets",
                  "Alertas de stock bajo",
                ],
              },
              {
                role: "Super Admin",
                emoji: "⚙️",
                color: "bg-gray-900",
                features: [
                  "Supervisión de toda la plataforma",
                  "Gestión de tiendas y usuarios",
                  "Moderación de reseñas",
                  "Historial de auditoría completo",
                  "Suspender o reactivar tiendas",
                  "Crear administradores",
                ],
              },
            ].map(({ role, emoji, color, features }, index) => (
              <AnimatedCard key={role} delay={index * 0.1}>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full">
                  <div className={"w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 " + color.replace("bg-", "bg-").replace("600", "100").replace("900", "100")}>
                    {emoji}
                  </div>
                  <h3 className="text-lg font-bold text-[#1D1D1F] mb-4">{role}</h3>
                  <ul className="space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[#86868B]">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </section>

      {/* Conócenos */}
      <section id="conocenos" className="bg-[#F5F5F7] py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <p className="text-sm font-medium text-[#86868B] uppercase tracking-widest mb-4">
                Conócenos
              </p>
              <h2 className="text-4xl font-bold text-[#1D1D1F] mb-6 leading-tight">
                Construido en Honduras,<br />pensado para escalar.
              </h2>
              <p className="text-[#86868B] leading-relaxed mb-4">
                ARIX nació como un proyecto académico con visión real de negocio.
                Es una plataforma SaaS de marketplace multi-tienda que demuestra
                cómo la tecnología moderna puede transformar el comercio electrónico
                en Centroamérica.
              </p>
              <p className="text-[#86868B] leading-relaxed mb-4">
                Desarrollada con un stack moderno y escalable — FastAPI en el backend,
                Next.js en el frontend y MySQL como base de datos — ARIX implementa
                patrones de arquitectura de software empresarial: autenticación JWT,
                roles y permisos, auditoría de acciones, notificaciones en tiempo real
                via WebSocket y generación automática de facturas PDF.
              </p>
              <p className="text-[#86868B] leading-relaxed">
                Cada módulo fue diseñado pensando en la experiencia real del usuario:
                desde el flujo de compra multi-tienda hasta el panel de control del
                Super Administrador.
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-2 gap-4">
              {[
                { number: "13", label: "Módulos del backend", desc: "Auth, tiendas, productos, órdenes, facturas, chat y más" },
                { number: "3", label: "Roles de usuario", desc: "Cliente, Admin de Tienda y Super Administrador" },
                { number: "JWT", label: "Autenticación segura", desc: "Tokens de acceso y refresh con expiración controlada" },
                { number: "PDF", label: "Facturación automática", desc: "Facturas por tienda y consolidadas generadas al instante" },
              ].map(({ number, label, desc }, index) => (
                <AnimatedCard key={label} delay={index * 0.1}>
                  <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <p className="text-2xl font-bold text-[#1D1D1F] mb-1">{number}</p>
                    <p className="text-sm font-medium text-[#1D1D1F]">{label}</p>
                    <p className="text-xs text-[#86868B] mt-1 leading-relaxed">{desc}</p>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial / Stack */}
      <section className="py-24 px-8">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1D1D1F] mb-4">Stack tecnológico</h2>
            <p className="text-[#86868B] text-lg">Tecnologías modernas, probadas en producción.</p>
          </AnimatedSection>

         
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-[#1D1D1F] py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              ¿Listo para empezar?
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-xl mx-auto">
              Únete a ARIX y experimenta el futuro del comercio electrónico
              en Centroamérica.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="flex items-center gap-2 bg-white text-[#1D1D1F] px-7 py-4 rounded-2xl font-medium hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
              >
                Crear cuenta gratis
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="px-7 py-4 rounded-2xl font-medium border border-gray-700 text-white hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
              >
                Iniciar sesión
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1D1D1F] border-t border-gray-800 px-8 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-white font-bold text-lg">ARIX</p>
            <span className="text-gray-600">·</span>
            <p className="text-gray-500 text-sm">Plataforma SaaS Marketplace Multi-Tienda</p>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/#features" className="text-sm text-gray-500 hover:text-white transition-colors">
              Características
            </Link>
            <Link href="/#conocenos" className="text-sm text-gray-500 hover:text-white transition-colors">
              Conócenos
            </Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-white transition-colors">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}