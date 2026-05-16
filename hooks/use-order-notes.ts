"use client"

import { useCallback, useEffect, useState } from "react"
import type { OrderNote } from "@/lib/types"

interface CreateOrderNoteInput {
  orderId: string
  customerName: string
  content: string
}

async function requestOrderNotes(): Promise<OrderNote[]> {
  const response = await fetch("/api/order-notes", {
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error || "Erro ao carregar anotacoes")
  }

  return response.json()
}

export function useOrderNotes(enabled = true) {
  const [notes, setNotes] = useState<OrderNote[]>([])
  const [isLoading, setIsLoading] = useState(enabled)

  const refreshOrderNotes = useCallback(async () => {
    if (!enabled) {
      setNotes([])
      setIsLoading(false)
      return
    }

    try {
      const nextNotes = await requestOrderNotes()
      setNotes(nextNotes)
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setNotes([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    void refreshOrderNotes()
  }, [enabled, refreshOrderNotes])

  const createNote = useCallback(async (input: CreateOrderNoteInput) => {
    const response = await fetch("/api/order-notes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(payload?.error || "Erro ao salvar anotacao")
    }

    const note = payload as OrderNote
    setNotes((current) => [note, ...current])
    return note
  }, [])

  const deleteNote = useCallback(async (id: string) => {
    const response = await fetch(`/api/order-notes/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null)
      throw new Error(payload?.error || "Erro ao excluir anotacao")
    }

    setNotes((current) => current.filter((note) => note.id !== id))
  }, [])

  return {
    notes,
    isLoading,
    refreshOrderNotes,
    createNote,
    deleteNote,
  }
}
