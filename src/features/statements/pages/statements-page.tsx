import { AlertTriangle, ArrowDownLeft, ArrowUpRight, FileText, Printer, ReceiptText, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { DataTable, type DataColumn } from '@/shared/ui/data-table'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { formatDateInputValue } from '@/shared/utils/date'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { useStatement, useStatementCompanies } from '../hooks/use-statement'
import type { StatementCurrencySummary, StatementPartyType, StatementRow } from '../types/statement.types'

function monthStartValue() {
  const now = new Date()
  return formatDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
}

function resolvePartyType(value: string | null): StatementPartyType {
  return value === 'Supplier' ? 'Supplier' : 'Customer'
}

function partyLabel(partyType: StatementPartyType) {
  return partyType === 'Customer' ? 'عميل' : 'مورد'
}

function doctypeForParty(partyType: StatementPartyType) {
  return partyType === 'Customer' ? 'Customer' : 'Supplier'
}

function balanceLabel(partyType: StatementPartyType) {
  return partyType === 'Customer' ? 'الرصيد على العميل' : 'الرصيد للمورد'
}

function formatSummaryAmounts(summaries: StatementCurrencySummary[], selector: (row: StatementCurrencySummary) => number) {
  const values = summaries.filter((row) => Math.abs(selector(row)) > 0.0001)

  if (values.length === 0) {
    return '0.00'
  }

  return values.map((row) => `${formatMoney(selector(row))} ${row.currency}`).join(' | ')
}

function amountClass(value: number) {
  if (value > 0) {
    return 'amount-positive'
  }

  if (value < 0) {
    return 'amount-negative'
  }

  return undefined
}

function voucherPath(row: StatementRow, partyType: StatementPartyType) {
  if (!row.voucherNo) {
    return undefined
  }

  if (row.voucherType === 'Sales Invoice') {
    return `/sales-invoices/${encodeURIComponent(row.voucherNo)}`
  }

  if (row.voucherType === 'Purchase Invoice') {
    return `/purchase-invoices/${encodeURIComponent(row.voucherNo)}`
  }

  if (row.voucherType === 'Payment Entry') {
    return `/${partyType === 'Customer' ? 'collections' : 'disbursements'}/${encodeURIComponent(row.voucherNo)}`
  }

  if (row.voucherType === 'Stock Entry') {
    return `/stock/${encodeURIComponent(row.voucherNo)}`
  }

  return undefined
}

function StatementRowsTable({ rows, partyType }: { rows: StatementRow[]; partyType: StatementPartyType }) {
  const columns: Array<DataColumn<StatementRow>> = [
    {
      key: 'date',
      header: 'التاريخ',
      render: (row) => row.postingDate || '-',
      sortValue: (row) => row.postingDate,
    },
    {
      key: 'voucher',
      header: 'المستند',
      render: (row) => {
        const path = voucherPath(row, partyType)
        return (
          <div className="cell-stack">
            {path ? (
              <Link className="record-link" to={path}>
                {row.voucherNo}
              </Link>
            ) : (
              <strong>{row.voucherNo || '-'}</strong>
            )}
            <span>{row.voucherType || '-'}</span>
          </div>
        )
      },
      sortValue: (row) => row.voucherNo,
    },
    {
      key: 'account',
      header: 'الحساب',
      render: (row) => (
        <div className="cell-stack">
          <strong>{row.account || '-'}</strong>
          <span>{row.against || row.remarks || '-'}</span>
        </div>
      ),
      sortValue: (row) => row.account,
    },
    {
      key: 'debit',
      header: 'مدين',
      render: (row) => (
        <strong>
          {formatMoney(row.debit)} {row.currency}
        </strong>
      ),
      sortValue: (row) => row.debit,
    },
    {
      key: 'credit',
      header: 'دائن',
      render: (row) => (
        <strong>
          {formatMoney(row.credit)} {row.currency}
        </strong>
      ),
      sortValue: (row) => row.credit,
    },
    {
      key: 'balance',
      header: 'الرصيد',
      render: (row) => (
        <strong className={amountClass(row.runningBalance)}>
          {formatMoney(row.runningBalance)} {row.currency}
        </strong>
      ),
      sortValue: (row) => row.runningBalance,
    },
  ]

  return <DataTable columns={columns} data={rows} getRowKey={(row) => row.id} />
}

export default function StatementsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const partyType = resolvePartyType(searchParams.get('partyType'))
  const party = searchParams.get('party') ?? ''
  const company = searchParams.get('company') ?? 'all'
  const fromDate = searchParams.get('from') ?? monthStartValue()
  const toDate = searchParams.get('to') ?? formatDateInputValue()
  const companiesQuery = useStatementCompanies()
  const filters = useMemo(
    () => ({
      partyType,
      party,
      company,
      fromDate,
      toDate,
    }),
    [company, fromDate, party, partyType, toDate],
  )
  const statementQuery = useStatement(filters, Boolean(party.trim()))
  const statement = statementQuery.data
  const summaries = statement?.summaries ?? []

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)

    if (value) {
      next.set(key, value)
    } else {
      next.delete(key)
    }

    setSearchParams(next, { replace: true })
  }

  function handlePartyTypeChange(value: StatementPartyType) {
    const next = new URLSearchParams(searchParams)
    next.set('partyType', value)
    next.delete('party')
    setSearchParams(next, { replace: true })
  }

  const totalDocuments = statement?.outstandingDocuments.length ?? 0
  const hasReverseBalance = summaries.some((row) => row.closingBalance < 0)

  return (
    <>
      <Breadcrumbs items={[{ label: 'كشوف الحساب' }]} />
      <PageHeader
        actions={
          <>
            <button className="button button-secondary" disabled={!statement} type="button" onClick={() => window.print()}>
              <Printer size={17} aria-hidden="true" />
              طباعة
            </button>
            <Link className="button button-primary" to={partyType === 'Customer' ? '/collections/new' : '/disbursements/new'}>
              <ReceiptText size={17} aria-hidden="true" />
              {partyType === 'Customer' ? 'سند قبض' : 'سند صرف'}
            </Link>
          </>
        }
        eyebrow="المالية / كشف حساب"
        meta={statement ? <span>آخر مزامنة: {formatDateTime(statement.lastSyncedAt)}</span> : undefined}
        subtitle="شاشة تجمع الحركة المحاسبية من دفتر الأستاذ في ERPNext، وتعرض الرصيد حسب العملة بدون فصل الديون عن مصدرها الحقيقي."
        title="كشف حساب عميل أو مورد"
      />

      <section className="toolbar statement-toolbar" aria-label="فلاتر كشف الحساب">
        <label className="filter-field">
          <span>النوع</span>
          <select value={partyType} onChange={(event) => handlePartyTypeChange(event.target.value as StatementPartyType)}>
            <option value="Customer">عميل</option>
            <option value="Supplier">مورد</option>
          </select>
        </label>

        <label className="filter-field statement-party-field">
          <span>{partyLabel(partyType)}</span>
          <LinkDatalistInput
            key={`${partyType}-${party}`}
            doctype={doctypeForParty(partyType)}
            listId="statement-party-options"
            defaultValue={party}
            placeholder={`اختر ${partyLabel(partyType)}`}
            onChange={(event) => setParam('party', event.target.value)}
          />
        </label>

        <label className="filter-field">
          <span>الشركة</span>
          <select value={company} onChange={(event) => setParam('company', event.target.value)}>
            <option value="all">كل الشركات</option>
            {(companiesQuery.data ?? []).map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>من</span>
          <input type="date" value={fromDate} onChange={(event) => setParam('from', event.target.value)} />
        </label>

        <label className="filter-field">
          <span>إلى</span>
          <input type="date" value={toDate} onChange={(event) => setParam('to', event.target.value)} />
        </label>
      </section>

      {!party.trim() ? (
        <EmptyState title="اختر عميلًا أو موردًا لعرض كشف الحساب." message="ابدأ بكتابة الاسم، ثم اختر الفترة والشركة. البيانات ستأتي من ERPNext مباشرة." />
      ) : null}

      {statementQuery.isLoading ? <Loading /> : null}
      {statementQuery.isError ? <ErrorState message={(statementQuery.error as Error).message} /> : null}

      {statement ? (
        <>
          {hasReverseBalance ? (
            <div className="inline-alert inline-alert-warning" role="status">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>يوجد رصيد عكسي في إحدى العملات. هذا قد يعني دفعة زائدة أو تسوية تحتاج مراجعة من المحاسب.</span>
            </div>
          ) : null}

          <section className="metrics-grid" aria-label="ملخص كشف الحساب">
            <MetricCard detail="قبل بداية الفترة" icon={Wallet} label="الرصيد الافتتاحي" value={formatSummaryAmounts(summaries, (row) => row.openingBalance)} />
            <MetricCard detail="حركة مدين" icon={ArrowDownLeft} label="إجمالي المدين" tone="blue" value={formatSummaryAmounts(summaries, (row) => row.debit)} />
            <MetricCard detail="حركة دائن" icon={ArrowUpRight} label="إجمالي الدائن" tone="green" value={formatSummaryAmounts(summaries, (row) => row.credit)} />
            <MetricCard detail={balanceLabel(partyType)} icon={FileText} label="الرصيد الختامي" tone={hasReverseBalance ? 'amber' : 'red'} value={formatSummaryAmounts(summaries, (row) => row.closingBalance)} />
          </section>

          <div className="detail-layout">
            <section className="detail-panel">
              <div className="section-heading">
                <h4>ملخص العملات</h4>
                <p>كل عملة تظهر مستقلة حتى لا تختلط ديون الريال اليمني بالسعودي أو الدولار.</p>
              </div>
              {summaries.length === 0 ? (
                <p className="muted">لا توجد حركة أو رصيد افتتاحي في الفترة المحددة.</p>
              ) : (
                <ul className="related-list statement-summary-list">
                  {summaries.map((row) => (
                    <li key={row.currency}>
                      <strong>{row.currency}</strong>
                      <span>افتتاحي: {formatMoney(row.openingBalance)}</span>
                      <span>الحركة: {row.entries}</span>
                      <strong className={amountClass(row.closingBalance)}>{formatMoney(row.closingBalance)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="detail-panel">
              <div className="section-heading">
                <h4>المستندات المفتوحة</h4>
                <p>فواتير معتمدة ما زال عليها رصيد، وهي أساس التحصيل أو السداد القادم.</p>
              </div>
              {totalDocuments === 0 ? (
                <p className="muted">لا توجد فواتير مفتوحة لهذا الطرف.</p>
              ) : (
                <ul className="related-list">
                  {statement.outstandingDocuments.map((document) => (
                    <li key={document.name}>
                      <Link
                        to={`/${partyType === 'Customer' ? 'sales-invoices' : 'purchase-invoices'}/${encodeURIComponent(document.name)}`}
                      >
                        {document.name}
                      </Link>
                      <span>الاستحقاق: {document.due_date || '-'}</span>
                      <span>{document.status || '-'}</span>
                      <strong>
                        {formatMoney(document.outstanding_amount)} {document.currency || ''}
                      </strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="detail-panel statement-print-area">
            <div className="section-heading split">
              <div>
                <p className="eyebrow">دفتر الأستاذ / ERPNext</p>
                <h4>حركة الحساب</h4>
              </div>
              <Badge tone="neutral">
                {statement.rows.length} حركة | {fromDate} إلى {toDate}
              </Badge>
            </div>
            {statement.rows.length === 0 ? (
              <EmptyState title="لا توجد حركة في الفترة المحددة." message="قد يكون هناك رصيد افتتاحي فقط أو لم يتم اعتماد مستندات لهذا الطرف بعد." />
            ) : (
              <StatementRowsTable rows={statement.rows} partyType={partyType} />
            )}
          </section>
        </>
      ) : null}
    </>
  )
}
