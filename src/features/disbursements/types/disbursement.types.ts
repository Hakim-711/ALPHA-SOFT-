export interface DisbursementReference {
  name?: string
  reference_doctype: 'Purchase Invoice'
  reference_name: string
  due_date?: string
  total_amount?: number
  outstanding_amount?: number
  allocated_amount: number
  exchange_rate?: number
  account?: string
}

export interface Disbursement {
  name: string
  posting_date: string
  company: string
  payment_type: 'Pay'
  party_type: 'Supplier'
  party: string
  party_name?: string
  paid_from: string
  paid_to?: string
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
  references: DisbursementReference[]
}

export interface DisbursementFormReference {
  reference_name: string
  due_date?: string
  total_amount?: number
  outstanding_amount?: number
  allocated_amount: number
  invoice_currency?: string
  credit_to?: string
}

export interface DisbursementFormValues {
  company: string
  posting_date: string
  supplier: string
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
  references: DisbursementFormReference[]
}

export interface DisbursementListResult {
  rows: Disbursement[]
  hasNextPage: boolean
}

export interface DisbursementAccountOption {
  name: string
  company: string
  account_type: 'Bank' | 'Cash' | 'Payable'
  account_currency?: string
}

export interface DisbursementCompanyOption {
  name: string
  default_currency?: string
  default_cash_account?: string
  default_bank_account?: string
  default_payable_account?: string
}

export interface DisbursementDefaults {
  companies: DisbursementCompanyOption[]
  paymentAccounts: DisbursementAccountOption[]
  payableAccounts: DisbursementAccountOption[]
  modesOfPayment: string[]
}

export interface DisbursementOutstandingInvoice {
  name: string
  supplier: string
  company: string
  posting_date?: string
  due_date?: string
  currency?: string
  grand_total?: number
  outstanding_amount?: number
  conversion_rate?: number
  credit_to?: string
  status?: string
}
