import type { PosSalePayload } from '../types/pos.types'

const POS_OFFLINE_QUEUE_KEY = 'alpha-neqat.pos.offline-queue.v1'

export interface QueuedPosSale {
  id: string
  createdAt: string
  attempts: number
  payload: PosSalePayload
  lastError?: string
}

function createQueueId() {
  return `pos-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function readQueuedPosSales(): QueuedPosSale[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(POS_OFFLINE_QUEUE_KEY) || '[]') as QueuedPosSale[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeQueuedPosSales(queue: QueuedPosSale[]) {
  localStorage.setItem(POS_OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

export function enqueuePosSale(payload: PosSalePayload) {
  const queuedSale: QueuedPosSale = {
    id: createQueueId(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    payload,
  }

  writeQueuedPosSales([queuedSale, ...readQueuedPosSales()].slice(0, 50))
  return queuedSale
}

export function removeQueuedPosSale(id: string) {
  writeQueuedPosSales(readQueuedPosSales().filter((sale) => sale.id !== id))
}

export function markQueuedPosSaleFailed(id: string, error: string) {
  writeQueuedPosSales(
    readQueuedPosSales().map((sale) =>
      sale.id === id
        ? {
            ...sale,
            attempts: sale.attempts + 1,
            lastError: error,
          }
        : sale,
    ),
  )
}

export function isLikelyOfflineError(error: unknown) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true
  }

  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase()
  return message.includes('network') || message.includes('failed to fetch') || message.includes('timeout')
}
