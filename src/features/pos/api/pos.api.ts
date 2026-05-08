import { http } from '@/core/api/http'
import type { FrappeDocResponse, FrappeListResponse } from '@/core/api/types'
import { submitSalesInvoice } from '@/features/sales-invoices/api/sales-invoices.api'
import type { SalesInvoice } from '@/features/sales-invoices/types/sales-invoice.types'
import {
  calculateCartTotals,
  calculatePaymentTotal,
  discountPercent,
  nonNegativeNumber,
  nonNegativeMoney,
  safeNumber,
} from '../calculators/pos-calculations'
import type {
  PosCartLine,
  PosAccountOption,
  PosCompletedSale,
  PosDefaults,
  PosItemSearchResult,
  PosProfile,
  PosSalePayload,
} from '../types/pos.types'
import { today } from '../utils/pos-date'

interface ItemPriceRow {
  item_code: string
  price_list?: string
  price_list_rate?: number
  currency?: string
  selling?: 0 | 1
}

interface BinRow {
  item_code: string
  warehouse?: string
  actual_qty?: number
}

interface ItemBarcodeRow {
  parent: string
  barcode: string
}

interface FrappeMethodResponse<T> {
  message: T
}

const POS_ITEM_FIELDS = [
  'name',
  'item_code',
  'item_name',
  'item_group',
  'stock_uom',
  'brand',
  'standard_rate',
  'disabled',
  'is_stock_item',
  'is_sales_item',
]

function cleanString(value?: string) {
  const cleaned = value?.trim()
  return cleaned ? cleaned : undefined
}

function safeQty(value: unknown) {
  return nonNegativeNumber(value)
}

function safeRate(value: unknown) {
  return nonNegativeMoney(value)
}

function safeDiscountPercent(value: unknown) {
  return discountPercent(value)
}

