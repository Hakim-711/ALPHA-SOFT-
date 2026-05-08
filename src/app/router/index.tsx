import { Suspense, type ReactNode } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Loading } from '@/shared/ui/loading'
import { AdminLayout } from './admin-layout'
import { DoctypePermissionRoute, type PermissionField } from './doctype-permission-route'
import { ProtectedRoute } from './protected-route'
import { RouteErrorBoundary } from './route-error-boundary'
import {
  AccountCreatePage,
  AccountDetailsPage,
  AccountEditPage,
  AccountsListPage,
  CashShiftsPage,
  CollectionCreatePage,
  CollectionDetailsPage,
  CollectionEditPage,
  CollectionsListPage,
  CustomerCreatePage,
  CustomerDetailsPage,
  CustomerEditPage,
  CustomersListPage,
  DailyCashPage,
  DashboardPage,
  DisbursementCreatePage,
  DisbursementDetailsPage,
  DisbursementEditPage,
  DisbursementsListPage,
  ItemCreatePage,
  ItemDetailsPage,
  ItemEditPage,
  ItemsListPage,
  LoginPage,
  PosPage,
  PosReturnsPage,
  PurchaseInvoiceCreatePage,
  PurchaseInvoiceDetailsPage,
  PurchaseInvoiceEditPage,
  PurchaseInvoicesListPage,
  PurchaseOrderCreatePage,
  PurchaseOrderDetailsPage,
  PurchaseOrderEditPage,
  PurchaseOrdersListPage,
  ReportsPage,
  SalesInvoiceCreatePage,
  SalesInvoiceDetailsPage,
  SalesInvoiceEditPage,
  SalesInvoicesListPage,
  SalesOrderCreatePage,
  SalesOrderDetailsPage,
  SalesOrderEditPage,
  SalesOrdersListPage,
  SettingsPage,
  StatementsPage,
  StockCreatePage,
  StockDetailsPage,
  StockEditPage,
  StockListPage,
  StockReconciliationCreatePage,
  StockReconciliationDetailsPage,
  StockReconciliationEditPage,
  StockReconciliationsListPage,
  SupplierCreatePage,
  SupplierDetailsPage,
  SupplierEditPage,
  SuppliersListPage,
} from './route-pages'

function routePage(element: ReactNode) {
  return (
    <Suspense
      fallback={
        <main className="route-loading">
          <Loading />
        </main>
      }
    >
      {element}
    </Suspense>
  )
}

