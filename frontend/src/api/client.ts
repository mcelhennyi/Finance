import type {
  BbdDefaultScenarioResponse,
  BbdRunPayload,
  BbdRunResponse,
  FilterState,
  Filters,
  IngestionResult,
  MerchantDeleteResponse,
  MerchantNameListResponse,
  MerchantOverrideSaveResponse,
  Metrics,
  SourceOption,
  Transaction,
  UnifiedViewSummary,
} from '../types'

const BASE = '/api'

function buildParams(filter: Partial<FilterState>): URLSearchParams {
  const p = new URLSearchParams()
  if (filter.from)     p.set('from', filter.from)
  if (filter.to)       p.set('to', filter.to)
  if (filter.category) p.set('category', filter.category)
  if (filter.source)   p.set('source', filter.source)
  return p
}

async function get<T>(path: string, params?: URLSearchParams): Promise<T> {
  const url = params?.toString() ? `${BASE}${path}?${params}` : `${BASE}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

async function putJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail?: string }).detail ?? res.statusText)
  }
  return res.json() as Promise<T>
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = (err as { detail?: string | unknown }).detail
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? JSON.stringify(detail)
          : res.statusText
    throw new Error(msg)
  }
  return res.json() as Promise<T>
}

async function deleteQuery<T>(path: string, params: URLSearchParams): Promise<T> {
  const res = await fetch(`${BASE}${path}?${params}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error((err as { detail?: string }).detail ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  unifiedViewSummary: (monthIsoDate: string, asOf?: string) => {
    const p = new URLSearchParams()
    p.set('month', monthIsoDate)
    if (asOf) p.set('as_of', asOf)
    return get<UnifiedViewSummary>('/unified-view/summary', p)
  },

  metrics: (filter: Partial<FilterState>) =>
    get<Metrics>('/metrics', buildParams(filter)),

  transactions: (filter: Partial<FilterState>, limit = 1000) => {
    const p = buildParams(filter)
    p.set('limit', String(limit))
    return get<Transaction[]>('/transactions', p)
  },

  filters: () => get<Filters>('/filters'),

  sources: () => get<SourceOption[]>('/sources'),

  merchantNames: () => get<MerchantNameListResponse>('/merchant-names'),

  putMerchantDisplay: (merchant_key: string, display_name: string) =>
    putJson<MerchantOverrideSaveResponse>('/merchant-names', { merchant_key, display_name }),

  deleteMerchantDisplayOverride: (merchant_key: string) =>
    deleteQuery<MerchantDeleteResponse>('/merchant-names', new URLSearchParams({ merchant_key })),

  ingest: async (file: File, source: string): Promise<IngestionResult> => {
    const form = new FormData()
    form.append('file', file)
    form.append('source', source === 'auto' ? '' : source)
    const res = await fetch(`${BASE}/ingest`, { method: 'POST', body: form })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }))
      throw new Error(body.detail ?? res.statusText)
    }
    return res.json() as Promise<IngestionResult>
  },

  bbdProjectionRun: (payload: BbdRunPayload) =>
    postJson<BbdRunResponse>('/bbd-projection/run', payload),

  bbdDefaultScenario: () => get<BbdDefaultScenarioResponse>('/bbd-projection/default-scenario'),
}
