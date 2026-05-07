export interface StorePreferences {
  storeName: string
  branchName: string
  city: string
  defaultCurrency: string
  defaultCreditDueDays: number
  lowStockAlertQty: number
  receiptFooter: string
  printAfterSale: boolean
  posUpdatesStock: boolean
}

const STORE_PREFERENCES_KEY = 'alpha-neqat.store.preferences.v1'

export const defaultStorePreferences: StorePreferences = {
  storeName: 'alpha-neqat',
  branchName: 'فرع مأرب',
  city: 'مأرب',
  defaultCurrency: 'YER',
  defaultCreditDueDays: 7,
  lowStockAlertQty: 5,
  receiptFooter: 'شكرًا لتعاملكم معنا',
  printAfterSale: true,
  posUpdatesStock: true,
}

function normalizePreferences(value: Partial<StorePreferences>): StorePreferences {
  return {
    ...defaultStorePreferences,
    ...value,
    defaultCreditDueDays: Math.max(0, Number(value.defaultCreditDueDays ?? defaultStorePreferences.defaultCreditDueDays)),
    lowStockAlertQty: Math.max(0, Number(value.lowStockAlertQty ?? defaultStorePreferences.lowStockAlertQty)),
    printAfterSale: Boolean(value.printAfterSale ?? defaultStorePreferences.printAfterSale),
    posUpdatesStock: Boolean(value.posUpdatesStock ?? defaultStorePreferences.posUpdatesStock),
  }
}

export function getStorePreferences(): StorePreferences {
  try {
    const stored = localStorage.getItem(STORE_PREFERENCES_KEY)

    if (!stored) {
      return defaultStorePreferences
    }

    return normalizePreferences(JSON.parse(stored) as Partial<StorePreferences>)
  } catch {
    return defaultStorePreferences
  }
}

export function saveStorePreferences(preferences: StorePreferences) {
  localStorage.setItem(STORE_PREFERENCES_KEY, JSON.stringify(normalizePreferences(preferences)))
}
