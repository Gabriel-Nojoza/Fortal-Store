import {
  StorageConfigurationError,
  isVercelRuntime,
} from "@/lib/blob-json-store"

const SUPABASE_SERVICE_ROLE_ENV_NAME = "SUPABASE_SERVICE_ROLE_KEY"
const SUPABASE_URL_ENV_NAMES = [
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
] as const

type QueryFilterOp = "eq" | "is"

export interface QueryFilter {
  column: string
  op?: QueryFilterOp
  value: string | number | boolean | null
}

interface OrderByOption {
  column: string
  ascending?: boolean
}

interface SelectRowsOptions {
  columns?: string[] | string
  filters?: QueryFilter[]
  orderBy?: OrderByOption
  limit?: number
}

function getSupabaseUrl() {
  for (const envName of SUPABASE_URL_ENV_NAMES) {
    const value = process.env[envName]?.trim()

    if (value) {
      return value.replace(/\/$/, "")
    }
  }

  return ""
}

function getSupabaseServiceRoleKey() {
  return process.env[SUPABASE_SERVICE_ROLE_ENV_NAME]?.trim() || ""
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseServiceRoleKey())
}

export function ensureSupabaseAvailable(mode: "read" | "write" = "read") {
  if (isSupabaseConfigured()) {
    return
  }

  if (isVercelRuntime()) {
    throw new StorageConfigurationError(
      `Configure ${SUPABASE_URL_ENV_NAMES[1]} e ${SUPABASE_SERVICE_ROLE_ENV_NAME} para ${mode === "write" ? "salvar" : "carregar"} dados em producao.`
    )
  }
}

export function shouldUseSupabaseStorage() {
  return isSupabaseConfigured() || isVercelRuntime()
}

function buildColumns(columns?: string[] | string) {
  if (!columns) {
    return "*"
  }

  return Array.isArray(columns) ? columns.join(",") : columns
}

function buildFilterValue(filter: QueryFilter) {
  if (filter.op === "is") {
    return `is.${filter.value === null ? "null" : String(filter.value)}`
  }

  return `eq.${String(filter.value)}`
}

function createHeaders(prefer?: string) {
  const serviceRoleKey = getSupabaseServiceRoleKey()
  const headers: HeadersInit = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  }

  if (prefer) {
    headers.Prefer = prefer
  }

  return headers
}

async function parseSupabaseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as T
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : null) as T
}

async function handleSupabaseError(response: Response): Promise<never> {
  const text = await response.text()
  let message = "Erro ao comunicar com o Supabase."

  try {
    const payload = JSON.parse(text) as { message?: string; error?: string }
    message = payload.message || payload.error || message
  } catch {
    if (text) {
      message = text
    }
  }

  if (response.status === 401 || response.status === 403) {
    throw new StorageConfigurationError(
      `Verifique ${SUPABASE_SERVICE_ROLE_ENV_NAME} e as permissoes das tabelas no Supabase.`
    )
  }

  if (response.status === 404) {
    throw new StorageConfigurationError(
      "Verifique a URL do projeto Supabase e se o projeto esta ativo."
    )
  }

  throw new Error(message)
}

async function requestSupabase<T>(input: {
  table: string
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  filters?: QueryFilter[]
  columns?: string[] | string
  orderBy?: OrderByOption
  limit?: number
  prefer?: string
  onConflict?: string
}) {
  ensureSupabaseAvailable()

  if (!isSupabaseConfigured()) {
    throw new StorageConfigurationError(
      `Configure ${SUPABASE_URL_ENV_NAMES[1]} e ${SUPABASE_SERVICE_ROLE_ENV_NAME} para usar o Supabase.`
    )
  }

  const url = new URL(`/rest/v1/${input.table}`, getSupabaseUrl())

  if (input.method === "GET" || input.columns) {
    url.searchParams.set("select", buildColumns(input.columns))
  }

  if (input.orderBy) {
    url.searchParams.set(
      "order",
      `${input.orderBy.column}.${input.orderBy.ascending ? "asc" : "desc"}`
    )
  }

  if (typeof input.limit === "number") {
    url.searchParams.set("limit", String(input.limit))
  }

  if (input.onConflict) {
    url.searchParams.set("on_conflict", input.onConflict)
  }

  for (const filter of input.filters || []) {
    url.searchParams.set(filter.column, buildFilterValue(filter))
  }

  const response = await fetch(url.toString(), {
    method: input.method || "GET",
    headers: createHeaders(input.prefer),
    body: input.body === undefined ? undefined : JSON.stringify(input.body),
    cache: "no-store",
  })

  if (!response.ok) {
    return handleSupabaseError(response)
  }

  return parseSupabaseResponse<T>(response)
}

export async function selectRows<T>(table: string, options: SelectRowsOptions = {}) {
  return (
    (await requestSupabase<T[]>({
      table,
      method: "GET",
      columns: options.columns,
      filters: options.filters,
      orderBy: options.orderBy,
      limit: options.limit,
    })) || []
  )
}

export async function insertRow<T>(table: string, row: object) {
  const rows =
    (await requestSupabase<T[]>({
      table,
      method: "POST",
      body: row,
      columns: "*",
      prefer: "return=representation",
    })) || []

  return rows[0] ?? null
}

export async function updateRows<T>(
  table: string,
  values: object,
  filters: QueryFilter[]
) {
  return (
    (await requestSupabase<T[]>({
      table,
      method: "PATCH",
      body: values,
      columns: "*",
      filters,
      prefer: "return=representation",
    })) || []
  )
}

export async function upsertRow<T>(
  table: string,
  row: object,
  onConflict: string
) {
  const rows =
    (await requestSupabase<T[]>({
      table,
      method: "POST",
      body: row,
      columns: "*",
      prefer: "resolution=merge-duplicates,return=representation",
      onConflict,
    })) || []

  return rows[0] ?? null
}

export async function deleteRows<T>(table: string, filters: QueryFilter[]) {
  return (
    (await requestSupabase<T[]>({
      table,
      method: "DELETE",
      columns: "*",
      filters,
      prefer: "return=representation",
    })) || []
  )
}
