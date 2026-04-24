import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import type { IngestionResult } from '../types'
import clsx from 'clsx'

interface FeedbackState {
  type: 'success' | 'error' | 'loading'
  message: string
}

export function UploadZone() {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState('auto')
  const [feedback, setFeedback] = useState<FeedbackState | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: api.sources,
  })

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0])
      setFeedback(null)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv'] },
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setFeedback({ type: 'loading', message: `Uploading ${file.name}…` })
    try {
      const result: IngestionResult = await api.ingest(file, source)
      if (result.errors.length > 0) {
        setFeedback({
          type: 'error',
          message: `${result.records_inserted} inserted. Errors: ${result.errors.join('; ')}`,
        })
      } else {
        setFeedback({
          type: 'success',
          message: `✓ ${result.source_type}: ${result.records_inserted} inserted, ${result.records_skipped} skipped (${result.duration_seconds}s)`,
        })
        setFile(null)
        // Invalidate all dashboard queries so charts refresh
        qc.invalidateQueries()
      }
    } catch (err) {
      setFeedback({ type: 'error', message: String(err) })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg px-8 py-10 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-teal-500 bg-teal-50'
            : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50',
        )}
      >
        <input {...getInputProps()} />
        <div className="text-3xl mb-3">📂</div>
        <p className="font-semibold text-slate-700">
          {file ? file.name : 'Drop your statement here or click to browse'}
        </p>
        <p className="text-sm text-slate-400 mt-1">
          CSV exports from Chase, Amex, Wells Fargo, Frost Bank, PNC, and more
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="source-select" className="text-sm font-medium text-slate-600">
            Bank:
          </label>
          <select
            id="source-select"
            value={source}
            onChange={e => setSource(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="auto">Auto-detect</option>
            {sources
              .filter(s => s.key !== 'auto')
              .map(s => (
                <option key={s.key} value={s.key}>{s.name}</option>
              ))}
          </select>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="rounded-lg bg-teal-600 text-white px-5 py-1.5 text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading…' : 'Upload Statement'}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={clsx(
            'rounded-lg px-4 py-3 text-sm',
            feedback.type === 'success' && 'bg-green-50 text-green-800',
            feedback.type === 'error'   && 'bg-red-50 text-red-800',
            feedback.type === 'loading' && 'bg-blue-50 text-blue-800',
          )}
        >
          {feedback.message}
        </div>
      )}
    </div>
  )
}
