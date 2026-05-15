import { randomUUID } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import type { PushSubscriptionRecord, StoredPushSubscription } from "@/lib/types"

const PUSH_SUBSCRIPTIONS_FILE = path.join(
  process.cwd(),
  "data",
  "push-subscriptions.json"
)

async function writePushSubscriptions(records: PushSubscriptionRecord[]) {
  await fs.writeFile(
    PUSH_SUBSCRIPTIONS_FILE,
    JSON.stringify(records, null, 2),
    "utf-8"
  )
}

async function readPushSubscriptions() {
  try {
    const contents = await fs.readFile(PUSH_SUBSCRIPTIONS_FILE, "utf-8")
    const parsed = JSON.parse(contents)

    return Array.isArray(parsed) ? (parsed as PushSubscriptionRecord[]) : []
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException

    if (nodeError.code === "ENOENT") {
      await writePushSubscriptions([])
      return []
    }

    throw error
  }
}

export async function getPushSubscriptions() {
  return readPushSubscriptions()
}

export async function savePushSubscription(input: {
  subscription: StoredPushSubscription
  deviceName: string
  userAgent: string
}) {
  const records = await readPushSubscriptions()
  const existingIndex = records.findIndex(
    (record) => record.subscription.endpoint === input.subscription.endpoint
  )
  const now = new Date().toISOString()

  if (existingIndex >= 0) {
    records[existingIndex] = {
      ...records[existingIndex],
      subscription: input.subscription,
      deviceName: input.deviceName,
      userAgent: input.userAgent,
      updatedAt: now,
    }

    await writePushSubscriptions(records)
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
  await writePushSubscriptions(records)
  return record
}

export async function removePushSubscription(endpoint: string) {
  const records = await readPushSubscriptions()
  const nextRecords = records.filter(
    (record) => record.subscription.endpoint !== endpoint
  )

  if (nextRecords.length === records.length) {
    return false
  }

  await writePushSubscriptions(nextRecords)
  return true
}
