"use client"

import { useMemo, useState } from "react"
import { FileText, Loader2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { Order, OrderNote } from "@/lib/types"

interface OrderNotesPanelProps {
  orders: Order[]
  notes: OrderNote[]
  isLoading: boolean
  onCreateNote: (input: {
    orderId: string
    customerName: string
    content: string
  }) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
}

function formatNoteDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

export function OrderNotesPanel({
  orders,
  notes,
  isLoading,
  onCreateNote,
  onDeleteNote,
}: OrderNotesPanelProps) {
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) ?? null,
    [orders, selectedOrderId]
  )

  const hasOrders = orders.length > 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedOrder || content.trim().length < 3) {
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateNote({
        orderId: selectedOrder.id,
        customerName: selectedOrder.customer.name,
        content: content.trim(),
      })
      setContent("")
      setSelectedOrderId("")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeletingId(id)
      await onDeleteNote(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-primary" />
          Anotacoes de pedidos
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Pedido
            </label>
            <select
              value={selectedOrderId}
              onChange={(event) => setSelectedOrderId(event.target.value)}
              disabled={!hasOrders || isSubmitting}
              className="flex h-11 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground"
            >
              <option value="">Selecione um pedido</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.id} - {order.customer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Anotacao
            </label>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Ex: cliente pediu envio apos 18h, aguardando comprovante Pix..."
              className="min-h-28 bg-input"
              disabled={!hasOrders || isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting || !selectedOrder || content.trim().length < 3
            }
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando anotacao
              </>
            ) : (
              "Salvar anotacao"
            )}
          </Button>
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/30 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhuma anotacao criada ainda
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use esta area para anotar combinados, pagamento e observacoes dos
              pedidos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-border bg-background/70 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{note.orderId}</Badge>
                      <Badge variant="secondary">{note.customerName}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatNoteDate(note.updatedAt)}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {note.content}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void handleDelete(note.id)}
                    disabled={deletingId === note.id}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    {deletingId === note.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
