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
    "Camisa oficial do Fortaleza com presença forte, acabamento premium e visual marcante.",
  sizes: ["P", "M", "G", "GG"],
  imageUrl: "/uploads/fortaleza-home.jpg",
  createdAt: "2024-01-15T10:00:00Z",
}

function HeroVideo() {
  const [assetMissing, setAssetMissing] = useState(false)

  if (assetMissing) {
    return (
      <div className="relative flex h-[38rem] items-center justify-center rounded-[2rem] border border-dashed border-white/12 bg-black/12 px-8 text-center backdrop-blur sm:h-[42rem]">
        <div className="animate-stage-glow absolute inset-x-14 bottom-10 h-12 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative max-w-xs">
          <p className="text-sm uppercase tracking-[0.3em] text-white/35">
            vídeo da capa
          </p>
          <p className="mt-4 text-lg font-semibold text-white">
            Coloque o vídeo em `public/hero-cover.mp4`
          </p>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Assim que o arquivo existir, essa área mostra o vídeo automaticamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-[38rem] overflow-hidden rounded-[2rem] bg-black/30 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:h-[42rem]">
      <div className="animate-hero-spin absolute left-1/2 top-1/2 z-0 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />
      <div
        className="animate-hero-spin absolute left-1/2 top-1/2 z-0 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/25"
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

      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(4,8,18,0.1),rgba(4,8,18,0.02)_35%,rgba(4,8,18,0.55)_100%)]" />
      <div className="animate-stage-glow pointer-events-none absolute inset-x-12 bottom-6 z-20 h-12 rounded-full bg-primary/18 blur-3xl" />
    </div>
  )
}

export function HeroCover({ featuredProduct }: { featuredProduct?: Product }) {
  const _product = featuredProduct ?? fallbackProduct
  return (
    <section className="relative mb-14 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.28),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.16),transparent_30%),linear-gradient(135deg,rgba(5,10,24,0.98),rgba(10,16,34,0.94))] px-6 py-8 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
      <div className="hero-grid-mask absolute inset-0 opacity-35" />
      <div className="animate-hero-orb absolute -left-10 top-8 h-36 w-36 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="animate-hero-pulse absolute right-6 top-6 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="animate-hero-orb absolute bottom-0 right-1/3 h-28 w-28 rounded-full bg-amber-300/15 blur-3xl [animation-delay:-3s]" />

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
        <div className="max-w-2xl">
          <Badge className="mb-4 border border-primary/20 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-primary">
            Camisas em destaque
          </Badge>

          <h1 className="max-w-xl text-4xl font-black leading-none tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
            A CAMISA CERTA
            <span className="mt-2 block bg-gradient-to-r from-primary via-white to-accent bg-clip-text text-transparent">
              PARA QUEM VIVE FUTEBOL
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/72 md:text-lg">
            Modelos selecionados, estilo marcante e qualidade para torcer com
            personalidade.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full px-6 shadow-lg shadow-primary/25"
            >
              <Link href="#produtos">
                Ver produtos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
              <Sparkles className="mb-3 h-5 w-5 text-accent" />
              <p className="text-sm font-semibold text-white">
                Envio para toda a Fortaleza
              </p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Receba sua camisa com rapidez e praticidade em toda a cidade.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
              <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
              <p className="text-sm font-semibold text-white">
                Qualidade premium
              </p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Modelos escolhidos para unir conforto, acabamento e presença.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur">
              <Trophy className="mb-3 h-5 w-5 text-sky-300" />
              <p className="text-sm font-semibold text-white">Compra segura</p>
              <p className="mt-1 text-sm leading-6 text-white/60">
                Navegue com tranquilidade e finalize seu pedido com confiança.
              </p>
            </div>
          </div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[430px] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] shadow-[0_25px_80px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(74,222,128,0.12),transparent_40%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.12),transparent_42%)]" />
            <HeroVideo />
          </div>
        </div>
      </div>
    </section>
  )
}