function makeCartLineId(itemCode: string) {
  return `${itemCode}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function listItemPrices(itemCodes: string[], priceList?: string) {
  if (itemCodes.length === 0 || !priceList) {
    return new Map<string, number>()
  }

  const response = await http.get<FrappeListResponse<ItemPriceRow>>('/resource/Item Price', {
    params: {
      fields: JSON.stringify(['item_code', 'price_list', 'price_list_rate', 'currency', 'selling']),
      filters: JSON.stringify([
        ['Item Price', 'item_code', 'in', itemCodes],
        ['Item Price', 'price_list', '=', priceList],
        ['Item Price', 'selling', '=', 1],
      ]),
      limit_page_length: itemCodes.length,
      order_by: 'modified desc',
    },
  })

  return new Map(response.data.data.map((row) => [row.item_code, Number(row.price_list_rate ?? 0)]))
}

async function listItemBins(itemCodes: string[], warehouse?: string) {
  if (itemCodes.length === 0 || !warehouse) {
    return new Map<string, number>()
  }

  const response = await http.get<FrappeListResponse<BinRow>>('/resource/Bin', {
    params: {
      fields: JSON.stringify(['item_code', 'warehouse', 'actual_qty']),
      filters: JSON.stringify([
        ['Bin', 'item_code', 'in', itemCodes],
        ['Bin', 'warehouse', '=', warehouse],
      ]),
      limit_page_length: itemCodes.length,
      order_by: 'modified desc',
    },
  })

  return new Map(response.data.data.map((row) => [row.item_code, Number(row.actual_qty ?? 0)]))
}

async function findBarcodeItemCode(term: string) {
  try {
    const response = await http.get<FrappeListResponse<ItemBarcodeRow>>('/resource/Item Barcode', {
      params: {
        fields: JSON.stringify(['parent', 'barcode']),
        filters: JSON.stringify([['Item Barcode', 'barcode', '=', term]]),
        limit_page_length: 1,
      },
    })

    return response.data.data[0]?.parent
  } catch {
    return undefined
  }
}

async function optionalList<T>(request: Promise<{ data: FrappeListResponse<T> }>) {
  try {
    const response = await request
    return response.data.data
  } catch {
    return []
  }
}

async function enrichItems<T extends PosItemSearchResult>(rows: T[], priceList?: string, warehouse?: string) {
  const itemCodes = rows.map((row) => row.item_code)
  const [prices, bins] = await Promise.all([listItemPrices(itemCodes, priceList), listItemBins(itemCodes, warehouse)])

  return rows.map((row) => ({
    ...row,
    price_list_rate: prices.get(row.item_code) || row.standard_rate || 0,
    actual_qty: row.is_stock_item !== 0 && warehouse ? (bins.get(row.item_code) ?? 0) : bins.get(row.item_code),
  }))
}

export function posItemToCartLine(item: PosItemSearchResult, warehouse?: string): PosCartLine {
  return {
    id: makeCartLineId(item.item_code),
    item_code: item.item_code,
    item_name: item.item_name || item.item_code,
    uom: item.stock_uom || 'Nos',
    qty: 1,
    rate: Number(item.price_list_rate ?? item.standard_rate ?? 0),
    discountPercent: 0,
    warehouse,
    stockQty: item.actual_qty,
    isStockItem: item.is_stock_item,
  }
}

export async function getPosDefaults(): Promise<PosDefaults> {
  const [
    profilesResponse,
    companiesResponse,
    priceListsResponse,
    warehousesResponse,
    paymentModesResponse,
    accountsResponse,
    itemGroups,
    brands,
  ] =
    await Promise.all([
      http.get<FrappeListResponse<PosProfile>>('/resource/POS Profile', {
        params: {
          fields: JSON.stringify(['name', 'company', 'customer', 'warehouse', 'currency', 'selling_price_list', 'disabled']),
          filters: JSON.stringify([['POS Profile', 'disabled', '=', 0]]),
          limit_page_length: 50,
          order_by: 'modified desc',
        },
      }),
      http.get<
        FrappeListResponse<{
          name: string
          default_currency?: string
          default_receivable_account?: string
          default_cash_account?: string
          default_bank_account?: string
        }>
      >('/resource/Company', {
        params: {
          fields: JSON.stringify([
            'name',
            'default_currency',
            'default_receivable_account',
            'default_cash_account',
            'default_bank_account',
          ]),
          limit_page_length: 50,
          order_by: 'modified desc',
        },
      }),
      http.get<FrappeListResponse<{ name: string; currency?: string; selling?: 0 | 1 }>>('/resource/Price List', {
        params: {
          fields: JSON.stringify(['name', 'currency', 'selling']),
          filters: JSON.stringify([['Price List', 'selling', '=', 1]]),
          limit_page_length: 50,
          order_by: 'modified desc',
        },
      }),
      http.get<FrappeListResponse<{ name: string; company?: string }>>('/resource/Warehouse', {
        params: {
          fields: JSON.stringify(['name', 'company']),
          filters: JSON.stringify([['Warehouse', 'is_group', '=', 0]]),
          limit_page_length: 100,
          order_by: 'name asc',
        },
      }),
      http.get<FrappeListResponse<{ name: string; type?: string; enabled?: 0 | 1 }>>('/resource/Mode of Payment', {
        params: {
          fields: JSON.stringify(['name', 'type', 'enabled']),
          filters: JSON.stringify([['Mode of Payment', 'enabled', '=', 1]]),
          limit_page_length: 50,
          order_by: 'name asc',
        },
      }),
      http.get<FrappeListResponse<PosAccountOption>>('/resource/Account', {
        params: {
          fields: JSON.stringify(['name', 'company', 'account_type', 'account_currency', 'disabled', 'is_group']),
          filters: JSON.stringify([
            ['Account', 'account_type', 'in', ['Cash', 'Bank', 'Receivable']],
            ['Account', 'is_group', '=', 0],
            ['Account', 'disabled', '=', 0],
          ]),
          limit_page_length: 100,
          order_by: 'name asc',
        },
      }),
      optionalList(
        http.get<FrappeListResponse<{ name: string }>>('/resource/Item Group', {
          params: {
            fields: JSON.stringify(['name']),
            filters: JSON.stringify([['Item Group', 'is_group', '=', 0]]),
            limit_page_length: 100,
            order_by: 'name asc',
          },
        }),
      ),
      optionalList(
        http.get<FrappeListResponse<{ name: string }>>('/resource/Brand', {
          params: {
            fields: JSON.stringify(['name']),
            limit_page_length: 100,
            order_by: 'name asc',
          },
        }),
      ),
    ])

  return {
    profiles: profilesResponse.data.data,
    companies: companiesResponse.data.data,
    priceLists: priceListsResponse.data.data,
    warehouses: warehousesResponse.data.data,
    paymentModes: paymentModesResponse.data.data,
    paymentAccounts: accountsResponse.data.data.filter((account) => account.account_type === 'Cash' || account.account_type === 'Bank'),
    receivableAccounts: accountsResponse.data.data.filter((account) => account.account_type === 'Receivable'),
    itemGroups,
    brands,
  }
}

export async function getPosProfile(name: string) {
  const response = await http.get<FrappeDocResponse<PosProfile>>(`/resource/POS Profile/${encodeURIComponent(name)}`)
  return response.data.data
}

export async function searchPosItems(
  term: string,
  priceList?: string,
  warehouse?: string,
  options: { itemGroup?: string; brand?: string } = {},
) {
  const trimmed = term.trim()

  const barcodeItemCode = trimmed ? await findBarcodeItemCode(trimmed) : undefined
  const docFilters: unknown[] = [
    ['Item', 'disabled', '=', 0],
    ['Item', 'is_sales_item', '=', 1],
  ]
  const orFilters = trimmed
    ? barcodeItemCode
      ? [
          ['Item', 'item_code', '=', barcodeItemCode],
          ['Item', 'name', '=', barcodeItemCode],
        ]
      : [
          ['Item', 'item_code', 'like', `%${trimmed}%`],
          ['Item', 'item_name', 'like', `%${trimmed}%`],
          ['Item', 'name', 'like', `%${trimmed}%`],
        ]
    : undefined

  if (options.itemGroup) {
    docFilters.push(['Item', 'item_group', '=', options.itemGroup])
  }

  if (options.brand) {
    docFilters.push(['Item', 'brand', '=', options.brand])
  }

  const response = await http.get<FrappeListResponse<PosItemSearchResult>>('/resource/Item', {
    params: {
      fields: JSON.stringify(POS_ITEM_FIELDS),
      filters: JSON.stringify(docFilters),
      ...(orFilters ? { or_filters: JSON.stringify(orFilters) } : {}),
      limit_page_length: 36,
      order_by: 'modified desc',
    },
  })

  return enrichItems(response.data.data, priceList, warehouse)
}

export async function getPosItem(itemCode: string, priceList?: string, warehouse?: string) {
  const response = await http.get<FrappeDocResponse<PosItemSearchResult>>(`/resource/Item/${encodeURIComponent(itemCode)}`)
  const [item] = await enrichItems([response.data.data], priceList, warehouse)
  return item
}

function normalizeItems(payload: PosSalePayload) {
  const shouldUpdateStock = payload.updateStock !== false

  return payload.cart.map((line) => ({
    doctype: 'Sales Invoice Item',
    item_code: line.item_code,
    item_name: line.item_name,
    qty: safeQty(line.qty),
    uom: line.uom,
    stock_uom: line.uom,
    conversion_factor: 1,
    rate: safeRate(line.rate),
    discount_percentage: safeDiscountPercent(line.discountPercent),
    warehouse: shouldUpdateStock ? cleanString(line.warehouse) ?? cleanString(payload.set_warehouse) : undefined,
  }))
}

function normalizePayments(payload: PosSalePayload) {
  if (payload.saleMode !== 'cash') {
    return []
  }

  return payload.payments
    .filter((payment) => payment.mode_of_payment.trim() && safeRate(payment.amount) > 0)
    .map((payment) => ({
      doctype: 'Sales Invoice Payment',
      mode_of_payment: payment.mode_of_payment.trim(),
      account: cleanString(payment.account),
      amount: safeRate(payment.amount),
      base_amount: safeRate(payment.amount) * payload.conversion_rate,
      reference_no: cleanString(payment.reference_no),
    }))
}

function calculateNetTotal(payload: PosSalePayload) {
  return calculateCartTotals(payload.cart, payload.invoiceDiscountAmount).netTotal
}

function calculateInvoiceDiscount(payload: PosSalePayload) {
  return calculateCartTotals(payload.cart, payload.invoiceDiscountAmount).safeInvoiceDiscountAmount
}

function calculateGrandTotal(payload: PosSalePayload) {
  return calculateCartTotals(payload.cart, payload.invoiceDiscountAmount).grandTotal
}

function toPosInvoicePayload(payload: PosSalePayload) {
  const isCashSale = payload.saleMode === 'cash'
  const shouldUpdateStock = payload.updateStock !== false
  const conversionRate = safeNumber(payload.conversion_rate, 1) > 0 ? safeNumber(payload.conversion_rate, 1) : 1
  const invoiceDiscountAmount = calculateInvoiceDiscount(payload)
  const paidAmount = isCashSale ? calculateGrandTotal(payload) : undefined
  const shiftReference = cleanString(payload.posOpeningEntry)
  const remarks = [cleanString(payload.remarks), shiftReference ? `POS Opening Entry: ${shiftReference}` : undefined]
    .filter(Boolean)
    .join('\n')

  return {
    customer: payload.customer.trim(),
    company: payload.company.trim(),
    posting_date: payload.posting_date || today(),
    due_date: cleanString(payload.due_date) ?? payload.posting_date ?? today(),
    currency: payload.currency.trim(),
    conversion_rate: conversionRate,
    selling_price_list: payload.selling_price_list.trim(),
    set_warehouse: shouldUpdateStock ? cleanString(payload.set_warehouse) : undefined,
    pos_profile: isCashSale ? cleanString(payload.pos_profile) : undefined,
    debit_to: cleanString(payload.receivableAccount),
    is_pos: isCashSale ? 1 : 0,
    update_stock: shouldUpdateStock ? 1 : 0,
    apply_discount_on: 'Grand Total',
    discount_amount: invoiceDiscountAmount,
    paid_amount: paidAmount,
    base_paid_amount: paidAmount ? paidAmount * conversionRate : undefined,
    remarks: cleanString(remarks),
    items: normalizeItems(payload),
    payments: normalizePayments(payload),
  }
}

function validatePosSalePayload(payload: PosSalePayload) {
  const shouldUpdateStock = payload.updateStock !== false
  const paymentsWithAmount = payload.payments.filter((payment) => safeRate(payment.amount) > 0)
  const paymentTotal = calculatePaymentTotal(payload.payments)
  const netTotal = calculateNetTotal(payload)
  const grandTotal = calculateGrandTotal(payload)

  if (!cleanString(payload.customer)) {
    throw new Error('اختر العميل قبل اعتماد فاتورة نقطة البيع.')
  }

  if (!cleanString(payload.company)) {
    throw new Error('اختر الشركة قبل اعتماد فاتورة نقطة البيع.')
  }

  if (!cleanString(payload.currency)) {
    throw new Error('اختر العملة قبل اعتماد فاتورة نقطة البيع.')
  }

  if (!cleanString(payload.selling_price_list)) {
    throw new Error('اختر قائمة الأسعار قبل اعتماد فاتورة نقطة البيع.')
  }

  if (!Number.isFinite(payload.conversion_rate) || payload.conversion_rate <= 0) {
    throw new Error('سعر الصرف يجب أن يكون رقمًا صحيحًا أكبر من صفر.')
  }

  if (payload.cart.length === 0) {
    throw new Error('لا يمكن اعتماد فاتورة POS بدون أصناف.')
  }

  if (shouldUpdateStock) {
    const stockLineWithoutWarehouse = payload.cart.find((line) => line.isStockItem !== 0 && !cleanString(line.warehouse) && !cleanString(payload.set_warehouse))

    if (stockLineWithoutWarehouse) {
      throw new Error('وضع تأثير المخزون يحتاج اختيار مخزن قبل اعتماد الفاتورة، أو عطّل تأثير المخزون من شاشة POS.')
    }
  }

  const invalidLine = payload.cart.find((line) => !cleanString(line.item_code) || safeQty(line.qty) <= 0 || safeRate(line.rate) < 0)

  if (invalidLine) {
    throw new Error('راجع أصناف الفاتورة: كل صنف يحتاج كود وكمية أكبر من صفر وسعر صالح.')
  }

  if (netTotal <= 0 || grandTotal <= 0) {
    throw new Error('إجمالي الفاتورة يجب أن يكون أكبر من صفر بعد الخصومات.')
  }

  if (safeRate(payload.invoiceDiscountAmount) > netTotal) {
    throw new Error('خصم الفاتورة لا يمكن أن يكون أكبر من صافي الفاتورة.')
  }

  if (payload.saleMode !== 'cash' && !cleanString(payload.receivableAccount)) {
    throw new Error('البيع الآجل أو الجزئي يحتاج حساب ذمم للعميل قبل الاعتماد.')
  }

  if (payload.saleMode === 'credit' && paymentsWithAmount.length > 0) {
    throw new Error('لا يمكن تسجيل دفعة في وضع البيع الآجل. اختر دفعة جزئية أو بيع نقدي.')
  }

  if ((payload.saleMode === 'cash' || payload.saleMode === 'partial') && paymentsWithAmount.some((payment) => !cleanString(payment.account))) {
    throw new Error('كل دفعة تحتاج حساب تحصيل واضح مثل الصندوق أو البنك أو حساب الصراف.')
  }

  if (payload.saleMode === 'cash' && paymentTotal < grandTotal) {
    throw new Error('البيع النقدي يحتاج دفع كامل قبل اعتماد الفاتورة.')
  }

  if (payload.saleMode === 'partial' && paymentTotal <= 0) {
    throw new Error('الدفعة الجزئية تحتاج مبلغًا مدفوعًا واحدًا على الأقل.')
  }

  if (payload.saleMode === 'partial' && paymentTotal >= grandTotal) {
    throw new Error('الدفعة الجزئية يجب أن تكون أقل من إجمالي الفاتورة. إذا دفع العميل كامل المبلغ اختر بيع نقدي.')
  }
}

async function createAndSubmitCollection(payload: PosSalePayload, invoice: SalesInvoice) {
  if (payload.saleMode !== 'partial') {
    return []
  }

  const createdCollections: Array<{ name: string }> = []
  let remainingToAllocate = Math.min(Number(invoice.grand_total ?? payload.paidAmount), calculatePaymentTotal(payload.payments))

  for (const payment of payload.payments) {
    const paidTo = cleanString(payment.account)
    const amount = Math.min(remainingToAllocate, safeRate(payment.amount))

    if (!paidTo || amount <= 0) {
      continue
    }

    const response = await http.post<FrappeDocResponse<{ name: string }>>('/resource/Payment Entry', {
      payment_type: 'Receive',
      party_type: 'Customer',
      company: payload.company.trim(),
      posting_date: payload.posting_date || today(),
      party: payload.customer.trim(),
      paid_from: cleanString(invoice.debit_to) ?? cleanString(payload.receivableAccount),
      paid_to: paidTo,
      paid_amount: amount,
      received_amount: amount,
      source_exchange_rate: payload.conversion_rate || 1,
      target_exchange_rate: 1,
      mode_of_payment: cleanString(payment.mode_of_payment),
      reference_no: cleanString(payment.reference_no),
      reference_date: payload.posting_date || today(),
      remarks: cleanString(payload.remarks),
      references: [
        {
          doctype: 'Payment Entry Reference',
          reference_doctype: 'Sales Invoice',
          reference_name: invoice.name,
          allocated_amount: amount,
        },
      ],
    })

    const submitted = await http.post<FrappeMethodResponse<{ name: string }>>('/method/frappe.client.submit', {
      doc: JSON.stringify(response.data.data),
    })

    createdCollections.push(submitted.data.message)
    remainingToAllocate -= amount

    if (remainingToAllocate <= 0) {
      break
    }
  }

  return createdCollections
}

export async function completePosSale(payload: PosSalePayload): Promise<PosCompletedSale> {
  validatePosSalePayload(payload)

  const response = await http.post<FrappeDocResponse<SalesInvoice>>('/resource/Sales Invoice', toPosInvoicePayload(payload))
  const submittedInvoice = await submitSalesInvoice(response.data.data)
  const collections = await createAndSubmitCollection(payload, submittedInvoice)

  return {
    invoice: response.data.data,
    submittedInvoice,
    collection: collections[0],
    collections,
  }
}
