import type { SalesInvoice } from '@/features/sales-invoices/types/sales-invoice.types'

export interface PosReturnSourceLine {
  key: string
  source_row_name?: string
  item_code: string
  item_name: string
  description?: string
  sold_qty: number
  already_returned_qty: number
  returnable_qty: number
  uom: string
  stock_uom?: string
  conversion_factor?: number
  rate: number
  warehouse?: string
}

export interface PosReturnSource {
  invoice: SalesInvoice
  returnInvoices: SalesInvoice[]
  lines: PosReturnSourceLine[]
}

export interface PosReturnSelectedLine {
  key: string
  return_qty: number
}

export type PosReturnRefundMode = 'credit_note' | 'cash_refund'

export interface PosReturnPayload {
  invoiceName: string
  lines: PosReturnSelectedLine[]
  remarks?: string
  shiftName?: string
  refundMode?: PosReturnRefundMode
  refundAccount?: string
  refundPaymentMode?: string
}

export interface PosReturnResult {
  returnInvoice: SalesInvoice
  submittedReturnInvoice: SalesInvoice
  refundPayment?: {
    name: string
  }
  refundError?: string
}
