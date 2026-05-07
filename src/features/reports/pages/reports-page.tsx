import { AlertTriangle, Boxes, HandCoins, ReceiptText, ShoppingBasket, TrendingUp, Truck, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getStorePreferences } from '@/core/config/store-preferences'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { useOperationalReports } from '../hooks/use-operational-reports'
import type { ReportCurrencySummary } from '../types/reports.types'

function CurrencySummaryList({ rows, emptyText }: { rows: ReportCurrencySummary[]; emptyText: string }) {
  if (rows.length === 0) {
    return <p className="muted">{emptyText}</p>
  }

  return (
    <ul className="related-list report-currency-list">
      {rows.map((row) => (
        <li key={row.currency}>
          <strong>{row.currency}</strong>
          <span>عدد العمليات: {row.count}</span>
          <strong>{formatMoney(row.total)}</strong>
        </li>
      ))}
    </ul>
  )
}

export default function ReportsPage() {
  const reportsQuery = useOperationalReports()

  if (reportsQuery.isLoading) {
    return <Loading />
  }

  if (reportsQuery.isError) {
    return <ErrorState message={(reportsQuery.error as Error).message} />
  }

  const reports = reportsQuery.data

  if (!reports) {
    return null
  }

  const totalDebtDocuments = reports.outstandingByCurrency.reduce((sum, row) => sum + row.count, 0)
  const totalSupplierDebtDocuments = reports.supplierOutstandingByCurrency.reduce((sum, row) => sum + row.count, 0)
  const overdueCustomers = new Set(reports.overdueInvoices.map((invoice) => invoice.customer).filter(Boolean)).size
  const overdueSuppliers = new Set(reports.overduePurchaseInvoices.map((invoice) => invoice.supplier).filter(Boolean)).size
  const lowStockCount = reports.lowStock.length
  const collectionsCount = reports.recentCollections.length
  const openPurchaseOrdersCount = reports.openPurchaseOrders.length
  const lowStockAlertQty = getStorePreferences().lowStockAlertQty

  return (
    <>
      <Breadcrumbs items={[{ label: 'التقارير' }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/collections/new">
              <HandCoins size={17} aria-hidden="true" />
              سند قبض
            </Link>
            <Link className="button button-secondary" to="/purchase-orders/new">
              <Truck size={17} aria-hidden="true" />
              أمر شراء
            </Link>
            <Link className="button button-primary" to="/pos">
              <ReceiptText size={17} aria-hidden="true" />
              نقطة البيع
            </Link>
          </>
        }
        eyebrow="تقارير مأرب التشغيلية"
        meta={<span>آخر تحديث: {formatDateTime(reports.lastSyncedAt)}</span>}
        subtitle="ملخص عملي لصاحب المحل: الديون، التحصيل، المبيعات، والمخزون الناقص بدون الدخول في تفاصيل محاسبية معقدة."
        title="تقارير التشغيل اليومية"
      />

      {reports.errors.length > 0 ? (
        <div className="inline-alert inline-alert-warning" role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{reports.errors[0]}</span>
        </div>
      ) : null}

      <section className="metrics-grid" aria-label="مؤشرات التقارير">
        <MetricCard detail="حسب كل عملة" icon={TrendingUp} label="مبيعات اليوم" tone="blue" value={reports.todaySales.length} />
        <MetricCard detail="حسب كل عملة" icon={ShoppingBasket} label="مشتريات اليوم" tone="amber" value={reports.todayPurchases.length} />
        <MetricCard detail="فواتير عليها رصيد" icon={Wallet} label="مستندات الدين" tone="red" value={totalDebtDocuments} />
        <MetricCard detail="فواتير شراء عليها رصيد" icon={Truck} label="ديون الموردين" tone="red" value={totalSupplierDebtDocuments} />
        <MetricCard detail={`عملاء: ${overdueCustomers} | موردون: ${overdueSuppliers}`} icon={AlertTriangle} label="المتأخرون" tone="amber" value={overdueCustomers + overdueSuppliers} />
        <MetricCard detail="بانتظار استلام أو فوترة" icon={Truck} label="أوامر شراء مفتوحة" tone="blue" value={openPurchaseOrdersCount} />
        <MetricCard detail="أصناف عند حد التنبيه" icon={Boxes} label="مخزون ناقص" tone="green" value={lowStockCount} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel report-panel-accent">
          <div className="section-heading">
            <h4>مبيعات اليوم حسب العملة</h4>
            <p>مهم في السوق اليمني حتى لا تختلط مبيعات الريال اليمني مع السعودي أو الدولار.</p>
          </div>
          <CurrencySummaryList rows={reports.todaySales} emptyText="لا توجد مبيعات معتمدة اليوم." />
        </section>

        <section className="detail-panel report-panel-accent">
          <div className="section-heading">
            <h4>مبيعات الشهر حسب العملة</h4>
            <p>نظرة شهرية سريعة تساعد المالك على فهم الاتجاه العام للمبيعات.</p>
          </div>
          <CurrencySummaryList rows={reports.monthSales} emptyText="لا توجد مبيعات شهرية متاحة." />
        </section>
      </div>

      <div className="detail-layout">
        <section className="detail-panel report-panel-accent">
          <div className="section-heading">
            <h4>مشتريات اليوم حسب العملة</h4>
            <p>يعرض قيمة فواتير الشراء المعتمدة اليوم حتى يعرف صاحب المحل ضغط الشراء اليومي بجانب المبيعات.</p>
          </div>
          <CurrencySummaryList rows={reports.todayPurchases} emptyText="لا توجد مشتريات معتمدة اليوم." />
        </section>

        <section className="detail-panel report-panel-accent">
          <div className="section-heading">
            <h4>مشتريات الشهر حسب العملة</h4>
            <p>مفيد لمراقبة تكلفة التوريد والطلب من الموردين بدون خلط العملات.</p>
          </div>
          <CurrencySummaryList rows={reports.monthPurchases} emptyText="لا توجد مشتريات شهرية متاحة." />
        </section>
      </div>

      <div className="detail-layout">
        <section className="detail-panel report-panel-danger">
          <div className="section-heading">
            <h4>الذمم المفتوحة حسب العملة</h4>
            <p>إجمالي الديون القائمة بدون خلط العملات.</p>
          </div>
          <CurrencySummaryList rows={reports.outstandingByCurrency} emptyText="لا توجد ذمم مفتوحة حاليًا." />
        </section>

        <section className="detail-panel report-panel-danger">
          <div className="section-heading">
            <h4>أكبر العملاء مديونية</h4>
            <p>أولوية التحصيل: ابدأ بمن عليه أكبر رصيد.</p>
          </div>
          {reports.topDebtors.length === 0 ? (
            <p className="muted">لا توجد ديون على العملاء حاليًا.</p>
          ) : (
            <ul className="related-list">
              {reports.topDebtors.map((row) => (
                <li key={`${row.customer}-${row.currency}`}>
                  <Link to={`/customers/${encodeURIComponent(row.customer)}`}>{row.customer_name || row.customer}</Link>
                  <span>عدد الفواتير: {row.invoices}</span>
                  <strong>
                    {formatMoney(row.outstanding)} {row.currency}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="detail-layout">
        <section className="detail-panel report-panel-danger">
          <div className="section-heading">
            <h4>ذمم الموردين حسب العملة</h4>
            <p>إجمالي ما على المحل للموردين، مفصولًا حسب العملة حتى لا تختلط التزامات السعودي واليمني والدولار.</p>
          </div>
          <CurrencySummaryList rows={reports.supplierOutstandingByCurrency} emptyText="لا توجد ذمم مفتوحة للموردين حاليًا." />
        </section>

        <section className="detail-panel report-panel-danger">
          <div className="section-heading">
            <h4>أكبر الموردين مستحقات</h4>
            <p>أولوية السداد: الموردون الذين لديهم أعلى رصيد مفتوح على المحل.</p>
          </div>
          {reports.topSupplierPayables.length === 0 ? (
            <p className="muted">لا توجد مستحقات مفتوحة للموردين حاليًا.</p>
          ) : (
            <ul className="related-list">
              {reports.topSupplierPayables.map((row) => (
                <li key={`${row.supplier}-${row.currency}`}>
                  <Link to={`/suppliers/${encodeURIComponent(row.supplier)}`}>{row.supplier_name || row.supplier}</Link>
                  <span>عدد الفواتير: {row.invoices}</span>
                  <strong>
                    {formatMoney(row.outstanding)} {row.currency}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="detail-layout">
        <section className="detail-panel">
          <div className="section-heading">
            <h4>الفواتير المتأخرة</h4>
            <p>فواتير تجاوزت تاريخ الاستحقاق وما زال عليها رصيد.</p>
          </div>
          {reports.overdueInvoices.length === 0 ? (
            <p className="muted">لا توجد فواتير متأخرة حاليًا.</p>
          ) : (
            <ul className="related-list">
              {reports.overdueInvoices.map((invoice) => (
                <li key={invoice.name}>
                  <Link to={`/sales-invoices/${encodeURIComponent(invoice.name)}`}>{invoice.name}</Link>
                  <span>{invoice.customer_name || invoice.customer || 'بدون عميل'}</span>
                  <span>الاستحقاق: {invoice.due_date ? formatDateTime(invoice.due_date) : 'غير محدد'}</span>
                  <strong>
                    {formatMoney(invoice.outstanding_amount)} {invoice.currency || ''}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-panel">
          <div className="section-heading">
            <h4>آخر التحصيلات</h4>
            <p>مراجعة سريعة للقبض اليومي والتحويلات.</p>
          </div>
          {collectionsCount === 0 ? (
            <p className="muted">لا توجد تحصيلات حديثة.</p>
          ) : (
            <ul className="related-list">
              {reports.recentCollections.map((entry) => (
                <li key={entry.name}>
                  <Link to={`/collections/${encodeURIComponent(entry.name)}`}>{entry.name}</Link>
                  <span>{entry.party_name || entry.party || 'بدون عميل'} | {entry.mode_of_payment || 'بدون طريقة'}</span>
                  <span>{entry.posting_date ? formatDateTime(entry.posting_date) : 'بدون تاريخ'}</span>
                  <strong>{formatMoney(entry.received_amount ?? entry.paid_amount)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="detail-layout">
        <section className="detail-panel">
          <div className="section-heading">
            <h4>فواتير شراء متأخرة</h4>
            <p>فواتير الموردين التي تجاوزت تاريخ الاستحقاق وما زال عليها رصيد.</p>
          </div>
          {reports.overduePurchaseInvoices.length === 0 ? (
            <p className="muted">لا توجد فواتير شراء متأخرة حاليًا.</p>
          ) : (
            <ul className="related-list">
              {reports.overduePurchaseInvoices.map((invoice) => (
                <li key={invoice.name}>
                  <Link to={`/purchase-invoices/${encodeURIComponent(invoice.name)}`}>{invoice.name}</Link>
                  <span>{invoice.supplier_name || invoice.supplier || 'بدون مورد'}</span>
                  <span>الاستحقاق: {invoice.due_date ? formatDateTime(invoice.due_date) : 'غير محدد'}</span>
                  <strong>
                    {formatMoney(invoice.outstanding_amount)} {invoice.currency || ''}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-panel">
          <div className="section-heading">
            <h4>أوامر شراء مفتوحة</h4>
            <p>أوامر الشراء المعتمدة التي لم تكتمل في الاستلام أو الفوترة.</p>
          </div>
          {reports.openPurchaseOrders.length === 0 ? (
            <p className="muted">لا توجد أوامر شراء مفتوحة حاليًا.</p>
          ) : (
            <ul className="related-list">
              {reports.openPurchaseOrders.map((order) => (
                <li key={order.name}>
                  <Link to={`/purchase-orders/${encodeURIComponent(order.name)}`}>{order.name}</Link>
                  <span>{order.supplier || 'بدون مورد'}</span>
                  <span>الاستلام: {formatMoney(order.per_received ?? 0)}% | الفوترة: {formatMoney(order.per_billed ?? 0)}%</span>
                  <strong>
                    {formatMoney(order.grand_total)} {order.currency || ''}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="detail-panel report-panel-stock">
        <div className="section-heading">
          <h4>تنبيهات المخزون الناقص</h4>
          <p>الأصناف التي وصلت إلى كمية {lowStockAlertQty} أو أقل في المخازن. هذه مهمة قبل ازدحام البيع أو الطلب من المورد.</p>
        </div>
        {reports.lowStock.length === 0 ? (
          <p className="muted">لا توجد تنبيهات مخزون حاليًا.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table report-stock-table">
              <thead>
                <tr>
                  <th>الصنف</th>
                  <th>المخزن</th>
                  <th>المتوفر</th>
                  <th>المتوقع</th>
                </tr>
              </thead>
              <tbody>
                {reports.lowStock.map((row) => (
                  <tr key={row.name}>
                    <td>
                      <Link className="record-link" to={`/items/${encodeURIComponent(row.item_code)}`}>
                        {row.item_code}
                      </Link>
                    </td>
                    <td>{row.warehouse || '-'}</td>
                    <td>{formatMoney(row.actual_qty)}</td>
                    <td>{formatMoney(row.projected_qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
