import { http } from '@/core/api/http'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { getSalesInvoice, submitSalesInvoice } from '@/features/sales-invoices/api/sales-invoices.api'
import type { SalesInvoice, SalesInvoiceItem } from '@/features/sales-invoices/types/sales-invoice.types'
import { today } from '@/features/pos/utils/pos-date'
import type { PosReturnPayload, PosReturnResult, PosReturnSource, PosReturnSourceLine } from '../types/pos-return.types'

interface FrappeMethodResponse<T> {
  message: T
}

const RETURN_INVOICE_FIELDS = ['name', 'customer', 'docstatus', 'is_return', 'return_against', 'grand_total', 'posting_date']

function cleanString(value?: string | null) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function safeMoney(value?: number | null) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function positiveQuantity(value?: number | null) {
  const quantity = Math.abs(safeMoney(value))
  return quantity > 0 ? quantity : 0
}

function lineKey(item: SalesInvoiceItem, index: number) {
  return item.name || `${item.item_code}-${index}`
}

async function listReturnInvoices(invoiceName: string) {
  const response = await http.get<FrappeListResponse<Pick<SalesInvoice, 'name'>>>('/resource/Sales Invoice', {
    params: {
      fields: JSON.stringify(RETURN_INVOICE_FIELDS),
      filters: JSON.stringify([
        ['Sales Invoice', 'return_against', '=', invoiceName],
        ['Sales Invoice', 'is_return', '=', 1],
        ['Sales Invoice', 'docstatus', '=', 1],
      ]),
      limit_page_length: 100,
      order_by: 'posting_date desc',
    },
  })

  return Promise.all(response.data.data.map((row) => getSalesInvoice(row.name)))
}

function buildReturnedQuantityMap(returnInvoices: SalesInvoice[]) {
  const returnedByItem = new Map<string, number>()

  for (const invoice of returnInvoices) {
    for (const item of invoice.items ?? []) {
      returnedByItem.set(item.item_code, (returnedByItem.get(item.item_code) ?? 0) + positiveQuantity(item.qty))
    }
  }

  return returnedByItem
}

function buildSourceLines(invoice: SalesInvoice, returnInvoices: SalesInvoice[]): PosReturnSourceLine[] {
  const remainingReturnedByItem = buildReturnedQuantityMap(returnInvoices)

  return (invoice.items ?? [])
    .map((item, index) => {
      const soldQuantity = positiveQuantity(item.qty)
      const returnedForItem = remainingReturnedByItem.get(item.item_code) ?? 0
      const alreadyReturnedForLine = Math.min(soldQuantity, returnedForItem)
      remainingReturnedByItem.set(item.item_code, Math.max(0, returnedForItem - alreadyReturnedForLine))

      return {
        key: lineKey(item, index),
        source_row_name: item.name,
        item_code: item.item_code,
        item_name: item.item_name || item.item_code,
        description: cleanString(item.description),
        sold_qty: soldQuantity,
        already_returned_qty: alreadyReturnedForLine,
        returnable_qty: Math.max(0, soldQuantity - alreadyReturnedForLine),
        uom: item.uom || item.stock_uom || 'Nos',
        stock_uom: cleanString(item.stock_uom) ?? item.uom,
        conversion_factor: item.conversion_factor ?? 1,
        rate: safeMoney(item.rate),
        warehouse: cleanString(item.warehouse),
      }
    })
    .filter((line) => line.sold_qty > 0)
}

function validateOriginalInvoice(invoice: SalesInvoice) {
  if (invoice.docstatus !== 1) {
    throw new Error('لا يمكن عمل مرتجع إلا لفاتورة بيع معتمدة.')
  }

  if (invoice.is_return === 1) {
    throw new Error('هذه الفاتورة هي مرتجع بالفعل، اختر الفاتورة الأصلية.')
  }

  if (!invoice.items?.length) {
    throw new Error('الفاتورة لا تحتوي على أصناف قابلة للإرجاع.')
  }
}

export async function getPosReturnSource(invoiceName: string): Promise<PosReturnSource> {
  const cleanInvoiceName = cleanString(invoiceName)

  if (!cleanInvoiceName) {
    throw new Error('أدخل رقم فاتورة البيع أولًا.')
  }

  const invoice = await getSalesInvoice(cleanInvoiceName)
  validateOriginalInvoice(invoice)
  const returnInvoices = await listReturnInvoices(invoice.name)

  return {
    invoice,
    returnInvoices,
    lines: buildSourceLines(invoice, returnInvoices),
  }
}

function buildReturnItems(source: PosReturnSource, payload: PosReturnPayload) {
  const selectedLineMap = new Map(payload.lines.map((line) => [line.key, line.return_qty]))
  const shouldUpdateStock = source.invoice.update_stock === 1

  return source.lines
    .map((line) => {
      const returnQty = safeMoney(selectedLineMap.get(line.key))

      if (returnQty <= 0) {
        return null
      }

      if (returnQty > line.returnable_qty) {
        throw new Error(`كمية المرتجع للصنف ${line.item_name} أكبر من الكمية المتاحة للإرجاع.`)
      }

      return {
        doctype: 'Sales Invoice Item',
        item_code: line.item_code,
        item_name: line.item_name,
        description: cleanString(line.description),
        qty: -returnQty,
        uom: line.uom,
        stock_uom: cleanString(line.stock_uom) ?? line.uom,
        conversion_factor: line.conversion_factor ?? 1,
        rate: line.rate,
        warehouse: shouldUpdateStock ? cleanString(line.warehouse) ?? cleanString(source.invoice.set_warehouse) : undefined,
      }
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line))
}

