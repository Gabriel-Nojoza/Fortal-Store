"use client"

import {
  Bell,
  Clock3,
  CreditCard,
  Eye,
  MapPin,
  Package,
  Phone,
  Store,
  Truck,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DeliveryMethod, Order, PaymentMethod } from "@/lib/types"

interface OrdersPanelProps {
  orders: Order[]
  isLoading: boolean
  newOrderCount: number
  onMarkAsSeen: (id: string) => void
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  pix: "Pix",
  cartao: "Cartao",
}

const DELIVERY_LABELS: Record<DeliveryMethod, string> = {
  "moto-uber": "Moto Uber",
  retirada: "Retirada",
}

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function OrdersPanel({
  orders,
  isLoading,
  newOrderCount,
  onMarkAsSeen,
}: OrdersPanelProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Pedidos Recebidos ({orders.length})
          </CardTitle>
          <Badge
            variant={newOrderCount > 0 ? "default" : "outline"}
            className={newOrderCount > 0 ? "bg-primary text-primary-foreground" : ""}
          >
            {newOrderCount > 0
              ? `${newOrderCount} novo(s)`
              : "Sem pedidos novos"}
          </Badge>
        </div>

        {newOrderCount > 0 ? (
          <Alert className="border-primary/30 bg-primary/10">
            <Bell className="h-4 w-4 text-primary" />
            <AlertTitle>Pedido novo na loja</AlertTitle>
            <AlertDescription>
              {newOrderCount === 1
                ? "Ha 1 pedido novo aguardando sua confirmacao."
                : `Ha ${newOrderCount} pedidos novos aguardando sua confirmacao.`}
            </AlertDescription>
          </Alert>
        ) : null}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/30 py-16 text-center">
            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">
              Nenhum pedido recebido ainda
            </p>
            <p className="text-sm text-muted-foreground">
              Quando um cliente finalizar a compra, o pedido aparece aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-border bg-secondary/30 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {order.customer.name}
                      </h3>
                      <Badge variant="outline">{order.id}</Badge>
                      {order.status === "novo" ? (
                        <Badge className="bg-primary text-primary-foreground">
                          Novo pedido
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Visualizado</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {order.customer.whatsapp}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-4 w-4" />
                        {formatOrderDate(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm text-muted-foreground">
                      {order.totalItems} item(ns)
                    </p>
                    <p className="text-2xl font-bold text-accent">
                      {formatMoney(order.totalPrice)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Pagamento
                      </p>
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        <CreditCard className="h-4 w-4 text-primary" />
                        {PAYMENT_LABELS[order.paymentMethod]}
                      </p>
                    </div>

                    <div className="rounded-xl border border-border bg-background/70 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Entrega
                      </p>
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                        {order.deliveryMethod === "retirada" ? (
                          <Store className="h-4 w-4 text-primary" />
                        ) : (
                          <Truck className="h-4 w-4 text-primary" />
                        )}
                        {DELIVERY_LABELS[order.deliveryMethod]}
                      </p>

                      {order.address ? (
                        <p className="mt-2 inline-flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                          <MapPin className="mt-1 h-4 w-4 shrink-0" />
                          <span>
                            {order.address.street}, {order.address.number}
                            <br />
                            {order.address.neighborhood}
                            {order.address.reference
                              ? ` • Ref.: ${order.address.reference}`
                              : ""}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Cliente vai retirar o pedido.
                        </p>
                      )}
                    </div>

                    {order.notes ? (
                      <div className="rounded-xl border border-border bg-background/70 p-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                          Observacoes
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {order.notes}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <div className="rounded-xl border border-border bg-background/70 p-3">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      Itens do pedido
                    </p>

                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={`${order.id}-${item.id}`}
                          className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-secondary/30 p-3"
                        >
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-sm font-medium text-foreground">
                              {item.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.team} • Tam. {item.size}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">
                              x{item.quantity}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatMoney(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {order.status === "novo" ? (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => onMarkAsSeen(order.id)}
                    >
                      <Eye className="h-4 w-4" />
                      Marcar como visualizado
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
