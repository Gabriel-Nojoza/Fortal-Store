import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import {
  deleteRows,
  ensureSupabaseAvailable,
  selectRows,
  shouldUseSupabaseStorage,
  upsertRow,
} from "@/lib/supabase-rest"
import type { PushSubscriptionRecord, StoredPushSubscription } from "@/lib/types"

const PUSH_SUBSCRIPTIONS_FILE = path.join(
  process.cwd(),
  "data",
  "push-subscriptions.json"
)

interface PushSubscriptionRow {
  id: string
  endpoint: string
  subscription: StoredPushSubscription
  device_name: string
  user_agent: string
  created_at: string
  updated_at: string
}

function sortPushSubscriptions(records: PushSubscriptionRecord[]) {
  return [...records].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )
}

function mapPushSubscriptionRowToRecord(
  row: PushSubscriptionRow
): PushSubscriptionRecord {
  return {
    id: row.id,
    subscription: row.subscription,
    deviceName: row.device_name,
    userAgent: row.user_agent,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function writePushSubscriptionsToFile(records: PushSubscriptionRecord[]) {
  await fs.mkdir(path.dirname(PUSH_SUBSCRIPTIONS_FILE), { recursive: true })
  await fs.writeFile(
    PUSH_SUBSCRIPTIONS_FILE,
    JSON.stringify(records, null, 2),
    "utf-8"
  )
}

async function readPushSubscriptionsFromFile() {
  try {
    const contents = await fs.readFile(PUSH_SUBSCRIPTIONS_FILE, "utf-8")
    const parsed = JSON.parse(contents)

    return Array.isArray(parsed)
      ? sortPushSubscriptions(parsed as PushSubscriptionRecord[])
      : []
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException

    if (nodeError.code === "ENOENT") {
      await writePushSubscriptionsToFile([])
      return []
    }

    throw error
  }
}

async function readPushSubscriptionsFromSupabase() {
  ensureSupabaseAvailable()

  const rows = await selectRows<PushSubscriptionRow>("push_subscriptions", {
    orderBy: {
      column: "updated_at",
      ascending: false,
    },
  })

  return rows.map(mapPushSubscriptionRowToRecord)
}

async function readPushSubscriptions() {
  if (shouldUseSupabaseStorage()) {
    return readPushSubscriptionsFromSupabase()
  }

  return readPushSubscriptionsFromFile()
}

export async function getPushSubscriptions() {
  return readPushSubscriptions()
}

export async function savePushSubscription(input: {
  subscription: StoredPushSubscription
  deviceName: string
  userAgent: string
}) {
  const now = new Date().toISOString()

  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")

    const existingRows = await selectRows<PushSubscriptionRow>(
      "push_subscriptions",
      {
        filters: [
          {
            column: "endpoint",
            value: input.subscription.endpoint,
          },
        ],
        limit: 1,
      }
    )

    const existingRow = existingRows[0]
    const savedRow = await upsertRow<PushSubscriptionRow>(
      "push_subscriptions",
      {
        id: existingRow?.id || randomUUID(),
        endpoint: input.subscription.endpoint,
        subscription: input.subscription,
        device_name: input.deviceName,
        user_agent: input.userAgent,
        created_at: existingRow?.created_at || now,
        updated_at: now,
      },
      "endpoint"
    )

    return savedRow ? mapPushSubscriptionRowToRecord(savedRow) : null
  }

  const records = await readPushSubscriptionsFromFile()
  const existingIndex = records.findIndex(
    (record) => record.subscription.endpoint === input.subscription.endpoint
  )

  if (existingIndex >= 0) {
    records[existingIndex] = {
      ...records[existingIndex],
      subscription: input.subscription,
      deviceName: input.deviceName,
      userAgent: input.userAgent,
      updatedAt: now,
    }

    await writePushSubscriptionsToFile(records)
    return records[existingIndex]
  }

  const record: PushSubscriptionRecord = {
    id: randomUUID(),
    subscription: input.subscription,
    deviceName: input.deviceName,
    userAgent: input.userAgent,
    createdAt: now,
    updatedAt: now,
  }

  records.unshift(record)
  await writePushSubscriptionsToFile(records)
  return record
}

export async function removePushSubscription(endpoint: string) {
  if (shouldUseSupabaseStorage()) {
    ensureSupabaseAvailable("write")

    const deletedRows = await deleteRows<PushSubscriptionRow>(
      "push_subscriptions",
      [
        {
          column: "endpoint",
          value: endpoint,
        },
      ]
    )

    return deletedRows.length > 0
  }

  const records = await readPushSubscriptionsFromFile()
  const nextRecords = records.filter(
    (record) => record.subscription.endpoint !== endpoint
  )

  if (nextRecords.length === records.length) {
    return false
  }

  await writePushSubscriptionsToFile(nextRecords)
  return true
}