function guardedRoutePage(doctype: string, element: ReactNode, options: { permission?: PermissionField; permissions?: PermissionField[] } = {}) {
  return (
    <DoctypePermissionRoute doctype={doctype} permission={options.permission} permissions={options.permissions}>
      {routePage(element)}
    </DoctypePermissionRoute>
  )
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: routePage(<LoginPage />),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: 'pos',
        element: guardedRoutePage('Sales Invoice', <PosPage />, { permissions: ['canCreate', 'canSubmit'] }),
      },
      {
        path: 'pos/returns',
        element: guardedRoutePage('Sales Invoice', <PosReturnsPage />, { permissions: ['canCreate', 'canSubmit'] }),
      },
      {
        element: <AdminLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: routePage(<DashboardPage />),
          },
          {
            path: 'accounts',
            element: <DoctypePermissionRoute doctype="User" />,
            children: [
              { index: true, element: routePage(<AccountsListPage />) },
              { path: 'new', element: guardedRoutePage('User', <AccountCreatePage />, { permission: 'canCreate' }) },
              { path: ':accountId', element: routePage(<AccountDetailsPage />) },
              { path: ':accountId/edit', element: guardedRoutePage('User', <AccountEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'daily-cash',
            element: (
              <DoctypePermissionRoute doctype="Payment Entry">
                {routePage(<DailyCashPage />)}
              </DoctypePermissionRoute>
            ),
          },
          {
            path: 'cash-shifts',
            element: (
              <DoctypePermissionRoute doctype="POS Opening Entry">
                {routePage(<CashShiftsPage />)}
              </DoctypePermissionRoute>
            ),
          },
          {
            path: 'statements',
            element: (
              <DoctypePermissionRoute doctype="Payment Entry">
                {routePage(<StatementsPage />)}
              </DoctypePermissionRoute>
            ),
          },
          {
            path: 'customers',
            element: <DoctypePermissionRoute doctype="Customer" />,
            children: [
              { index: true, element: routePage(<CustomersListPage />) },
              { path: 'new', element: guardedRoutePage('Customer', <CustomerCreatePage />, { permission: 'canCreate' }) },
              { path: ':customerId', element: routePage(<CustomerDetailsPage />) },
              { path: ':customerId/edit', element: guardedRoutePage('Customer', <CustomerEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'suppliers',
            element: <DoctypePermissionRoute doctype="Supplier" />,
            children: [
              { index: true, element: routePage(<SuppliersListPage />) },
              { path: 'new', element: guardedRoutePage('Supplier', <SupplierCreatePage />, { permission: 'canCreate' }) },
              { path: ':supplierId', element: routePage(<SupplierDetailsPage />) },
              { path: ':supplierId/edit', element: guardedRoutePage('Supplier', <SupplierEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'items',
            element: <DoctypePermissionRoute doctype="Item" />,
            children: [
              { index: true, element: routePage(<ItemsListPage />) },
              { path: 'new', element: guardedRoutePage('Item', <ItemCreatePage />, { permission: 'canCreate' }) },
              { path: ':itemId', element: routePage(<ItemDetailsPage />) },
              { path: ':itemId/edit', element: guardedRoutePage('Item', <ItemEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'sales-orders',
            element: <DoctypePermissionRoute doctype="Sales Order" />,
            children: [
              { index: true, element: routePage(<SalesOrdersListPage />) },
              { path: 'new', element: guardedRoutePage('Sales Order', <SalesOrderCreatePage />, { permission: 'canCreate' }) },
              { path: ':salesOrderId', element: routePage(<SalesOrderDetailsPage />) },
              { path: ':salesOrderId/edit', element: guardedRoutePage('Sales Order', <SalesOrderEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'collections',
            element: <DoctypePermissionRoute doctype="Payment Entry" />,
            children: [
              { index: true, element: routePage(<CollectionsListPage />) },
              { path: 'new', element: guardedRoutePage('Payment Entry', <CollectionCreatePage />, { permission: 'canCreate' }) },
              { path: ':collectionId', element: routePage(<CollectionDetailsPage />) },
              { path: ':collectionId/edit', element: guardedRoutePage('Payment Entry', <CollectionEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'purchase-invoices',
            element: <DoctypePermissionRoute doctype="Purchase Invoice" />,
            children: [
              { index: true, element: routePage(<PurchaseInvoicesListPage />) },
              { path: 'new', element: guardedRoutePage('Purchase Invoice', <PurchaseInvoiceCreatePage />, { permission: 'canCreate' }) },
              { path: ':purchaseInvoiceId', element: routePage(<PurchaseInvoiceDetailsPage />) },
              { path: ':purchaseInvoiceId/edit', element: guardedRoutePage('Purchase Invoice', <PurchaseInvoiceEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'purchase-orders',
            element: <DoctypePermissionRoute doctype="Purchase Order" />,
            children: [
              { index: true, element: routePage(<PurchaseOrdersListPage />) },
              { path: 'new', element: guardedRoutePage('Purchase Order', <PurchaseOrderCreatePage />, { permission: 'canCreate' }) },
              { path: ':purchaseOrderId', element: routePage(<PurchaseOrderDetailsPage />) },
              { path: ':purchaseOrderId/edit', element: guardedRoutePage('Purchase Order', <PurchaseOrderEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'sales-invoices',
            element: <DoctypePermissionRoute doctype="Sales Invoice" />,
            children: [
              { index: true, element: routePage(<SalesInvoicesListPage />) },
              { path: 'new', element: guardedRoutePage('Sales Invoice', <SalesInvoiceCreatePage />, { permission: 'canCreate' }) },
              { path: ':salesInvoiceId', element: routePage(<SalesInvoiceDetailsPage />) },
              { path: ':salesInvoiceId/edit', element: guardedRoutePage('Sales Invoice', <SalesInvoiceEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'disbursements',
            element: <DoctypePermissionRoute doctype="Payment Entry" />,
            children: [
              { index: true, element: routePage(<DisbursementsListPage />) },
              { path: 'new', element: guardedRoutePage('Payment Entry', <DisbursementCreatePage />, { permission: 'canCreate' }) },
              { path: ':disbursementId', element: routePage(<DisbursementDetailsPage />) },
              { path: ':disbursementId/edit', element: guardedRoutePage('Payment Entry', <DisbursementEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'stock',
            element: <DoctypePermissionRoute doctype="Stock Entry" />,
            children: [
              { index: true, element: routePage(<StockListPage />) },
              { path: 'new', element: guardedRoutePage('Stock Entry', <StockCreatePage />, { permission: 'canCreate' }) },
              { path: ':stockEntryId', element: routePage(<StockDetailsPage />) },
              { path: ':stockEntryId/edit', element: guardedRoutePage('Stock Entry', <StockEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'stock-reconciliations',
            element: <DoctypePermissionRoute doctype="Stock Reconciliation" />,
            children: [
              { index: true, element: routePage(<StockReconciliationsListPage />) },
              { path: 'new', element: guardedRoutePage('Stock Reconciliation', <StockReconciliationCreatePage />, { permission: 'canCreate' }) },
              { path: ':stockReconciliationId', element: routePage(<StockReconciliationDetailsPage />) },
              { path: ':stockReconciliationId/edit', element: guardedRoutePage('Stock Reconciliation', <StockReconciliationEditPage />, { permission: 'canWrite' }) },
            ],
          },
          {
            path: 'reports',
            element: routePage(<ReportsPage />),
          },
          {
            path: 'settings',
            element: routePage(<SettingsPage />),
          },
          {
            path: '*',
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },
    ],
  },
])
