import { Suspense, type ReactNode } from 'react'
import { Navigate, createBrowserRouter } from 'react-router-dom'
import { Loading } from '@/shared/ui/loading'
import { AdminLayout } from './admin-layout'
import { DoctypePermissionRoute } from './doctype-permission-route'
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
        element: (
          <DoctypePermissionRoute doctype="Sales Invoice" permissions={['canCreate', 'canSubmit']}>
            {routePage(<PosPage />)}
          </DoctypePermissionRoute>
        ),
      },
      {
        path: 'pos/returns',
        element: (
          <DoctypePermissionRoute doctype="Sales Invoice" permissions={['canCreate', 'canSubmit']}>
            {routePage(<PosReturnsPage />)}
          </DoctypePermissionRoute>
        ),
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
              { path: 'new', element: routePage(<AccountCreatePage />) },
              { path: ':accountId', element: routePage(<AccountDetailsPage />) },
              { path: ':accountId/edit', element: routePage(<AccountEditPage />) },
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
              { path: 'new', element: routePage(<CustomerCreatePage />) },
              { path: ':customerId', element: routePage(<CustomerDetailsPage />) },
              { path: ':customerId/edit', element: routePage(<CustomerEditPage />) },
            ],
          },
          {
            path: 'suppliers',
            element: <DoctypePermissionRoute doctype="Supplier" />,
            children: [
              { index: true, element: routePage(<SuppliersListPage />) },
              { path: 'new', element: routePage(<SupplierCreatePage />) },
              { path: ':supplierId', element: routePage(<SupplierDetailsPage />) },
              { path: ':supplierId/edit', element: routePage(<SupplierEditPage />) },
            ],
          },
          {
            path: 'items',
            element: <DoctypePermissionRoute doctype="Item" />,
            children: [
              { index: true, element: routePage(<ItemsListPage />) },
              { path: 'new', element: routePage(<ItemCreatePage />) },
              { path: ':itemId', element: routePage(<ItemDetailsPage />) },
              { path: ':itemId/edit', element: routePage(<ItemEditPage />) },
            ],
          },
          {
            path: 'sales-orders',
            element: <DoctypePermissionRoute doctype="Sales Order" />,
            children: [
              { index: true, element: routePage(<SalesOrdersListPage />) },
              { path: 'new', element: routePage(<SalesOrderCreatePage />) },
              { path: ':salesOrderId', element: routePage(<SalesOrderDetailsPage />) },
              { path: ':salesOrderId/edit', element: routePage(<SalesOrderEditPage />) },
            ],
          },
          {
            path: 'collections',
            element: <DoctypePermissionRoute doctype="Payment Entry" />,
            children: [
              { index: true, element: routePage(<CollectionsListPage />) },
              { path: 'new', element: routePage(<CollectionCreatePage />) },
              { path: ':collectionId', element: routePage(<CollectionDetailsPage />) },
              { path: ':collectionId/edit', element: routePage(<CollectionEditPage />) },
            ],
          },
          {
            path: 'purchase-invoices',
            element: <DoctypePermissionRoute doctype="Purchase Invoice" />,
            children: [
              { index: true, element: routePage(<PurchaseInvoicesListPage />) },
              { path: 'new', element: routePage(<PurchaseInvoiceCreatePage />) },
              { path: ':purchaseInvoiceId', element: routePage(<PurchaseInvoiceDetailsPage />) },
              { path: ':purchaseInvoiceId/edit', element: routePage(<PurchaseInvoiceEditPage />) },
            ],
          },
          {
            path: 'purchase-orders',
            element: <DoctypePermissionRoute doctype="Purchase Order" />,
            children: [
              { index: true, element: routePage(<PurchaseOrdersListPage />) },
              { path: 'new', element: routePage(<PurchaseOrderCreatePage />) },
              { path: ':purchaseOrderId', element: routePage(<PurchaseOrderDetailsPage />) },
              { path: ':purchaseOrderId/edit', element: routePage(<PurchaseOrderEditPage />) },
            ],
          },
          {
            path: 'sales-invoices',
            element: <DoctypePermissionRoute doctype="Sales Invoice" />,
            children: [
              { index: true, element: routePage(<SalesInvoicesListPage />) },
              { path: 'new', element: routePage(<SalesInvoiceCreatePage />) },
              { path: ':salesInvoiceId', element: routePage(<SalesInvoiceDetailsPage />) },
              { path: ':salesInvoiceId/edit', element: routePage(<SalesInvoiceEditPage />) },
            ],
          },
          {
            path: 'disbursements',
            element: <DoctypePermissionRoute doctype="Payment Entry" />,
            children: [
              { index: true, element: routePage(<DisbursementsListPage />) },
              { path: 'new', element: routePage(<DisbursementCreatePage />) },
              { path: ':disbursementId', element: routePage(<DisbursementDetailsPage />) },
              { path: ':disbursementId/edit', element: routePage(<DisbursementEditPage />) },
            ],
          },
          {
            path: 'stock',
            element: <DoctypePermissionRoute doctype="Stock Entry" />,
            children: [
              { index: true, element: routePage(<StockListPage />) },
              { path: 'new', element: routePage(<StockCreatePage />) },
              { path: ':stockEntryId', element: routePage(<StockDetailsPage />) },
              { path: ':stockEntryId/edit', element: routePage(<StockEditPage />) },
            ],
          },
          {
            path: 'stock-reconciliations',
            element: <DoctypePermissionRoute doctype="Stock Reconciliation" />,
            children: [
              { index: true, element: routePage(<StockReconciliationsListPage />) },
              { path: 'new', element: routePage(<StockReconciliationCreatePage />) },
              { path: ':stockReconciliationId', element: routePage(<StockReconciliationDetailsPage />) },
              { path: ':stockReconciliationId/edit', element: routePage(<StockReconciliationEditPage />) },
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