function buildReturnRemarks(payload: PosReturnPayload) {
  return [
    cleanString(payload.remarks),
    'نوع العملية: مرتجع نقطة بيع',
    payload.refundMode === 'cash_refund' ? 'طريقة المعالجة: استرداد نقدي من الصندوق' : 'طريقة المعالجة: إشعار دائن على العميل',
    payload.shiftName ? `وردية الكاشير: ${payload.shiftName}` : undefined,
  ]
    .filter(Boolean)
    .join('\n')
}

function buildReturnInvoicePayload(source: PosReturnSource, payload: PosReturnPayload) {
  const returnItems = buildReturnItems(source, payload)
  const original = source.invoice
  const shouldUpdateStock = original.update_stock === 1

  if (returnItems.length === 0) {
    throw new Error('اختر صنفًا واحدًا على الأقل وكمية مرتجع أكبر من صفر.')
  }

  return {
    customer: original.customer,
    company: original.company,
    posting_date: today(),
    due_date: today(),
    currency: original.currency,
    conversion_rate: original.conversion_rate ?? 1,
    selling_price_list: original.selling_price_list,
    set_warehouse: shouldUpdateStock ? cleanString(original.set_warehouse) : undefined,
    debit_to: cleanString(original.debit_to),
    update_stock: shouldUpdateStock ? 1 : 0,
    is_return: 1,
    return_against: original.name,
    remarks: buildReturnRemarks(payload),
    items: returnItems,
  }
}

function refundAmount(invoice: SalesInvoice) {
  const outstanding = Math.abs(safeMoney(invoice.outstanding_amount))
  const grandTotal = Math.abs(safeMoney(invoice.grand_total))

  return outstanding > 0 ? outstanding : grandTotal
}

function refundErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'تعذر إنشاء سند صرف الاسترداد النقدي.'
}

async function createAndSubmitCustomerRefund(payload: PosReturnPayload, originalInvoice: SalesInvoice, returnInvoice: SalesInvoice) {
  const paidFrom = cleanString(payload.refundAccount)
  const paidTo = cleanString(returnInvoice.debit_to) ?? cleanString(originalInvoice.debit_to)
  const amount = refundAmount(returnInvoice)

  if (!paidFrom) {
    throw new Error('اختر حساب الصندوق أو البنك الذي سيتم الصرف منه.')
  }

  if (!paidTo) {
    throw new Error('لا يوجد حساب ذمم للعميل على الفاتورة حتى يتم ربط سند الصرف بالمرتجع.')
  }

  if (amount <= 0) {
    throw new Error('قيمة المرتجع لا تحتوي على مبلغ قابل للاسترداد.')
  }

  const response = await http.post<FrappeDocResponse<{ name: string }>>('/resource/Payment Entry', {
    payment_type: 'Pay',
    party_type: 'Customer',
    company: returnInvoice.company,
    posting_date: today(),
    party: returnInvoice.customer,
    paid_from: paidFrom,
    paid_to: paidTo,
    paid_amount: amount,
    received_amount: amount,
    source_exchange_rate: returnInvoice.conversion_rate ?? originalInvoice.conversion_rate ?? 1,
    target_exchange_rate: 1,
    mode_of_payment: cleanString(payload.refundPaymentMode),
    reference_no: returnInvoice.name,
    reference_date: today(),
    remarks: cleanString(
      [
        'استرداد نقدي لمرتجع نقطة بيع',
        `فاتورة المرتجع: ${returnInvoice.name}`,
        `الفاتورة الأصلية: ${originalInvoice.name}`,
        payload.shiftName ? `وردية الكاشير: ${payload.shiftName}` : undefined,
        cleanString(payload.remarks),
      ]
        .filter(Boolean)
        .join('\n'),
    ),
    references: [
      {
        doctype: 'Payment Entry Reference',
        reference_doctype: 'Sales Invoice',
        reference_name: returnInvoice.name,
        allocated_amount: amount,
      },
    ],
  })

  const submitted = await http.post<FrappeMethodResponse<{ name: string }>>('/method/frappe.client.submit', {
    doc: JSON.stringify(response.data.data),
  })

  return submitted.data.message
}

export async function createPosReturn(payload: PosReturnPayload): Promise<PosReturnResult> {
  const source = await getPosReturnSource(payload.invoiceName)
  const response = await http.post<FrappeDocResponse<SalesInvoice>>('/resource/Sales Invoice', buildReturnInvoicePayload(source, payload))
  const submittedReturnInvoice = await submitSalesInvoice(response.data.data)
  let refundPayment: PosReturnResult['refundPayment']
  let refundError: string | undefined

  if (payload.refundMode === 'cash_refund') {
    try {
      refundPayment = await createAndSubmitCustomerRefund(payload, source.invoice, submittedReturnInvoice)
    } catch (error) {
      refundError = refundErrorMessage(error)
    }
  }

  return {
    returnInvoice: response.data.data,
    submittedReturnInvoice,
    refundPayment,
    refundError,
  }
}
