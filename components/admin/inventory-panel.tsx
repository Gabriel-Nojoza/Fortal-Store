"use client"

import { useEffect, useState } from "react"
import {
  Boxes,
  Loader2,
  Minus,
  Plus,
  Save,
  Search,
  TriangleAlert,
} from "lucide-react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { Product, SizeStock } from "@/lib/types"

const LOW_STOCK_THRESHOLD = 2

type InventoryDrafts = Record<string, SizeStock[]>

interface InventoryPanelProps {
  products: Product[]
  isLoading: boolean
  onSaveStock: (productId: string, sizes: SizeStock[]) => Promise<void>
}

function cloneSizes(sizes: SizeStock[]) {
  return sizes.map(({ size, quantity }) => ({ size, quantity }))
}

function buildDrafts(products: Product[]): InventoryDrafts {
  return Object.fromEntries(
    products.map((product) => [product.id, cloneSizes(product.sizes)])
  )
}

function areSizeStocksEqual(left: SizeStock[], right: SizeStock[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every(
    ({ size, quantity }, index) =>
      size === right[index]?.size && quantity === right[index]?.quantity
  )
}

function getTotalUnits(sizes: SizeStock[]) {
  return sizes.reduce((sum, { quantity }) => sum + quantity, 0)
}

function getStatusCopy(quantity: number) {
  if (quantity === 0) {
    return {
      label: "Sem estoque",
      className: "border-destructive/30 bg-destructive/10 text-destructive",
    }
  }

  if (quantity <= LOW_STOCK_THRESHOLD) {
    return {
      label: "Baixo",
      className: "border-amber-500/30 bg-amber-500/10 text-amber-500",
    }
  }

  return {
    label: "OK",
    className: "border-primary/30 bg-primary/10 text-primary",
  }
}

export function InventoryPanel({
  products,
  isLoading,
  onSaveStock,
}: InventoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [drafts, setDrafts] = useState<InventoryDrafts>({})
  const [savingProductId, setSavingProductId] = useState<string | null>(null)

  useEffect(() => {
    setDrafts(buildDrafts(products))
  }, [products])

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredProducts = products.filter((product) => {
    if (!normalizedSearch) {
      return true
    }

    return [product.name, product.team].some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    )
  })

  const totalUnits = products.reduce(
    (sum, product) => sum + getTotalUnits(product.sizes),
    0
  )
  const zeroStockSizes = products.reduce(
    (sum, product) =>
      sum + product.sizes.filter(({ quantity }) => quantity === 0).length,
    0
  )
  const lowStockSizes = products.reduce(
    (sum, product) =>
      sum +
      product.sizes.filter(
        ({ quantity }) =>
          quantity > 0 && quantity <= LOW_STOCK_THRESHOLD
      ).length,
    0
  )

  const setDraftQuantity = (productId: string, size: string, quantity: number) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [productId]: (currentDrafts[productId] ?? []).map((item) =>
        item.size === size
          ? { ...item, quantity: Math.max(0, Math.floor(quantity)) }
          : item
      ),
    }))
  }

  const handleQuantityInput = (
    productId: string,
    size: string,
    nextValue: string
  ) => {
    const parsed = Number(nextValue)
    setDraftQuantity(productId, size, Number.isFinite(parsed) ? parsed : 0)
  }

  const handleStep = (productId: string, size: string, amount: number) => {
    const currentSizes = drafts[productId] ?? []
    const currentQuantity =
      currentSizes.find((item) => item.size === size)?.quantity ?? 0

    setDraftQuantity(productId, size, currentQuantity + amount)
  }

  const resetDraft = (product: Product) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [product.id]: cloneSizes(product.sizes),
    }))
  }

  const handleSave = async (product: Product) => {
    const nextSizes = drafts[product.id] ?? product.sizes

    try {
      setSavingProductId(product.id)
      await onSaveStock(product.id, nextSizes)
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error)
      toast({
        title: "Nao foi possivel salvar o estoque",
        description:
          error instanceof Error
            ? error.message
            : "Tente novamente em instantes.",
      })
    } finally {
      setSavingProductId(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (products.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Boxes className="h-5 w-5 text-primary" />
            Controle de Estoque
          </CardTitle>
          <CardDescription>
            Cadastre um produto primeiro para liberar o ajuste de estoque por
            tamanho.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Boxes className="h-5 w-5 text-primary" />
              Controle de Estoque
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Ajuste as quantidades por tamanho sem misturar isso com o
              cadastro do produto. Para adicionar ou remover tamanhos, use a
              area de cadastro acima.
            </CardDescription>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Unidades totais
              </p>
              <p className="text-xl font-semibold text-foreground">
                {totalUnits}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tamanhos zerados
              </p>
              <p className="text-xl font-semibold text-destructive">
                {zeroStockSizes}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Estoque baixo
              </p>
              <p className="text-xl font-semibold text-amber-500">
                {lowStockSizes}
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome ou time"
            className="bg-input pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
            <p className="font-medium text-foreground">
              Nenhum produto encontrado
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tente buscar por outro nome ou time.
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const draftSizes = drafts[product.id] ?? product.sizes
            const hasChanges = !areSizeStocksEqual(draftSizes, product.sizes)
            const totalByProduct = getTotalUnits(draftSizes)

            return (
              <div
                key={product.id}
                className="rounded-xl border border-border bg-secondary/30 p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                      {product.imageUrl.startsWith("data:") ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={product.imageUrl}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {product.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-primary/30 text-primary"
                        >
                          {product.team}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-border text-muted-foreground"
                        >
                          {draftSizes.length} tamanhos
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-border",
                            totalByProduct === 0
                              ? "text-destructive"
                              : "text-foreground"
                          )}
                        >
                          {totalByProduct} unidades
                        </Badge>
                        {draftSizes.some(({ quantity }) => quantity === 0) ? (
                          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
                            <TriangleAlert className="h-3 w-3" />
                            Tamanho zerado
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resetDraft(product)}
                      disabled={!hasChanges || savingProductId === product.id}
                    >
                      Reverter
                    </Button>
                    <Button
                      type="button"
                      onClick={() => void handleSave(product)}
                      disabled={!hasChanges || savingProductId === product.id}
                    >
                      {savingProductId === product.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar estoque
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {draftSizes.map(({ size, quantity }) => {
                    const status = getStatusCopy(quantity)

                    return (
                      <div
                        key={size}
                        className="rounded-lg border border-border bg-background/70 p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            {size}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn("border", status.className)}
                          >
                            {status.label}
                          </Badge>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleStep(product.id, size, -1)}
                            aria-label={`Diminuir estoque do tamanho ${size}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <Input
                            type="number"
                            min="0"
                            inputMode="numeric"
                            value={quantity}
                            onChange={(event) =>
                              handleQuantityInput(
                                product.id,
                                size,
                                event.target.value
                              )
                            }
                            className="bg-input text-center"
                          />

                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => handleStep(product.id, size, 1)}
                            aria-label={`Aumentar estoque do tamanho ${size}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
