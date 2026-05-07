import { http } from '@/core/api/http'
import type { FrappeListResponse } from '@/core/api/types'
import type {
  StatementCompanyOption,
  StatementCurrencySummary,
  StatementFilters,
  StatementGlEntry,
  StatementOutstandingDocument,
  StatementPartyType,
  StatementResult,
  StatementRow,
} from '../types/statement.types'

const GL_ENTRY_FIELDS = [
  'name',
  'posting_date',
  'account',
  'account_currency',
  'company',
  'party_type',
  'party',
  'debit',
  'credit',
  'debit_in_account_currency',
  'credit_in_account_currency',
  'voucher_type',
  'voucher_no',
  'against',
  'remarks',
  'creation',
  'is_cancelled',
]

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function amountValue(accountCurrencyValue?: number, baseValue?: number) {
  const accountAmount = Number(accountCurrencyValue ?? 0)

  if (Number.isFinite(accountAmount) && accountAmount !== 0) {
    return accountAmount
  }

  const baseAmount = Number(baseValue ?? 0)
  return Number.isFinite(baseAmount) ? baseAmount : 0
}

function naturalMovement(partyType: StatementPartyType, debit: number, credit: number) {
  return partyType === 'Customer' ? debit - credit : credit - debit
}

function sortEntries(first: StatementGlEntry, second: StatementGlEntry) {
  const dateCompare = String(first.posting_date ?? '').localeCompare(String(second.posting_date ?? ''))

  if (dateCompare !== 0) {
    return dateCompare
  }

  const creationCompare = String(first.creation ?? '').localeCompare(String(second.creation ?? ''))

  if (creationCompare !== 0) {
    return creationCompare
  }

  return first.name.localeCompare(second.name)
}

function buildGlFilters(filters: StatementFilters, mode: 'opening' | 'range') {
  const built: unknown[] = [
    ['GL Entry', 'party_type', '=', filters.partyType],
    ['GL Entry', 'party', '=', filters.party.trim()],
    ['GL Entry', 'is_cancelled', '=', 0],
  ]

  if (filters.company?.trim() && filters.company !== 'all') {
    built.push(['GL Entry', 'company', '=', filters.company.trim()])
  }

  if (mode === 'opening') {
    built.push(['GL Entry', 'posting_date', '<', filters.fromDate])
  } else {
    built.push(['GL Entry', 'posting_date', '>=', filters.fromDate])
    built.push(['GL Entry', 'posting_date', '<=', filters.toDate])
  }

  return built
}

function buildOutstandingFilters(filters: StatementFilters) {
  const doctype = filters.partyType === 'Customer' ? 'Sales Invoice' : 'Purchase Invoice'
  const partyField = filters.partyType === 'Customer' ? 'customer' : 'supplier'
  const built: unknown[] = [
    [doctype, 'docstatus', '=', 1],
    [doctype, partyField, '=', filters.party.trim()],
    [doctype, 'outstanding_amount', '>', 0],
  ]

  if (filters.company?.trim() && filters.company !== 'all') {
    built.push([doctype, 'company', '=', filters.company.trim()])
  }

  return built
}

async function listGlEntries(filters: StatementFilters, mode: 'opening' | 'range') {
  const response = await http.get<FrappeListResponse<StatementGlEntry>>('/resource/GL Entry', {
    params: {
      fields: JSON.stringify(GL_ENTRY_FIELDS),
      filters: JSON.stringify(buildGlFilters(filters, mode)),
      limit_page_length: mode === 'opening' ? 1000 : 500,
      order_by: 'posting_date asc',
    },
  })

  return response.data.data.filter((entry) => entry.is_cancelled !== 1).sort(sortEntries)
}

async function listOutstandingDocuments(filters: StatementFilters) {
  const doctype = filters.partyType === 'Customer' ? 'Sales Invoice' : 'Purchase Invoice'
  const response = await http.get<FrappeListResponse<StatementOutstandingDocument>>(`/resource/${doctype}`, {
    params: {
      fields: JSON.stringify(['name', 'posting_date', 'due_date', 'currency', 'grand_total', 'outstanding_amount', 'status']),
      filters: JSON.stringify(buildOutstandingFilters(filters)),
      limit_page_length: 50,
      order_by: 'due_date asc',
    },
  })

  return response.data.data
}

