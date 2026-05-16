import {
  BlobNotFoundError,
  del,
  get,
  list,
  put,
} from "@vercel/blob"

const BLOB_TOKEN_ENV_NAME = "BLOB_READ_WRITE_TOKEN"

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StorageConfigurationError"
  }
}

export function isBlobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

export function ensureServerStorageAvailable() {
  if (isBlobStorageEnabled()) {
    return
  }

  if (process.env.VERCEL === "1") {
    throw new StorageConfigurationError(
      `Defina ${BLOB_TOKEN_ENV_NAME} na Vercel para salvar produtos, pedidos e notificacoes.`
    )
  }
}

async function readBlobText(pathname: string) {
  const result = await get(pathname, {
    access: "private",
    useCache: false,
  })

  if (!result || result.statusCode !== 200 || !result.stream) {
    return null
  }

  return new Response(result.stream).text()
}

export async function readJsonRecord<T>(pathname: string) {
  ensureServerStorageAvailable()

  if (!isBlobStorageEnabled()) {
    return null
  }

  const text = await readBlobText(pathname)

  if (!text) {
    return null
  }

  return JSON.parse(text) as T
}

export async function listJsonRecords<T>(prefix: string) {
  ensureServerStorageAvailable()

  if (!isBlobStorageEnabled()) {
    return [] as T[]
  }

  const records: T[] = []
  let cursor: string | undefined
  let hasMore = false

  do {
    const page = await list({
      prefix,
      cursor,
      limit: 1000,
    })

    const pageRecords = await Promise.all(
      page.blobs.map(async (blob) => {
        const text = await readBlobText(blob.pathname)

        if (!text) {
          return null
        }

        try {
          return JSON.parse(text) as T
        } catch (error) {
          console.error(
            `[storage] Error parsing blob JSON at ${blob.pathname}:`,
            error
          )
          return null
        }
      })
    )

    for (const record of pageRecords) {
      if (record !== null) {
        records.push(record)
      }
    }
    cursor = page.cursor
    hasMore = page.hasMore
  } while (hasMore && cursor)

  return records
}

export async function putJsonRecord<T>(pathname: string, record: T) {
  ensureServerStorageAvailable()

  if (!isBlobStorageEnabled()) {
    return
  }

  await put(pathname, JSON.stringify(record, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    cacheControlMaxAge: 60,
  })
}

export async function deleteJsonRecord(pathname: string) {
  ensureServerStorageAvailable()

  if (!isBlobStorageEnabled()) {
    return false
  }

  try {
    await del(pathname)
    return true
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return false
    }

    throw error
  }
}
