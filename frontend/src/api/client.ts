import type {
  FilterState,
  Filters,
  IngestionResult,
  Metrics,
  SourceOption,
  Transaction,
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

export const api = {
  metrics: (filter: Partial<FilterState>) =>
    get<Metrics>('/metrics', buildParams(filter)),

  transactions: (filter: Partial<FilterState>, limit = 1000) => {
    const p = buildParams(filter)
    p.set('limit', String(limit))
    return get<Transaction[]>('/transactions', p)
  },

  filters: () => get<Filters>('/filters'),

  sources: () => get<SourceOption[]>('/sources'),

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
}
