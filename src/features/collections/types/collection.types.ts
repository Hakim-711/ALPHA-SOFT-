export interface CollectionReference {
  name?: string
  reference_doctype: 'Sales Invoice'
  reference_name: string
  due_date?: string
  total_amount?: number
  outstanding_amount?: number
  allocated_amount: number
  exchange_rate?: number
  account?: string
}

export interface Collection {
  name: string
  posting_date: string
  company: string
  payment_type: 'Receive'
  party_type: 'Customer'
  party: string
  party_name?: string
  paid_from?: string
  paid_to: string
  paid_from_account_type?: string
  paid_to_account_type?: string
  paid_from_account_currency?: string
  paid_to_account_currency?: string
  paid_amount: number
  received_amount: number
  source_exchange_rate?: number
  target_exchange_rate?: number
  total_allocated_amount?: number
  unallocated_amount?: number
  difference_amount?: number
  mode_of_payment?: string
  reference_no?: string
  reference_date?: string
  remarks?: string
  status?: string
  docstatus?: 0 | 1 | 2
  owner?: string
  creation?: string
  modified?: string
  references: CollectionReference[]
}

export interface CollectionFormReference {
  reference_name: string
  due_date?: string
  total_amount?: number
  outstanding_amount?: number
  allocated_amount: number
  invoice_currency?: string
  debit_to?: string
}

export interface CollectionFormValues {
  company: string
  posting_date: string
  customer: string
  paid_from: string
  paid_to: string
  paid_amount: number
  received_amount: number
  source_exchange_rate: number
  target_exchange_rate: number
  mode_of_payment?: string
  reference_no?: string
  reference_date?: string
  remarks?: string
  references: CollectionFormReference[]
}

export interface CollectionListResult {
  rows: Collection[]
  hasNextPage: boolean
}

export interface CollectionAccountOption {
  name: string
  company: string
  account_type: 'Bank' | 'Cash' | 'Receivable'
  account_currency?: string
}

export interface CollectionCompanyOption {
  name: string
  default_currency?: string
  default_receivable_account?: string
  default_cash_account?: string
  default_bank_account?: string
}

export interface CollectionDefaults {
  companies: CollectionCompanyOption[]
  paymentAccounts: CollectionAccountOption[]
  receivableAccounts: CollectionAccountOption[]
  modesOfPayment: string[]
}

export interface CollectionOutstandingInvoice {
  name: string
  customer: string
  company: string
  posting_date?: string
  due_date?: string
  currency?: string
  grand_total?: number
  outstanding_amount?: number
  conversion_rate?: number
  debit_to?: string
  status?: string
}
