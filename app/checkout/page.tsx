"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Loader2, ShoppingBag, Store, Truck } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/use-cart"
import type { DeliveryMethod, PaymentMethod } from "@/lib/types"

const PAYMENT_OPTIONS: Array<{
  value: PaymentMethod
  label: string
  description: string
}> = [
  {
    value: "pix",
    label: "Pix",
    description: "Pagamento combinado pelo atendimento da loja.",
  },
  {
    value: "cartao",
    label: "Cartao",
    description: "Pagamento no cartao na entrega ou retirada.",
  },
]

const DELIVERY_OPTIONS: Array<{
  value: DeliveryMethod
  label: string
  description: string
}> = [
  {
    value: "moto-uber",
    label: "Moto Uber",
    description: "Entrega no endereco informado.",
  },
  {
    value: "retirada",
    label: "Retirada",
    description: "Cliente retira direto com a loja.",
  },
]

function ProductThumb({
  src,
  alt,
}: {
  src: string
  alt: string
}) {
  if (src.startsWith("data:")) {
    return <img src={src} alt={alt} className="h-full w-full object-cover" />
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="72px"
      className="object-cover"
    />
  )
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, totalItems, totalPrice, clearCart, isReady } = useCart()
  const [formData, setFormData] = useState({
    name: "",
    whatsapp: "",
    paymentMethod: "pix" as PaymentMethod,
    deliveryMethod: "moto-uber" as DeliveryMethod,
    street: "",
    number: "",
    neighborhood: "",
    reference: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const needsAddress = formData.deliveryMethod === "moto-uber"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (items.length === 0) {
      setSubmitError("Adicione ao menos um item antes de finalizar.")
      return
    }

    try {
      setIsSubmitting(true)
      setSubmitError("")

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: formData.name,
            whatsapp: formData.whatsapp,
          },
          paymentMethod: formData.paymentMethod,
          deliveryMethod: formData.deliveryMethod,
          address: needsAddress
            ? {
                street: formData.street,
                number: formData.number,
                neighborhood: formData.neighborhood,
                reference: formData.reference,
              }
            : null,
          notes: formData.notes,
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
          })),
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.orderId) {
        throw new Error(payload?.error || "Nao foi possivel enviar o pedido.")
      }

      clearCart()
      router.push(
        `/checkout/sucesso?pedido=${encodeURIComponent(
          payload.orderId
        )}&pagamento=${formData.paymentMethod}&entrega=${formData.deliveryMethod}`
      )
    } catch (error) {
      console.error("Erro ao enviar pedido:", error)
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel enviar o pedido."
      )
      setIsSubmitting(false)
    }
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground">
                  FORTAL STORE
                </span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Checkout
                </span>
              </div>
            </Link>
          </div>
        </header>

        <main className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-lg border-border bg-card">
            <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="rounded-full bg-secondary p-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Seu carrinho esta vazio
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">
                  Volte para a loja, escolha seus produtos e depois finalize o
                  pedido aqui.
                </p>
              </div>
              <Button asChild>
                <Link href="/">Voltar para a loja</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-foreground">
                FORTAL STORE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Finalizar pedido
              </span>
            </div>
          </Link>

          <Button variant="outline" asChild>
            <Link href="/">Voltar para a loja</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 max-w-2xl">
          <Badge className="bg-primary/15 text-primary">Checkout da loja</Badge>
          <h1 className="mt-3 text-3xl font-bold text-foreground">
            Complete seus dados para fechar o pedido
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Escolha como pagar, defina a forma de entrega e envie o pedido para
            aparecer no painel admin.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Dados do cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Ex: Joao da Silva"
                      required
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      value={formData.whatsapp}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          whatsapp: event.target.value,
                        }))
                      }
                      placeholder="(85) 99999-9999"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Metodo de pagamento
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {PAYMENT_OPTIONS.map((option) => {
                      const isSelected = formData.paymentMethod === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData((current) => ({
                              ...current,
                              paymentMethod: option.value,
                            }))
                          }
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/20 hover:border-primary/50"
                          }`}
                        >
                          <p className="font-semibold text-foreground">
                            {option.label}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Forma de entrega
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {DELIVERY_OPTIONS.map((option) => {
                      const isSelected = formData.deliveryMethod === option.value

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData((current) => ({
                              ...current,
                              deliveryMethod: option.value,
                            }))
                          }
                          className={`rounded-2xl border p-4 text-left transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-secondary/20 hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {option.value === "retirada" ? (
                              <Store className="h-4 w-4 text-primary" />
                            ) : (
                              <Truck className="h-4 w-4 text-primary" />
                            )}
                            <p className="font-semibold text-foreground">
                              {option.label}
                            </p>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {option.description}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {needsAddress ? (
                  <div className="space-y-4 rounded-2xl border border-border bg-secondary/20 p-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      Endereco para entrega
                    </h2>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="street">Rua</Label>
                        <Input
                          id="street"
                          value={formData.street}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              street: event.target.value,
                            }))
                          }
                          placeholder="Ex: Rua das Flores"
                          required={needsAddress}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="number">Numero</Label>
                        <Input
                          id="number"
                          value={formData.number}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              number: event.target.value,
                            }))
                          }
                          placeholder="Ex: 120"
                          required={needsAddress}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="neighborhood">Bairro</Label>
                        <Input
                          id="neighborhood"
                          value={formData.neighborhood}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              neighborhood: event.target.value,
                            }))
                          }
                          placeholder="Ex: Aldeota"
                          required={needsAddress}
                        />
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="reference">Referencia</Label>
                        <Input
                          id="reference"
                          value={formData.reference}
                          onChange={(event) =>
                            setFormData((current) => ({
                              ...current,
                              reference: event.target.value,
                            }))
                          }
                          placeholder="Ponto de referencia para facilitar a entrega"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="notes">Observacoes do pedido</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Ex: entregar no periodo da tarde"
                    className="min-h-28"
                  />
                </div>

                {submitError ? (
                  <p className="text-sm leading-6 text-destructive">
                    {submitError}
                  </p>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando pedido...
                    </>
                  ) : (
                    "Enviar pedido"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="h-fit border-border bg-card lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle>Resumo do pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-secondary/20 p-3"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-secondary">
                    <ProductThumb src={item.imageUrl} alt={item.name} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge className="bg-primary/15 text-primary">
                        {item.team}
                      </Badge>
                      <Badge variant="outline">Tam. {item.size}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.quantity} x R$ {item.price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <p className="text-sm font-bold text-accent">
                    R$ {(item.quantity * item.price)
                      .toFixed(2)
                      .replace(".", ",")}
                  </p>
                </div>
              ))}

              <div className="rounded-xl border border-border bg-background/70 p-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Itens</span>
                  <span>{totalItems}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Entrega</span>
                  <span>A combinar</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-foreground">
                    Total dos produtos
                  </span>
                  <span className="text-2xl font-bold text-accent">
                    R$ {totalPrice.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
