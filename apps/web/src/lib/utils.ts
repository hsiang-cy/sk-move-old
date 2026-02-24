import type { TimeWindow } from '@/types'

export function formatTimeWindow(tw: TimeWindow): string {
  return `${tw.start}–${tw.end}`
}

export function formatLimit(value: number | null, unit: string): string {
  if (value === null) return '無限制'
  return `${value} ${unit}`
}

export function formatTimestamp(timestamp: number | null, options?: Intl.DateTimeFormatOptions): string {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('zh-TW', options ?? {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
