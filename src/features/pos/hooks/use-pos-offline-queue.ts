import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { completePosSale } from '../api/pos.api'
import {
  markQueuedPosSaleFailed,
  readQueuedPosSales,
  removeQueuedPosSale,
  type QueuedPosSale,
} from '../offline/pos-offline-queue'

export function usePosOfflineQueue() {
  const queryClient = useQueryClient()
  const [queuedSales, setQueuedSales] = useState<QueuedPosSale[]>(() => readQueuedPosSales())
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncMessage, setLastSyncMessage] = useState<string | null>(null)

  function refreshQueue() {
    setQueuedSales(readQueuedPosSales())
  }

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true)
    }

    function handleOffline() {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function syncQueue() {
    const queue = readQueuedPosSales()

    if (queue.length === 0 || isSyncing) {
      return
    }

    setIsSyncing(true)
    setLastSyncMessage(null)

    let synced = 0

    for (const sale of queue) {
      try {
        await completePosSale(sale.payload)
        removeQueuedPosSale(sale.id)
        synced += 1
      } catch (error) {
        markQueuedPosSaleFailed(sale.id, error instanceof Error ? error.message : 'تعذر مزامنة الفاتورة.')
        break
      }
    }

    refreshQueue()
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['pos'] }),
      queryClient.invalidateQueries({ queryKey: ['sales-invoices'] }),
      queryClient.invalidateQueries({ queryKey: ['collections'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      queryClient.invalidateQueries({ queryKey: ['daily-cash'] }),
    ])

    setLastSyncMessage(synced > 0 ? `تمت مزامنة ${synced} فاتورة معلقة.` : 'لم تتم مزامنة أي فاتورة. راجع الاتصال أو الخطأ الأخير.')
    setIsSyncing(false)
  }

  return {
    queuedSales,
    queuedCount: queuedSales.length,
    isOnline,
    isSyncing,
    lastSyncMessage,
    refreshQueue,
    syncQueue,
  }
}
