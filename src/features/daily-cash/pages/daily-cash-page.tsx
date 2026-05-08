import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ReceiptText,
  Scale,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateInputValue } from '@/shared/utils/date'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { DailyCashMovementsTable } from '../components/daily-cash-movements-table'
import { useDailyCashDefaults, useDailyCashReport } from '../hooks/use-daily-cash'

function todayIsoDate() {
  return formatDateInputValue()
}

export default function DailyCashPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultsQuery = useDailyCashDefaults()
  const date = searchParams.get('date') ?? ''
  const company = searchParams.get('company') ?? ''
  const account = searchParams.get('account') ?? ''
  const defaults = defaultsQuery.data
  const availableAccounts = useMemo(
    () => (defaults?.accounts ?? []).filter((option) => !company || option.company === company),
    [company, defaults?.accounts],
  )
  const selectedCompany = useMemo(
    () => defaults?.companies.find((option) => option.name === company),
    [company, defaults?.companies],
  )

  useEffect(() => {
    if (!defaults) {
      return
    }

    const nextParams = new URLSearchParams(searchParams)
    let changed = false
    const currentCompany = nextParams.get('company')
    const currentDate = nextParams.get('date')
    const currentAccount = nextParams.get('account')
    const fallbackCompany =
      currentCompany && defaults.companies.some((option) => option.name === currentCompany)
        ? currentCompany
        : defaults.companies[0]?.name

    if (fallbackCompany && fallbackCompany !== currentCompany) {
      nextParams.set('company', fallbackCompany)
      changed = true
    }

    const companyAccounts = defaults.accounts.filter((option) => option.company === fallbackCompany)
    const fallbackAccount =
      (currentAccount && companyAccounts.some((option) => option.name === currentAccount) && currentAccount) ||
      (selectedCompany?.default_cash_account && companyAccounts.some((option) => option.name === selectedCompany.default_cash_account)
        ? selectedCompany.default_cash_account
        : undefined) ||
      (selectedCompany?.default_bank_account && companyAccounts.some((option) => option.name === selectedCompany.default_bank_account)
        ? selectedCompany.default_bank_account
        : undefined) ||
      companyAccounts[0]?.name

    if (fallbackAccount && fallbackAccount !== currentAccount) {
      nextParams.set('account', fallbackAccount)
      changed = true
    }

    if (!currentDate) {
      nextParams.set('date', defaults.latestPostingDate ?? todayIsoDate())
      changed = true
    }

    if (changed) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [defaults, searchParams, selectedCompany?.default_bank_account, selectedCompany?.default_cash_account, setSearchParams])

  const reportQuery = useDailyCashReport(
    {
      date,
      company,
      account,
    },
    Boolean(date && company && account),
  )

  const report = reportQuery.data
  const showLoading = defaultsQuery.isLoading || (!date && !defaultsQuery.isError) || reportQuery.isLoading

  if (showLoading) {
    return <Loading />
  }

  if (defaultsQuery.isError) {
    return <ErrorState message={(defaultsQuery.error as Error).message} />
  }

  if (reportQuery.isError) {
    return <ErrorState message={(reportQuery.error as Error).message} />
  }

  if (!report) {
    return null
  }

  const accountCurrency = report.selectedAccount?.account_currency || selectedCompany?.default_currency || ''
  const hasMismatch = Math.abs(report.reconciliationGap) > 0.01

  return (
    <>
      <Breadcrumbs items={[{ label: 'الصندوق اليومي' }]} />
      <PageHeader
        actions={
          <>
            <Link className="button button-secondary" to="/collections/new">
              <Plus size={17} aria-hidden="true" />
              سند قبض
            </Link>
            <Link className="button button-secondary" to="/disbursements/new">
              <Plus size={17} aria-hidden="true" />
              سند صرف
            </Link>
            <Link className="button button-primary" to="/sales-invoices/new">
              <ReceiptText size={17} aria-hidden="true" />
              فاتورة بيع
            </Link>
          </>
        }
        eyebrow="المالية / الصندوق اليومي"
        meta={
          <span>
            آخر مزامنة: {report.lastSyncedAt ? formatDateTime(report.lastSyncedAt) : 'غير متاح'} | الحساب: {report.selectedAccount?.name}
          </span>
        }
        subtitle="قراءة تشغيلية يومية لحركة الصندوق أو البنك من واقع ERPNext: رصيد افتتاحي، دخول، خروج، وتحقيق مطابقة مع دفتر الأستاذ."
        title="الصندوق اليومي"
      />

      <section className="toolbar" aria-label="فلاتر الصندوق اليومي">
        <label className="filter-field">
          <span>التاريخ</span>
          <input
            type="date"
            value={date}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams)
              next.set('date', event.target.value)
              setSearchParams(next, { replace: true })
            }}
          />
        </label>

        <label className="filter-field">
          <span>الشركة</span>
          <select
            value={company}
            onChange={(event) => {
              const nextCompany = event.target.value
              const next = new URLSearchParams(searchParams)
              next.set('company', nextCompany)
              const nextAccounts = (defaults?.accounts ?? []).filter((option) => option.company === nextCompany)
              const nextCompanyDefaults = defaults?.companies.find((option) => option.name === nextCompany)
              const nextAccount =
                (nextCompanyDefaults?.default_cash_account &&
                nextAccounts.some((option) => option.name === nextCompanyDefaults.default_cash_account)
                  ? nextCompanyDefaults.default_cash_account
                  : undefined) ||
                (nextCompanyDefaults?.default_bank_account &&
                nextAccounts.some((option) => option.name === nextCompanyDefaults.default_bank_account)
                  ? nextCompanyDefaults.default_bank_account
                  : undefined) ||
                nextAccounts[0]?.name

              if (nextAccount) {
                next.set('account', nextAccount)
              } else {
                next.delete('account')
              }

              setSearchParams(next, { replace: true })
            }}
          >
            {(defaults?.companies ?? []).map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>الحساب</span>
          <select
            value={account}
            onChange={(event) => {
              const next = new URLSearchParams(searchParams)
              next.set('account', event.target.value)
              setSearchParams(next, { replace: true })
            }}
          >
            {availableAccounts.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="detail-summary">
        <div className="summary-main">
          <div className="summary-icon">
            <Wallet size={26} aria-hidden="true" />
          </div>
          <div>
            <h3>{report.selectedAccount?.name}</h3>
            <p>
              {report.selectedAccount?.account_type === 'Bank' ? 'حساب بنكي' : 'صندوق نقدي'} | العملة: {accountCurrency || 'غير محددة'}
            </p>
          </div>
        </div>
        <div className="summary-badges">
          <Badge tone="neutral">{selectedCompany?.name}</Badge>
          <Badge tone={hasMismatch ? 'amber' : 'green'}>{hasMismatch ? 'بحاجة مراجعة' : 'مطابق محاسبيًا'}</Badge>
        </div>
      </section>

      {hasMismatch ? (
        <div className="inline-alert inline-alert-warning" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>
            يوجد فرق بين حركة المستندات والرصيد الدفتري مقداره {formatMoney(report.reconciliationGap)} {accountCurrency}. راجع القيود أو الحركات غير
            المباشرة على الحساب.
          </span>
        </div>
      ) : null}

      <section className="metrics-grid" aria-label="ملخص الصندوق اليومي">
        <MetricCard
          detail={`قبل ${date}`}
          icon={Wallet}
          label="الرصيد الافتتاحي"
          tone="blue"
          value={`${formatMoney(report.openingBalance)} ${accountCurrency}`}
        />
        <MetricCard
          detail="تحصيلات + بيع نقدي + تحويلات واردة"
          icon={ArrowDownLeft}
          label="الدخول"
          tone="green"
          value={`${formatMoney(report.incomingTotal)} ${accountCurrency}`}
        />
        <MetricCard
          detail="صرف موردين + استرداد عملاء + تحويلات صادرة"
          icon={ArrowUpRight}
          label="الخروج"
          tone="red"
          value={`${formatMoney(report.outgoingTotal)} ${accountCurrency}`}
        />
        <MetricCard
          detail="الرصيد المتوقع من حركة المستندات"
          icon={ReceiptText}
          label="إقفال متوقع"
          tone="amber"
          value={`${formatMoney(report.expectedClosingBalance)} ${accountCurrency}`}
        />
        <MetricCard
          detail="الرصيد الفعلي في GL"
          icon={Scale}
          label="إقفال دفتري"
          tone={hasMismatch ? 'red' : 'blue'}
          value={`${formatMoney(report.ledgerClosingBalance)} ${accountCurrency}`}
        />
      </section>

      <section className="metrics-grid" aria-label="تفصيل الحركة اليومية">
        <MetricCard detail={`عدد السندات: ${report.collectionsCount}`} icon={ArrowDownLeft} label="التحصيلات" tone="green" value={formatMoney(report.collectionsTotal)} />
        <MetricCard detail={`عدد السندات: ${report.disbursementsCount}`} icon={ArrowUpRight} label="المدفوعات" tone="red" value={formatMoney(report.disbursementsTotal)} />
        <MetricCard detail={`عدد سندات الاسترداد: ${report.customerRefundsCount}`} icon={ArrowUpRight} label="استرداد العملاء" tone="red" value={formatMoney(report.customerRefundsTotal)} />
        <MetricCard detail={`عدد الفواتير: ${report.posSalesCount}`} icon={ReceiptText} label="البيع النقدي" tone="blue" value={formatMoney(report.posSalesTotal)} />
        <MetricCard detail={`عدد التحويلات: ${report.transfersCount}`} icon={Scale} label="التحويلات" tone="amber" value={formatMoney(report.transferInTotal - report.transferOutTotal)} />
      </section>

      <div className="detail-layout">
        <section className="detail-panel">
          <div className="section-heading">
            <h4>الحركات المؤثرة على الرصيد</h4>
            <p>هذه الحركة مبنية على المستندات التشغيلية نفسها، وتوضح ما دخل الحساب وما خرج منه خلال اليوم المحدد.</p>
          </div>
          {report.movements.length > 0 ? (
            <DailyCashMovementsTable rows={report.movements} />
          ) : (
            <EmptyState message="جرّب تغيير التاريخ أو الحساب، أو ابدأ بسند قبض أو صرف أو فاتورة بيع." title="لا توجد حركة مؤثرة على هذا الحساب في اليوم المحدد." />
          )}
        </section>

        <section className="detail-panel">
          <div className="section-heading">
            <h4>قراءة سريعة</h4>
            <p>ملخص مباشر يساعد صاحب المحل أو المحاسب على فهم اليوم بدون الدخول إلى تفاصيل كل مستند.</p>
          </div>
          <ul className="related-list">
            <li>
              <strong>صافي حركة اليوم</strong>
              <span>
                {formatMoney(report.netMovement)} {accountCurrency}
              </span>
            </li>
            <li>
              <strong>الأثر الدفتري لليوم</strong>
              <span>
                {formatMoney(report.ledgerNetMovement)} {accountCurrency}
              </span>
            </li>
            <li>
              <strong>تحويلات واردة</strong>
              <span>
                {formatMoney(report.transferInTotal)} {accountCurrency}
              </span>
            </li>
            <li>
              <strong>تحويلات صادرة</strong>
              <span>
                {formatMoney(report.transferOutTotal)} {accountCurrency}
              </span>
            </li>
            <li>
              <strong>فرق المطابقة</strong>
              <span>
                {formatMoney(report.reconciliationGap)} {accountCurrency}
              </span>
            </li>
          </ul>
        </section>
      </div>

      <section className="related-section">
        <div className="section-heading">
          <h4>التحويلات الداخلية</h4>
          <p>هذه الحركة لا تمثل بيعًا أو قبضًا من عميل، لكنها تؤثر على الحساب الحالي عند النقل منه أو إليه.</p>
        </div>
        {report.transfers.length === 0 ? (
          <div className="inline-alert inline-alert-warning" role="status">
            <span>لا توجد تحويلات داخلية على هذا الحساب في اليوم المحدد.</span>
          </div>
        ) : (
          <ul className="related-list">
            {report.transfers.map((movement) => (
              <li key={movement.id}>
                <strong>{movement.reference}</strong>
                <span>
                  {movement.label} | {movement.counterAccount || 'بدون حساب مقابل'}
                </span>
                <span>{formatDateTime(movement.postingDate)}</span>
                <strong>
                  {movement.netAmount >= 0 ? '+' : '-'}
                  {formatMoney(Math.abs(movement.amount))} {movement.currency || accountCurrency}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
