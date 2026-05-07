import { listAccounts } from '@/features/accounts/api/accounts.api'
import { listCollections } from '@/features/collections/api/collections.api'
import { listCustomers } from '@/features/customers/api/customers.api'
import { listDisbursements } from '@/features/disbursements/api/disbursements.api'
import { listItems } from '@/features/items/api/items.api'
import { listPurchaseInvoices } from '@/features/purchase-invoices/api/purchase-invoices.api'
import { listPurchaseOrders } from '@/features/purchase-orders/api/purchase-orders.api'
import { listSalesInvoices } from '@/features/sales-invoices/api/sales-invoices.api'
import { listSalesOrders } from '@/features/sales-orders/api/sales-orders.api'
import { listStockEntries } from '@/features/stock/api/stock.api'
import { listStockReconciliations } from '@/features/stock-reconciliations/api/stock-reconciliations.api'
import { listSuppliers } from '@/features/suppliers/api/suppliers.api'
import { formatMoney } from '@/shared/utils/format'

export interface GlobalSearchPermissions {
  accounts: boolean
  customers: boolean
  suppliers: boolean
  items: boolean
  salesOrders: boolean
  purchaseOrders: boolean
  purchaseInvoices: boolean
  collections: boolean
  disbursements: boolean
  salesInvoices: boolean
  stockEntries: boolean
  stockReconciliations: boolean
}

export interface GlobalSearchItem {
  id: string
  title: string
  subtitle: string
  meta?: string
  path: string
}

export interface GlobalSearchSection {
  key:
    | 'accounts'
    | 'customers'
    | 'suppliers'
    | 'items'
    | 'sales-orders'
    | 'purchase-orders'
    | 'purchase-invoices'
    | 'collections'
    | 'disbursements'
    | 'sales-invoices'
    | 'stock'
    | 'stock-reconciliations'
  label: string
  listPath: string
  items: GlobalSearchItem[]
}

function toQueryPath(pathname: string, term: string) {
  return `${pathname}?q=${encodeURIComponent(term)}`
}

