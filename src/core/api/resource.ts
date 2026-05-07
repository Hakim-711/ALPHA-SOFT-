import { http } from './http'
import type { FrappeListResponse } from './types'

interface ResourceNameRow {
  name: string
}

interface ListResourceNamesOptions {
  search?: string
  limit?: number
}

interface CountResourceOptions {
  filters?: unknown[]
  orFilters?: unknown[]
}

interface FrappeMethodResponse<T> {
  message: T
}

const doctypeSearchFields: Record<string, string[]> = {
  Customer: ['name', 'customer_name', 'mobile_no', 'email_id'],
  Supplier: ['name', 'supplier_name', 'mobile_no', 'email_id'],
  Item: ['name', 'item_code', 'item_name'],
  Account: ['name'],
  Company: ['name'],
  Currency: ['name'],
  Country: ['name'],
  Warehouse: ['name'],
  Batch: ['name'],
  'Item Group': ['name'],
  UOM: ['name'],
  Brand: ['name'],
  Territory: ['name'],
  Address: ['name'],
  'Cost Center': ['name'],
  'Customer Group': ['name'],
  'Supplier Group': ['name'],
  'Payment Terms Template': ['name'],
  'Price List': ['name'],
  'Mode of Payment': ['name'],
  'Serial and Batch Bundle': ['name'],
  'Stock Entry Type': ['name'],
}

function buildSearchParams(doctype: string, search?: string) {
  const trimmed = search?.trim()

  if (!trimmed) {
    return {}
  }

  const fields = doctypeSearchFields[doctype] ?? ['name']

  if (fields.length === 1) {
    return {
      filters: JSON.stringify([[doctype, fields[0], 'like', `%${trimmed}%`]]),
    }
  }

  return {
    or_filters: JSON.stringify(fields.map((field) => [doctype, field, 'like', `%${trimmed}%`])),
  }
}

export async function listResourceNames(doctype: string, options: ListResourceNamesOptions = {}) {
  const response = await http.get<FrappeListResponse<ResourceNameRow>>(`/resource/${encodeURIComponent(doctype)}`, {
    params: {
      fields: JSON.stringify(['name']),
      limit_page_length: options.limit ?? 100,
      order_by: 'modified desc',
      ...buildSearchParams(doctype, options.search),
    },
  })

  return response.data.data.map((row) => row.name)
}

export async function getResourceCount(doctype: string, options: CountResourceOptions = {}) {
  const params = {
    doctype,
    ...(options.filters?.length ? { filters: JSON.stringify(options.filters) } : {}),
    ...(options.orFilters?.length ? { or_filters: JSON.stringify(options.orFilters) } : {}),
  }

  try {
    const response = await http.get<FrappeMethodResponse<number | string>>('/method/frappe.desk.reportview.get_count', {
      params,
    })

    return Number(response.data.message ?? 0)
  } catch {
    if (options.orFilters?.length) {
      throw new Error('تعذر تحميل العدادات مع البحث الحالي.')
    }

    const response = await http.get<FrappeMethodResponse<number | string>>('/method/frappe.client.get_count', {
      params,
    })

    return Number(response.data.message ?? 0)
  }
}
