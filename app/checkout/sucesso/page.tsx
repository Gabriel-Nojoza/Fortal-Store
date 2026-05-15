import Link from "next/link"
import { CheckCircle2, CreditCard, Store, Truck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DeliveryMethod, PaymentMethod } from "@/lib/types"

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao: "Cartao",
}

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  "moto-uber": "Moto Uber",
  retirada: "Retirada",
}

function getNextStep(paymentMethod: PaymentMethod) {
  if (paymentMethod === "pix") {
    return "Agora e so confirmar a chave Pix e o valor final com o atendimento."
  }

  return "Agora e so combinar o pagamento no cartao com a loja no momento da entrega ou retirada."
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    pedido?: string
    pagamento?: PaymentMethod
    entrega?: DeliveryMethod
  }>
}) {
  const params = await searchParams
  const orderId = params.pedido || "Pedido enviado"
  const paymentMethod =
    params.pagamento === "cartao" ? "cartao" : "pix"
  const deliveryMethod =
    params.entrega === "retirada" ? "retirada" : "moto-uber"

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-2xl border-border bg-card">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <Badge className="mx-auto bg-primary/15 text-primary">
              Pedido enviado
            </Badge>
            <CardTitle className="mt-3 text-3xl">
              Recebemos seu pedido com sucesso
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border bg-secondary/20 p-5 text-center">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Codigo do pedido
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                {orderId}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Pagamento
                </p>
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  <CreditCard className="h-4 w-4 text-primary" />
                  {PAYMENT_LABELS[paymentMethod]}
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Entrega
                </p>
                <p className="inline-flex items-center gap-2 font-medium text-foreground">
                  {deliveryMethod === "retirada" ? (
                    <Store className="h-4 w-4 text-primary" />
                  ) : (
                    <Truck className="h-4 w-4 text-primary" />
                  )}
                  {DELIVERY_LABELS[deliveryMethod]}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-5">
              <p className="text-lg font-semibold text-foreground">
                Proximo passo
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {getNextStep(paymentMethod)}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                O pedido ja entrou no painel admin da loja para acompanhamento.
              </p>
            </div>

            <div className="flex justify-center">
              <Button asChild>
                <Link href="/">Voltar para a loja</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
