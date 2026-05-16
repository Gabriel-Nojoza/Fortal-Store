import { createHash, randomUUID } from "crypto"
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
import type { PushSubscriptionRecord, StoredPushSubscription } from "@/lib/types"

const PUSH_SUBSCRIPTIONS_FILE = path.join(
  process.cwd(),
  "data",
  "push-subscriptions.json"
)
const PUSH_SUBSCRIPTIONS_BLOB_PREFIX = "push-subscriptions/"

function getSubscriptionBlobPath(endpoint: string) {
  const hash = createHash("sha256").update(endpoint).digest("hex")
  return `${PUSH_SUBSCRIPTIONS_BLOB_PREFIX}${hash}.json`
}

function sortPushSubscriptions(records: PushSubscriptionRecord[]) {
  return [...records].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  )
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

async function readPushSubscriptions() {
  ensureServerStorageAvailable()

  if (isBlobStorageEnabled()) {
    const records = await listJsonRecords<PushSubscriptionRecord>(
      PUSH_SUBSCRIPTIONS_BLOB_PREFIX
    )

    return sortPushSubscriptions(records)
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
  ensureServerStorageAvailable()

  const now = new Date().toISOString()

  if (isBlobStorageEnabled()) {
    const pathname = getSubscriptionBlobPath(input.subscription.endpoint)
    const existingRecord = await readJsonRecord<PushSubscriptionRecord>(pathname)

    const record: PushSubscriptionRecord = existingRecord
      ? {
          ...existingRecord,
          subscription: input.subscription,
          deviceName: input.deviceName,
          userAgent: input.userAgent,
          updatedAt: now,
        }
      : {
          id: randomUUID(),
          subscription: input.subscription,
          deviceName: input.deviceName,
          userAgent: input.userAgent,
          createdAt: now,
          updatedAt: now,
        }

    await putJsonRecord(pathname, record)
    return record
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
  ensureServerStorageAvailable()

  if (isBlobStorageEnabled()) {
    return deleteJsonRecord(getSubscriptionBlobPath(endpoint))
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
