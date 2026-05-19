import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import {
  deleteRows,
  ensureSupabaseAvailable,
  insertRow,
  selectRows,
  shouldUseSupabaseStorage,
} from "@/lib/supabase-rest"
import type { OrderNote } from "@/lib/types"

const ORDER_NOTES_FILE = path.join(process.cwd(), "data", "order-notes.json")

interface OrderNoteRow {
  id: string
  title: string
  reference: string
  content: string
  created_at: string
  updated_at: string
  order_id: string | null
  customer_name: string | null
}

function sortOrderNotes(notes: OrderNote[]) {
  return [...notes].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )
}

function mapOrderNoteRowToNote(row: OrderNoteRow): OrderNote {
  return {
    id: row.id,
    title: row.title,
    reference: row.reference,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    orderId: row.order_id,
    customerName: row.customer_name,
  }
}

function mapOrderNoteToRow(note: OrderNote): OrderNoteRow {
  return {
    id: note.id,
    title: note.title,
    reference: note.reference?.trim() || "",
    content: note.content,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
    order_id: note.orderId ?? null,
    customer_name: note.customerName ?? null,
  }
}

async function writeOrderNotesToFile(notes: OrderNote[]) {
  await fs.mkdir(path.dirname(ORDER_NOTES_FILE), { recursive: true })
  await fs.writeFile(ORDER_NOTES_FILE, JSON.stringify(notes, null, 2), "utf-8")
}

async function readOrderNotesFromFile() {
  try {
    const contents = await fs.readFile(ORDER_NOTES_FILE, "utf-8")
    const parsed = JSON.parse(contents)

    return Array.isArray(parsed)
      ? sortOrderNotes(parsed as OrderNote[])
      : []
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException

    if (nodeError.code === "ENOENT") {
      await writeOrderNotesToFile([])
      return []
    }

    throw error
  }
}

async function readOrderNotesFromSupabase() {
  ensureSupabaseAvailable()

  const rows = await selectRows<OrderNoteRow>("order_notes", {
    orderBy: {
      column: "updated_at",
      ascending: false,
    },
  })

  return rows.map(mapOrderNoteRowToNote)
}

async function readOrderNotes() {
  if (shouldUseSupabaseStorage()) {
    return readOrderNotesFromSupabase()
  }

  return readOrderNotesFromFile()
}

export async function getOrderNotes() {
  return readOrderNotes()
}

export async function createOrderNote(
  input: Omit<OrderNote, "id" | "createdAt" | "updatedAt">
) {
  const now = new Date().toISOString()
  const note: OrderNote = {
    id: `NOTE-${randomUUID().split("-")[0].toUpperCase()}`,
    title: input.title,
    reference: input.reference?.trim() || "",
    content: input.content,
    createdAt: now,
    updatedAt: now,
    orderId: input.orderId ?? null,
    customerName: input.customerName ?? null,
  }

  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")

    const createdRow = await insertRow<OrderNoteRow>(
      "order_notes",
      mapOrderNoteToRow(note)
    )

    return createdRow ? mapOrderNoteRowToNote(createdRow) : note
  }

  const notes = await readOrderNotesFromFile()
  notes.unshift(note)
  await writeOrderNotesToFile(notes)
  return note
}

export async function deleteOrderNote(id: string) {
  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")

    const deletedRows = await deleteRows<OrderNoteRow>("order_notes", [
      {
        column: "id",
        value: id,
      },
    ])

    return deletedRows.length > 0
  }

  const notes = await readOrderNotesFromFile()
  const nextNotes = notes.filter((note) => note.id !== id)

  if (nextNotes.length === notes.length) {
    return false
  }

  await writeOrderNotesToFile(nextNotes)
  return true
}
