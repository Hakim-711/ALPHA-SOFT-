import { useMemo } from 'react'
import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import { navItems } from './navigation'

export function useAdminNavigationPermissions() {
  const accountPermissions = useDoctypePermissions('User')
  const customerPermissions = useDoctypePermissions('Customer')
  const supplierPermissions = useDoctypePermissions('Supplier')
  const itemPermissions = useDoctypePermissions('Item')
  const salesOrderPermissions = useDoctypePermissions('Sales Order')
  const paymentEntryPermissions = useDoctypePermissions('Payment Entry')
  const salesInvoicePermissions = useDoctypePermissions('Sales Invoice')
  const purchaseOrderPermissions = useDoctypePermissions('Purchase Order')
  const purchaseInvoicePermissions = useDoctypePermissions('Purchase Invoice')
  const posOpeningPermissions = useDoctypePermissions('POS Opening Entry')
  const stockEntryPermissions = useDoctypePermissions('Stock Entry')
  const stockReconciliationPermissions = useDoctypePermissions('Stock Reconciliation')

  const canReadAccounts = canUsePermission(accountPermissions.canRead)
  const canReadCustomers = canUsePermission(customerPermissions.canRead)
  const canReadSuppliers = canUsePermission(supplierPermissions.canRead)
  const canReadItems = canUsePermission(itemPermissions.canRead)
  const canReadSalesOrders = canUsePermission(salesOrderPermissions.canRead)
  const canReadPaymentEntries = canUsePermission(paymentEntryPermissions.canRead)
  const canReadSalesInvoices = canUsePermission(salesInvoicePermissions.canRead)
  const canCreateSalesInvoices = canUsePermission(salesInvoicePermissions.canCreate)
  const canSubmitSalesInvoices = canUsePermission(salesInvoicePermissions.canSubmit)
  const canReadPurchaseOrders = canUsePermission(purchaseOrderPermissions.canRead)
  const canReadPurchaseInvoices = canUsePermission(purchaseInvoicePermissions.canRead)
  const canReadPosOpening = canUsePermission(posOpeningPermissions.canRead)
  const canReadStockEntries = canUsePermission(stockEntryPermissions.canRead)
  const canReadStockReconciliations = canUsePermission(stockReconciliationPermissions.canRead)
  const canOpenPos = canCreateSalesInvoices && canSubmitSalesInvoices

  const visibleNavItems = useMemo(
    () =>
      navItems.filter((item) => {
        if (item.path === '/accounts') {
          return canReadAccounts
        }

        if (item.path === '/customers') {
          return canReadCustomers
        }

        if (item.path === '/suppliers') {
          return canReadSuppliers
        }

        if (item.path === '/items') {
          return canReadItems
        }

        if (item.path === '/sales-orders') {
          return canReadSalesOrders
        }

        if (item.path === '/purchase-invoices') {
          return canReadPurchaseInvoices
        }

        if (item.path === '/purchase-orders') {
          return canReadPurchaseOrders
        }

        if (item.path === '/daily-cash' || item.path === '/statements' || item.path === '/collections' || item.path === '/disbursements') {
          return canReadPaymentEntries
        }

        if (item.path === '/sales-invoices') {
          return canReadSalesInvoices
        }

        if (item.path === '/pos') {
          return canOpenPos
        }

        if (item.path === '/cash-shifts') {
          return canReadPosOpening || canOpenPos
        }

        if (item.path === '/stock') {
          return canReadStockEntries
        }

        if (item.path === '/stock-reconciliations') {
          return canReadStockReconciliations
        }

        return true
      }),
    [
      canOpenPos,
      canReadAccounts,
      canReadCustomers,
      canReadItems,
      canReadPaymentEntries,
      canReadPosOpening,
      canReadPurchaseInvoices,
      canReadPurchaseOrders,
      canReadSalesInvoices,
      canReadSalesOrders,
      canReadStockEntries,
      canReadStockReconciliations,
      canReadSuppliers,
    ],
  )

  const globalSearchPermissions = useMemo(
    () => ({
      accounts: canReadAccounts,
      customers: canReadCustomers,
      suppliers: canReadSuppliers,
      items: canReadItems,
      salesOrders: canReadSalesOrders,
      purchaseInvoices: canReadPurchaseInvoices,
      purchaseOrders: canReadPurchaseOrders,
      collections: canReadPaymentEntries,
      disbursements: canReadPaymentEntries,
      stockEntries: canReadStockEntries,
      stockReconciliations: canReadStockReconciliations,
      salesInvoices: canReadSalesInvoices,
    }),
    [
      canReadAccounts,
      canReadCustomers,
      canReadItems,
      canReadPaymentEntries,
      canReadPurchaseInvoices,
      canReadPurchaseOrders,
      canReadSalesInvoices,
      canReadSalesOrders,
      canReadStockEntries,
      canReadStockReconciliations,
      canReadSuppliers,
    ],
  )

  return {
    canOpenPos,
    globalSearchPermissions,
    visibleNavItems,
  }
}
