import {
  BlobAccessError,
  BlobNotFoundError,
  BlobServiceNotAvailable,
  BlobStoreNotFoundError,
  BlobStoreSuspendedError,
  del,
  get,
  head,
  list,
  put,
} from "@vercel/blob"

const BLOB_TOKEN_ENV_NAME = "BLOB_READ_WRITE_TOKEN"

export function isVercelRuntime() {
  return (
    process.env.VERCEL === "1" ||
    Boolean(process.env.VERCEL_ENV) ||
    Boolean(process.env.VERCEL_URL)
  )
}

function isBlobEnvironmentAvailable() {
  return Boolean(process.env[BLOB_TOKEN_ENV_NAME]) || isVercelRuntime()
}

function isRecoverableBlobReadError(error: unknown) {
  return (
    error instanceof BlobStoreNotFoundError ||
    error instanceof BlobStoreSuspendedError ||
    error instanceof BlobServiceNotAvailable ||
    error instanceof BlobAccessError
  )
}

function toStorageConfigurationError(error: unknown) {
  if (
    error instanceof BlobStoreNotFoundError ||
    error instanceof BlobStoreSuspendedError ||
    error instanceof BlobAccessError
  ) {
    return new StorageConfigurationError(
      "Conecte e configure o Vercel Blob para salvar produtos em producao."
    )
  }

  if (error instanceof BlobServiceNotAvailable) {
    return new StorageConfigurationError(
      "O Vercel Blob esta indisponivel no momento. Tente novamente."
    )
  }

  return error
}

export class StorageConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StorageConfigurationError"
  }
}

export function isBlobStorageEnabled() {
  return isBlobEnvironmentAvailable()
}

export function ensureServerStorageAvailable(mode: "read" | "write" = "read") {
  if (mode === "write" && isVercelRuntime() && !isBlobStorageEnabled()) {
    throw new StorageConfigurationError(
      `Configure ${BLOB_TOKEN_ENV_NAME} para permitir gravacoes na Vercel.`
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

  let text: string | null

  try {
    text = await readBlobText(pathname)
  } catch (error) {
    if (isRecoverableBlobReadError(error)) {
      return null
    }

    throw error
  }

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
    let page

    try {
      page = await list({
        prefix,
        cursor,
        limit: 1000,
      })
    } catch (error) {
      if (isRecoverableBlobReadError(error)) {
        return [] as T[]
      }

      throw error
    }

    const pageRecords = await Promise.all(
      page.blobs.map(async (blob) => {
        let text: string | null

        try {
          text = await readBlobText(blob.pathname)
        } catch (error) {
          if (isRecoverableBlobReadError(error)) {
            return null
          }

          throw error
        }

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

  try {
    await put(pathname, JSON.stringify(record, null, 2), {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json; charset=utf-8",
      cacheControlMaxAge: 60,
    })
  } catch (error) {
    throw toStorageConfigurationError(error)
  }
}

export async function deleteJsonRecord(pathname: string) {
  ensureServerStorageAvailable()

  if (!isBlobStorageEnabled()) {
    return false
  }

  try {
    const blob = await head(pathname)
    await del(blob.url)
    return true
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      return false
    }

    throw toStorageConfigurationError(error)
  }
}
