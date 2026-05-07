export type CustomerType = 'Individual' | 'Company'

export interface Customer {
  name: string
  customer_name: string
  customer_type: CustomerType | string
  customer_group?: string
  territory?: string
  mobile_no?: string
  email_id?: string
  tax_id?: string
  customer_primary_address?: string
  primary_address?: string
  address?: string
  customer_details?: string
  disabled?: 0 | 1
  creation?: string
  modified?: string
  owner?: string
}

export interface CustomerFormValues {
  customer_name: string
  customer_type: CustomerType
  customer_group?: string
  territory?: string
  mobile_no?: string
  email_id?: string
  tax_id?: string
  address?: string
  customer_details?: string
  disabled?: boolean
}

export interface CustomerListResult {
  rows: Customer[]
  hasNextPage: boolean
}

export interface RelatedCustomerDocument {
  name: string
  status?: string
  posting_date?: string
  transaction_date?: string
  grand_total?: number
  outstanding_amount?: number
  paid_amount?: number
}

export interface CustomerRelatedDocuments {
  salesInvoices: RelatedCustomerDocument[]
  salesOrders: RelatedCustomerDocument[]
  payments: RelatedCustomerDocument[]
}
