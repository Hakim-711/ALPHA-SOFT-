export interface DailyCashCompanyOption {
  name: string
  default_currency?: string
  default_cash_account?: string
  default_bank_account?: string
}

export interface DailyCashAccountOption {
  name: string
  company: string
  account_type: 'Bank' | 'Cash'
  account_currency?: string
}

export interface DailyCashDefaults {
  companies: DailyCashCompanyOption[]
  accounts: DailyCashAccountOption[]
  latestPostingDate?: string
}

export interface DailyCashFilters {
  date: string
  company: string
  account: string
}

export interface DailyCashMovement {
  id: string
  type: 'collection' | 'disbursement' | 'transfer-in' | 'transfer-out' | 'pos-sale'
  label: string
  reference: string
  postingDate: string
  party?: string
  account: string
  counterAccount?: string
  currency?: string
  amount: number
  netAmount: number
  note?: string
  path?: string
}

export interface DailyCashReport {
  filters: DailyCashFilters
  selectedAccount?: DailyCashAccountOption
  companyCurrency?: string
  openingBalance: number
  incomingTotal: number
  outgoingTotal: number
  netMovement: number
  expectedClosingBalance: number
  ledgerClosingBalance: number
  ledgerNetMovement: number
  reconciliationGap: number
  collectionsTotal: number
  disbursementsTotal: number
  posSalesTotal: number
  transferInTotal: number
  transferOutTotal: number
  collectionsCount: number
  disbursementsCount: number
  posSalesCount: number
  transfersCount: number
  movements: DailyCashMovement[]
  transfers: DailyCashMovement[]
  lastSyncedAt: string
}
