export interface Transaction {
  id: number
  date: string
  description: string
  amount: number
  category: string
  merchant: string
  is_credit: boolean
  source_type: string
}

export interface Metrics {
  total_spent: number
  total_credits: number
  net_spent: number
  transaction_count: number
  avg_per_transaction: number
  by_category: Record<string, number>
  by_category_count: Record<string, number>
  top_merchants: [string, number][]
  daily_trend: [string, number][]
}

export interface Filters {
  categories: string[]
  sources: string[]
  date_min: string | null
  date_max: string | null
}

export interface SourceOption {
  key: string
  name: string
}

export interface FilterState {
  from: string
  to: string
  category: string
  source: string
}

export interface IngestionResult {
  source_file: string
  source_type: string
  records_parsed: number
  records_inserted: number
  records_skipped: number
  errors: string[]
  duration_seconds: number
}
