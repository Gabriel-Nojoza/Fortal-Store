import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import {
  deleteJsonRecord,
  ensureServerStorageAvailable,
  isBlobStorageEnabled,
  listJsonRecords,
  putJsonRecord,
  readJsonRecord,
} from "@/lib/blob-json-store"
import type { OrderNote } from "@/lib/types"

const ORDER_NOTES_FILE = path.join(process.cwd(), "data", "order-notes.json")
const ORDER_NOTES_BLOB_PREFIX = "order-notes/"

function getOrderNoteBlobPath(id: string) {
  return `${ORDER_NOTES_BLOB_PREFIX}${id}.json`
}

function sortOrderNotes(notes: OrderNote[]) {
  return [...notes].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )
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

async function readOrderNotes() {
  ensureServerStorageAvailable()

  if (isBlobStorageEnabled()) {
    const notes = await listJsonRecords<OrderNote>(ORDER_NOTES_BLOB_PREFIX)
    return sortOrderNotes(notes)
  }

  return readOrderNotesFromFile()
}

export async function getOrderNotes() {
  return readOrderNotes()
}

export async function createOrderNote(
  input: Omit<OrderNote, "id" | "createdAt" | "updatedAt">
) {
  ensureServerStorageAvailable()

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

  if (isBlobStorageEnabled()) {
    await putJsonRecord(getOrderNoteBlobPath(note.id), note)
    return note
  }

  const notes = await readOrderNotesFromFile()
  notes.unshift(note)
  await writeOrderNotesToFile(notes)
  return note
}

export async function deleteOrderNote(id: string) {
  ensureServerStorageAvailable()

  if (isBlobStorageEnabled()) {
    const currentNote = await readJsonRecord<OrderNote>(getOrderNoteBlobPath(id))

    if (!currentNote) {
      return false
    }

    return deleteJsonRecord(getOrderNoteBlobPath(id))
  }

  const notes = await readOrderNotesFromFile()
  const nextNotes = notes.filter((note) => note.id !== id)

  if (nextNotes.length === notes.length) {
    return false
  }

  await writeOrderNotesToFile(nextNotes)
  return true
}