export async function searchGlobalRecords(term: string, permissions: GlobalSearchPermissions): Promise<GlobalSearchSection[]> {
  const trimmed = term.trim()

  if (!trimmed) {
    return []
  }

  const sections: Array<GlobalSearchSection | null> = await Promise.all([
    permissions.accounts
      ? listAccounts({ search: trimmed, limit: 5, offset: 0, userType: 'all', status: 'all' }).then((result) => ({
          key: 'accounts' as const,
          label: 'الحسابات والصلاحيات',
          listPath: toQueryPath('/accounts', trimmed),
          items: result.rows.map((account) => ({
            id: account.name,
            title: account.full_name || account.name,
            subtitle: [account.email || account.name, account.user_type === 'Website User' ? 'مستخدم موقع' : 'مستخدم نظام']
              .filter(Boolean)
              .join(' • '),
            meta: account.enabled === 0 ? 'معطل' : 'مفعل',
            path: `/accounts/${encodeURIComponent(account.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.customers
      ? listCustomers({ search: trimmed, limit: 5, offset: 0, customerType: 'all', status: 'all' }).then((result) => ({
          key: 'customers' as const,
          label: 'العملاء',
          listPath: toQueryPath('/customers', trimmed),
          items: result.rows.map((customer) => ({
            id: customer.name,
            title: customer.customer_name || customer.name,
            subtitle: [customer.customer_type === 'Company' ? 'شركة' : 'فرد', customer.mobile_no || customer.email_id || 'بدون جهة اتصال']
              .filter(Boolean)
              .join(' • '),
            meta: customer.disabled === 1 ? 'معطل' : 'نشط',
            path: `/customers/${encodeURIComponent(customer.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.suppliers
      ? listSuppliers({ search: trimmed, limit: 5, offset: 0, supplierType: 'all', status: 'all' }).then((result) => ({
          key: 'suppliers' as const,
          label: 'الموردون',
          listPath: toQueryPath('/suppliers', trimmed),
          items: result.rows.map((supplier) => ({
            id: supplier.name,
            title: supplier.supplier_name || supplier.name,
            subtitle: [supplier.supplier_type === 'Company' ? 'شركة' : 'فرد', supplier.mobile_no || supplier.email_id || 'بدون جهة اتصال']
              .filter(Boolean)
              .join(' • '),
            meta: supplier.disabled === 1 ? 'معطل' : 'نشط',
            path: `/suppliers/${encodeURIComponent(supplier.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.items
      ? listItems({ search: trimmed, limit: 5, offset: 0, itemGroup: 'all', stockMode: 'all', status: 'all' }).then((result) => ({
          key: 'items' as const,
          label: 'المنتجات',
          listPath: toQueryPath('/items', trimmed),
          items: result.rows.map((item) => ({
            id: item.name,
            title: item.item_name || item.item_code || item.name,
            subtitle: [item.item_code, item.item_group].filter(Boolean).join(' • '),
            meta: item.disabled === 1 ? 'معطل' : item.is_stock_item === 0 ? 'غير مخزني' : 'مخزني',
            path: `/items/${encodeURIComponent(item.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.salesOrders
      ? listSalesOrders({ search: trimmed, limit: 5, offset: 0, lifecycle: 'all', company: 'all' }).then((result) => ({
          key: 'sales-orders' as const,
          label: 'أوامر البيع',
          listPath: toQueryPath('/sales-orders', trimmed),
          items: result.rows.map((order) => ({
            id: order.name,
            title: order.name,
            subtitle: [order.customer, order.company].filter(Boolean).join(' • '),
            meta: order.grand_total ? formatMoney(order.grand_total) : order.status || 'بدون حالة',
            path: `/sales-orders/${encodeURIComponent(order.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.purchaseOrders
      ? listPurchaseOrders({ search: trimmed, limit: 5, offset: 0, lifecycle: 'all', company: 'all' }).then((result) => ({
          key: 'purchase-orders' as const,
          label: 'أوامر الشراء',
          listPath: toQueryPath('/purchase-orders', trimmed),
          items: result.rows.map((order) => ({
            id: order.name,
            title: order.name,
            subtitle: [order.supplier, order.company].filter(Boolean).join(' • '),
            meta: order.grand_total ? formatMoney(order.grand_total) : order.status || 'بدون حالة',
            path: `/purchase-orders/${encodeURIComponent(order.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.purchaseInvoices
      ? listPurchaseInvoices({ search: trimmed, limit: 5, offset: 0, lifecycle: 'all', company: 'all' }).then((result) => ({
          key: 'purchase-invoices' as const,
          label: 'فواتير الشراء',
          listPath: toQueryPath('/purchase-invoices', trimmed),
          items: result.rows.map((invoice) => ({
            id: invoice.name,
            title: invoice.name,
            subtitle: [invoice.supplier_name || invoice.supplier, invoice.company].filter(Boolean).join(' • '),
            meta:
              invoice.outstanding_amount && invoice.outstanding_amount > 0
                ? `مستحق ${formatMoney(invoice.outstanding_amount)}`
                : invoice.status || 'بدون حالة',
            path: `/purchase-invoices/${encodeURIComponent(invoice.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.collections
      ? listCollections({ search: trimmed, limit: 5, offset: 0, lifecycle: 'all', company: 'all' }).then((result) => ({
          key: 'collections' as const,
          label: 'التحصيلات',
          listPath: toQueryPath('/collections', trimmed),
          items: result.rows.map((collection) => ({
            id: collection.name,
            title: collection.name,
            subtitle: [collection.party_name || collection.party, collection.company].filter(Boolean).join(' • '),
            meta: collection.received_amount ? formatMoney(collection.received_amount) : collection.status || 'بدون حالة',
            path: `/collections/${encodeURIComponent(collection.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.disbursements
      ? listDisbursements({ search: trimmed, limit: 5, offset: 0, lifecycle: 'all', company: 'all' }).then((result) => ({
          key: 'disbursements' as const,
          label: 'سندات الصرف',
          listPath: toQueryPath('/disbursements', trimmed),
          items: result.rows.map((disbursement) => ({
            id: disbursement.name,
            title: disbursement.name,
            subtitle: [disbursement.party_name || disbursement.party, disbursement.company].filter(Boolean).join(' • '),
            meta: disbursement.paid_amount ? formatMoney(disbursement.paid_amount) : disbursement.status || 'بدون حالة',
            path: `/disbursements/${encodeURIComponent(disbursement.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.stockEntries
      ? listStockEntries({ search: trimmed, limit: 5, offset: 0, lifecycle: 'all', company: 'all', purpose: 'all' }).then((result) => ({
          key: 'stock' as const,
          label: 'حركات المخزون',
          listPath: toQueryPath('/stock', trimmed),
          items: result.rows.map((entry) => ({
            id: entry.name,
            title: entry.name,
            subtitle: [entry.stock_entry_type, entry.company].filter(Boolean).join(' • '),
            meta: entry.purpose || entry.status || 'بدون حالة',
            path: `/stock/${encodeURIComponent(entry.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.stockReconciliations
      ? listStockReconciliations({ search: trimmed, limit: 5, offset: 0, lifecycle: 'all', company: 'all', purpose: 'all' }).then((result) => ({
          key: 'stock-reconciliations' as const,
          label: 'الجرد والتسوية',
          listPath: toQueryPath('/stock-reconciliations', trimmed),
          items: result.rows.map((document) => ({
            id: document.name,
            title: document.name,
            subtitle: [document.company, document.purpose === 'Opening Stock' ? 'رصيد افتتاحي' : 'تسوية مخزون']
              .filter(Boolean)
              .join(' • '),
            meta: document.expense_account || 'بدون حساب فروقات',
            path: `/stock-reconciliations/${encodeURIComponent(document.name)}`,
          })),
        }))
      : Promise.resolve(null),
    permissions.salesInvoices
      ? listSalesInvoices({ search: trimmed, limit: 5, offset: 0, lifecycle: 'all', company: 'all' }).then((result) => ({
          key: 'sales-invoices' as const,
          label: 'فواتير البيع',
          listPath: toQueryPath('/sales-invoices', trimmed),
          items: result.rows.map((invoice) => ({
            id: invoice.name,
            title: invoice.name,
            subtitle: [invoice.customer_name || invoice.customer, invoice.company].filter(Boolean).join(' • '),
            meta:
              invoice.outstanding_amount && invoice.outstanding_amount > 0
                ? `مستحق ${formatMoney(invoice.outstanding_amount)}`
                : invoice.status || 'بدون حالة',
            path: `/sales-invoices/${encodeURIComponent(invoice.name)}`,
          })),
        }))
      : Promise.resolve(null),
  ])

  return sections.filter((section): section is GlobalSearchSection => Boolean(section?.items.length))
}