function buildOpeningBalances(partyType: StatementPartyType, entries: StatementGlEntry[]) {
  const balances = new Map<string, number>()

  for (const entry of entries) {
    const currency = entry.account_currency || 'غير محدد'
    const debit = amountValue(entry.debit_in_account_currency, entry.debit)
    const credit = amountValue(entry.credit_in_account_currency, entry.credit)
    balances.set(currency, (balances.get(currency) ?? 0) + naturalMovement(partyType, debit, credit))
  }

  return balances
}

function buildRowsAndSummaries(
  partyType: StatementPartyType,
  openingBalances: Map<string, number>,
  entries: StatementGlEntry[],
) {
  const runningBalances = new Map(openingBalances)
  const summaries = new Map<string, StatementCurrencySummary>()
  const rows: StatementRow[] = []

  for (const entry of entries) {
    const currency = entry.account_currency || 'غير محدد'
    const debit = amountValue(entry.debit_in_account_currency, entry.debit)
    const credit = amountValue(entry.credit_in_account_currency, entry.credit)
    const nextBalance = (runningBalances.get(currency) ?? 0) + naturalMovement(partyType, debit, credit)
    runningBalances.set(currency, nextBalance)

    const summary =
      summaries.get(currency) ??
      ({
        currency,
        openingBalance: openingBalances.get(currency) ?? 0,
        debit: 0,
        credit: 0,
        closingBalance: openingBalances.get(currency) ?? 0,
        entries: 0,
      } satisfies StatementCurrencySummary)

    summary.debit += debit
    summary.credit += credit
    summary.closingBalance = nextBalance
    summary.entries += 1
    summaries.set(currency, summary)

    rows.push({
      id: entry.name,
      postingDate: entry.posting_date ?? '',
      account: entry.account ?? '',
      currency,
      debit,
      credit,
      runningBalance: nextBalance,
      voucherType: entry.voucher_type ?? '',
      voucherNo: entry.voucher_no ?? '',
      against: entry.against,
      remarks: entry.remarks,
      creation: entry.creation,
    })
  }

  for (const [currency, openingBalance] of openingBalances.entries()) {
    if (summaries.has(currency)) {
      continue
    }

    summaries.set(currency, {
      currency,
      openingBalance,
      debit: 0,
      credit: 0,
      closingBalance: openingBalance,
      entries: 0,
    })
  }

  return {
    rows,
    summaries: [...summaries.values()].sort((first, second) => Math.abs(second.closingBalance) - Math.abs(first.closingBalance)),
  }
}

export async function getStatement(filters: StatementFilters): Promise<StatementResult> {
  const normalizedFilters = {
    ...filters,
    party: filters.party.trim(),
    company: cleanString(filters.company),
  }

  const [openingEntries, rangeEntries, outstandingDocuments] = await Promise.all([
    listGlEntries(normalizedFilters, 'opening'),
    listGlEntries(normalizedFilters, 'range'),
    listOutstandingDocuments(normalizedFilters).catch(() => []),
  ])
  const openingBalances = buildOpeningBalances(filters.partyType, openingEntries)
  const { rows, summaries } = buildRowsAndSummaries(filters.partyType, openingBalances, rangeEntries)

  return {
    partyType: filters.partyType,
    party: filters.party,
    company: normalizedFilters.company,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    rows,
    summaries,
    outstandingDocuments,
    lastSyncedAt: new Date().toISOString(),
  }
}

export async function getStatementCompanies() {
  const response = await http.get<FrappeListResponse<StatementCompanyOption>>('/resource/Company', {
    params: {
      fields: JSON.stringify(['name', 'default_currency']),
      limit_page_length: 50,
      order_by: 'name asc',
    },
  })

  return response.data.data
}
