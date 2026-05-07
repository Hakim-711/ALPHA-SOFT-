export type SupplierType = 'Individual' | 'Company'

export interface Supplier {
  name: string
  supplier_name: string
  supplier_type: SupplierType | string
  supplier_group?: string
  country?: string
  default_currency?: string
  payment_terms?: string
  website?: string
  mobile_no?: string
  email_id?: string
  tax_id?: string
  supplier_primary_address?: string
  primary_address?: string
  address?: string
  supplier_details?: string
  disabled?: 0 | 1
  creation?: string
  modified?: string
  owner?: string
}

export interface SupplierFormValues {
  supplier_name: string
  supplier_type: SupplierType
  supplier_group?: string
  country?: string
  default_currency?: string
  payment_terms?: string
  website?: string
  mobile_no?: string
  email_id?: string
  tax_id?: string
  address?: string
  supplier_details?: string
  disabled?: boolean
}

export interface SupplierListResult {
  rows: Supplier[]
  hasNextPage: boolean
}

export interface RelatedSupplierDocument {
  name: string
  status?: string
  posting_date?: string
  transaction_date?: string
  grand_total?: number
  outstanding_amount?: number
  paid_amount?: number
}

export interface SupplierRelatedDocuments {
  purchaseOrders: RelatedSupplierDocument[]
  purchaseInvoices: RelatedSupplierDocument[]
  payments: RelatedSupplierDocument[]
}
