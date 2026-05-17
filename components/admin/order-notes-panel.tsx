"use client"

import { useState } from "react"
import { FileText, Loader2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { OrderNote } from "@/lib/types"

interface OrderNotesPanelProps {
  notes: OrderNote[]
  isLoading: boolean
  onCreateNote: (input: {
    title: string
    reference?: string
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
  notes,
  isLoading,
  onCreateNote,
  onDeleteNote,
}: OrderNotesPanelProps) {
  const [title, setTitle] = useState("")
  const [reference, setReference] = useState("")
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (title.trim().length < 2 || content.trim().length < 3) {
      return
    }

    try {
      setIsSubmitting(true)
      await onCreateNote({
        title: title.trim(),
        reference: reference.trim(),
        content: content.trim(),
      })
      setTitle("")
      setReference("")
      setContent("")
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
          Anotacoes da loja
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Titulo
            </label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex: Produtos para pegar na segunda"
              className="bg-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Referencia
            </label>
            <Input
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Ex: Segunda-feira, fornecedor, lista do dia"
              className="bg-input"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Anotacao
            </label>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Ex: pegar 12 camisas do Brasil, 4 do Fortaleza e confirmar pagamento do lote..."
              className="min-h-28 bg-input"
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            disabled={
              isSubmitting || title.trim().length < 2 || content.trim().length < 3
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
              Use esta area para anotar o que precisa buscar, separar ou lembrar
              na loja.
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
                      <Badge variant="outline">{note.title || "Anotacao"}</Badge>
                      {note.reference ? (
                        <Badge variant="secondary">{note.reference}</Badge>
                      ) : null}
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
