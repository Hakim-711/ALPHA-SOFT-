import {
  AlertTriangle,
  CircleDollarSign,
  Plus,
  ReceiptText,
  ShoppingCart,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { useDashboard } from '../hooks/use-dashboard'
import type { DashboardCurrencySummary } from '../types/dashboard.types'

function EmptyLine({ text }: { text: string }) {
  return <p className="muted">{text}</p>
}

function CurrencyList({
  rows,
  emptyText,
}: {
  rows: DashboardCurrencySummary[]
  emptyText: string
}) {
  if (rows.length === 0) {
    return <EmptyLine text={emptyText} />
  }

  return (
    <ul className="related-list">
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

export default function DashboardPage() {
  const dashboardQuery = useDashboard()

  if (dashboardQuery.isLoading) {
    return <Loading />
  }

  const dashboard = dashboardQuery.data

  if (!dashboard) {
    return null
  }

  const overdueCustomers = new Set(dashboard.overdueInvoices.map((invoice) => invoice.customer).filter(Boolean)).size
  const recentCollectionsCount = dashboard.recentCollections.length
  const totalOutstandingDocuments = dashboard.outstandingReceivables.reduce((sum, bucket) => sum + bucket.count, 0)

  return (
    <>
      <Breadcrumbs items={[{ label: 'لوحة التحكم' }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/customers/new">
              <Plus size={17} aria-hidden="true" />
              عميل جديد
            </Link>
            <Link className="button button-secondary" to="/daily-cash">
              <Wallet size={17} aria-hidden="true" />
              الصندوق اليومي
            </Link>
            <Link className="button button-primary" to="/sales-orders/new">
              <ShoppingCart size={17} aria-hidden="true" />
              أمر بيع جديد
            </Link>
          </>
        }
        eyebrow="تشغيل يومي"
        meta={<span>آخر مزامنة: {dashboard.lastSyncedAt ? formatDateTime(dashboard.lastSyncedAt) : 'غير متاح'}</span>}
        subtitle="شاشة تشغيلية مبسطة للتاجر، تعرض أهم ما يحتاجه من بيع وذمم وتحصيل فوق بيانات ERPNext الحقيقية."
        title="لوحة التحكم"
      />

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <CircleDollarSign size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{dashboard.isConnected ? 'النظام متصل وبيانات ERPNext متاحة' : 'يوجد انقطاع في الربط مع ERPNext'}</h3>
            <p>
              {dashboard.isConnected
                ? 'هذه الشاشة تركز على الذمم والتحصيلات والمبيعات اليومية بدل عرض تفاصيل تقنية لا يحتاجها التاجر.'
                : 'الواجهة تعمل، لكن بعض البيانات التشغيلية غير متاحة حاليًا بسبب مشكلة في الخدمة الخلفية أو الاتصال.'}
            </p>
          </div>
        </div>
        <div className="summary-badges">
          <Badge tone={dashboard.isConnected ? 'green' : 'red'}>{dashboard.isConnected ? 'متصل' : 'تحقق من الربط'}</Badge>
          <Badge tone="neutral">ERPNext هو المصدر</Badge>
        </div>
      </section>

      {dashboard.errors.length > 0 ? (
        <div className="inline-alert inline-alert-warning" role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{dashboard.errors[0]}</span>
        </div>
      ) : null}

      <section className="metrics-grid" aria-label="مؤشرات اليوم">
        <MetricCard detail="إجمالي العملاء" icon={UsersRound} label="العملاء" tone="blue" value={dashboard.counts.customers ?? '—'} />
        <MetricCard detail="فواتير بذمم مفتوحة" icon={Wallet} label="الذمم المفتوحة" tone="red" value={totalOutstandingDocuments} />
        <MetricCard detail="عملاء لديهم تأخير" icon={AlertTriangle} label="المتأخرون" tone="amber" value={overdueCustomers} />
        <MetricCard detail="آخر التحصيلات المسجلة" icon={ReceiptText} label="التحصيلات" tone="green" value={recentCollectionsCount} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <div className="section-heading">
            <h4>مبيعات اليوم حسب العملة</h4>
            <p>ملخص سريع للفواتير المعتمدة في تاريخ اليوم، مع إظهار كل عملة بشكل مستقل.</p>
          </div>
          <CurrencyList rows={dashboard.todaySales} emptyText="لا توجد مبيعات معتمدة اليوم حتى الآن." />
        </section>

        <section className="detail-panel">
          <div className="section-heading">
            <h4>الذمم المفتوحة حسب العملة</h4>
            <p>هذه الأرقام تساعد التاجر على فهم الدين الحقيقي دون خلط العملات أو إخفاء الفروقات.</p>
          </div>
          <CurrencyList rows={dashboard.outstandingReceivables} emptyText="لا توجد ذمم مفتوحة حاليًا." />
        </section>
      </div>

      <div className="detail-layout">
        <section className="detail-panel">
          <div className="section-heading">
            <h4>الفواتير المتأخرة</h4>
            <p>فواتير معتمدة لها رصيد متبقٍ وتجاوزت تاريخ الاستحقاق.</p>
          </div>
          {dashboard.overdueInvoices.length === 0 ? (
            <EmptyLine text="لا توجد فواتير متأخرة حاليًا." />
          ) : (
            <ul className="related-list">
              {dashboard.overdueInvoices.map((invoice) => (
                <li key={invoice.name}>
                  <strong>{invoice.name}</strong>
                  <span>{invoice.customer || 'بدون عميل'}</span>
                  <span>الاستحقاق: {formatDateTime(invoice.due_date)}</span>
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
            <p>آخر حركات القبض من العملاء، لتسهيل المراجعة اليومية بدون الدخول إلى شاشات محاسبية معقدة.</p>
          </div>
          {dashboard.recentCollections.length === 0 ? (
            <EmptyLine text="لا توجد تحصيلات حديثة معتمدة." />
          ) : (
            <ul className="related-list">
              {dashboard.recentCollections.map((entry) => (
                <li key={entry.name}>
                  <strong>{entry.name}</strong>
                  <span>{entry.party || 'بدون طرف'} | {entry.mode_of_payment || 'طريقة غير محددة'}</span>
                  <span>{formatDateTime(entry.posting_date)}</span>
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
            <h4>أحدث العملاء</h4>
            <p>مرجع سريع للرجوع إلى العملاء النشطين أو مراجعة بياناتهم عند الحاجة.</p>
          </div>
          {dashboard.recentCustomers.length === 0 ? (
            <EmptyLine text="لا توجد بيانات عملاء متاحة حاليًا." />
          ) : (
            <ul className="related-list">
              {dashboard.recentCustomers.map((customer) => (
                <li key={customer.name}>
                  <Link to={`/customers/${encodeURIComponent(customer.name)}`}>{customer.customer_name || customer.name}</Link>
                  <span>{customer.customer_type === 'Company' ? 'شركة' : customer.customer_type === 'Individual' ? 'فرد' : 'عميل'}</span>
                  <strong>{customer.disabled ? 'معطل' : 'نشط'}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="detail-panel">
          <div className="section-heading">
            <h4>الوحدات المالية السريعة</h4>
            <p>روابط مباشرة لأهم الشاشات اليومية التي تربط البيع والتحصيل والصرف على نفس منطق ERPNext.</p>
          </div>
          <ul className="related-list">
            <li>
              <Link to="/daily-cash">الصندوق اليومي</Link>
              <span>افتتاحية، حركة اليوم، وإقفال دفتري متوقع</span>
            </li>
            <li>
              <Link to="/collections">التحصيلات</Link>
              <span>قبض من العملاء وتسوية الذمم</span>
            </li>
            <li>
              <Link to="/disbursements">سندات الصرف</Link>
              <span>دفع الموردين والتحويلات الخارجة</span>
            </li>
          </ul>
        </section>
      </div>
    </>
  )
}
