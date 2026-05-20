"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, ShieldCheck, Sparkles, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Product } from "@/lib/types"

const HERO_VIDEO_SRC = "/hero-cover.mp4"

const fallbackProduct: Product = {
  id: "cover-fallback",
  name: "Camisa Fortaleza Home 2024",
  team: "Fortaleza",
  price: 299.9,
  description:
    "Camisa oficial do Fortaleza com presenca forte, acabamento premium e visual marcante.",
  sizes: [
    { size: "P", quantity: 1 },
    { size: "M", quantity: 1 },
    { size: "G", quantity: 1 },
    { size: "GG", quantity: 1 },
  ],
  imageUrl: "/uploads/fortaleza-home.jpg",
  createdAt: "2024-01-15T10:00:00Z",
}

function HeroVideo() {
  const [assetMissing, setAssetMissing] = useState(false)

  if (assetMissing) {
    return (
      <div className="relative flex h-[20rem] items-center justify-center rounded-[1.5rem] border border-dashed border-white/12 bg-black/12 px-6 text-center backdrop-blur sm:h-[28rem] sm:px-8 lg:h-[42rem] lg:rounded-[2rem]">
        <div className="animate-stage-glow absolute inset-x-10 bottom-8 h-10 rounded-full bg-primary/15 blur-3xl sm:inset-x-14 sm:bottom-10 sm:h-12" />
        <div className="relative max-w-xs">
          <p className="text-xs uppercase tracking-[0.28em] text-white/35 sm:text-sm sm:tracking-[0.3em]">
            video da capa
          </p>
          <p className="mt-4 text-base font-semibold text-white sm:text-lg">
            Coloque o video em `public/hero-cover.mp4`
          </p>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Assim que o arquivo existir, essa area mostra o video
            automaticamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[20rem] overflow-hidden rounded-[1.5rem] bg-black/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:h-[28rem] lg:h-[42rem] lg:rounded-[2rem] lg:shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="animate-hero-spin absolute left-1/2 top-1/2 z-0 h-[14rem] w-[14rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 sm:h-[18rem] sm:w-[18rem] lg:h-[24rem] lg:w-[24rem]" />
      <div
        className="animate-hero-spin absolute left-1/2 top-1/2 z-0 h-[10rem] w-[10rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/25 sm:h-[14rem] sm:w-[14rem] lg:h-[18rem] lg:w-[18rem]"
        style={{ animationDirection: "reverse", animationDuration: "18s" }}
      />

      <video
        className="relative z-10 h-full w-full object-cover"
        src={HERO_VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={() => setAssetMissing(true)}
      />

      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(4,8,18,0.08),rgba(4,8,18,0.02)_35%,rgba(4,8,18,0.48)_100%)]" />
      <div className="animate-stage-glow pointer-events-none absolute inset-x-8 bottom-5 z-20 h-10 rounded-full bg-primary/18 blur-3xl sm:inset-x-12 sm:bottom-6 sm:h-12" />
    </div>
  )
}

export function HeroCover({ featuredProduct }: { featuredProduct?: Product }) {
  const coverProduct = featuredProduct ?? fallbackProduct

  return (
    <section className="relative mb-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.16),transparent_30%),linear-gradient(135deg,rgba(5,10,24,0.98),rgba(10,16,34,0.94))] px-4 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:mb-14 sm:px-8 sm:py-10 lg:rounded-[2rem] lg:px-12 lg:py-12 lg:shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
      <div className="hero-grid-mask absolute inset-0 opacity-35" />
      <div className="animate-hero-orb absolute -left-8 top-5 h-24 w-24 rounded-full bg-sky-400/20 blur-3xl sm:-left-10 sm:top-8 sm:h-36 sm:w-36" />
      <div className="animate-hero-pulse absolute right-1 top-1 h-24 w-24 rounded-full bg-primary/20 blur-3xl sm:right-6 sm:top-6 sm:h-40 sm:w-40" />
      <div className="animate-hero-orb absolute bottom-0 right-1/4 h-18 w-18 rounded-full bg-amber-300/15 blur-3xl [animation-delay:-3s] sm:right-1/3 sm:h-28 sm:w-28" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center lg:gap-10">
        <div
          aria-label={`Destaque em video de ${coverProduct.name}`}
          className="order-1 relative flex justify-center lg:order-2 lg:justify-end"
        >
          <div className="relative w-full max-w-none overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_22px_50px_rgba(0,0,0,0.32)] backdrop-blur sm:max-w-[520px] lg:max-w-[430px] lg:rounded-[2rem] lg:shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.12),transparent_40%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_42%)]" />
            <HeroVideo />
          </div>
        </div>

        <div className="order-2 max-w-2xl lg:order-1">
          <Badge className="mb-3 border border-primary/20 bg-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-primary sm:mb-4 sm:text-[11px] sm:tracking-[0.24em]">
            Camisas em destaque
          </Badge>

          <h1 className="max-w-[11ch] text-[2.55rem] font-black leading-[0.9] tracking-[-0.06em] text-white sm:max-w-xl sm:text-5xl sm:leading-none lg:text-6xl">
            A CAMISA CERTA
            <span className="mt-2 block bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
              PARA QUEM VIVE FUTEBOL
            </span>
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-6 text-white/72 sm:mt-5 sm:text-base sm:leading-7 md:text-lg">
            Modelos selecionados, estilo marcante e qualidade para torcer com
            personalidade.
          </p>

          <div className="mt-6 flex flex-col items-stretch gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center">
            <Button
              asChild
              size="lg"
              className="w-full rounded-full px-6 shadow-lg shadow-primary/25 sm:w-auto"
            >
              <Link href="#produtos">
                Ver produtos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
              <Sparkles className="mb-2 h-5 w-5 text-accent sm:mb-3" />
              <p className="text-sm font-semibold text-white">
                Envio para toda a Fortaleza
              </p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Receba sua camisa com rapidez e praticidade em toda a cidade.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary sm:mb-3" />
              <p className="text-sm font-semibold text-white">
                Qualidade premium
              </p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Modelos escolhidos para unir conforto, acabamento e presenca.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
              <Trophy className="mb-2 h-5 w-5 text-sky-300 sm:mb-3" />
              <p className="text-sm font-semibold text-white">Compra segura</p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Navegue com tranquilidade e finalize seu pedido com confianca.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
