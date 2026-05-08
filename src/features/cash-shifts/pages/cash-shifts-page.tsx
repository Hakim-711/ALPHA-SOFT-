import {
  Banknote,
  CheckCircle2,
  Clock3,
  Coins,
  DoorOpen,
  LockKeyhole,
  MinusCircle,
  PlusCircle,
  RefreshCw,
  Scale,
  ScanBarcode,
} from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import { Badge } from '@/shared/ui/badge'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { EmptyState } from '@/shared/ui/empty-state'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { MetricCard } from '@/shared/ui/metric-card'
import { PageHeader } from '@/shared/ui/page-header'
import { displayErpLabel } from '@/shared/utils/erp-labels'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import {
  useActiveCashShift,
  useCashShiftDefaults,
  useCashShiftSummary,
  useCashShifts,
  useCloseCashShift,
  useOpenCashShift,
} from '../hooks/use-cash-shifts'
import type { CashShiftPaymentRow } from '../types/cash-shift.types'

function normalizeMoney(value: string) {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
}

function differenceTone(value: number) {
  if (Math.abs(value) < 0.01) {
    return 'green' as const
  }

  return value > 0 ? ('blue' as const) : ('red' as const)
}

export default function CashShiftsPage() {
  const auth = useAuth()
  const defaultsQuery = useCashShiftDefaults()
  const shiftsQuery = useCashShifts({ limit: 12 })
  const openingPermissions = useDoctypePermissions('POS Opening Entry')
  const closingPermissions = useDoctypePermissions('POS Closing Entry')
  const openMutation = useOpenCashShift()
  const closeMutation = useCloseCashShift()
  const defaults = defaultsQuery.data
  const currentUser = auth.user?.name ?? auth.user?.email ?? ''
  const [selectedProfile, setSelectedProfile] = useState('')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [openingRows, setOpeningRows] = useState<Array<{ mode_of_payment: string; opening_amount: number }>>([])
  const [countedRows, setCountedRows] = useState<Array<{ mode_of_payment: string; counted_amount: number }>>([])
  const [closingNotes, setClosingNotes] = useState('')
  const effectiveProfile = useMemo(
    () => defaults?.profiles.find((profile) => profile.name === selectedProfile) ?? defaults?.profiles[0],
    [defaults?.profiles, selectedProfile],
  )
  const effectiveCompany = selectedCompany || effectiveProfile?.company || defaults?.companies[0]?.name || ''
  const defaultOpeningRows = useMemo(
    () =>
      (defaults?.paymentModes ?? []).slice(0, 4).map((mode) => ({
        mode_of_payment: mode.name,
        opening_amount: 0,
      })),
    [defaults?.paymentModes],
  )
  const effectiveOpeningRows = openingRows.length > 0 ? openingRows : defaultOpeningRows
  const activeShiftQuery = useActiveCashShift(effectiveProfile?.name, currentUser, Boolean(defaults && currentUser))
  const activeShift = activeShiftQuery.data
  const summaryQuery = useCashShiftSummary(activeShift)
  const summary = summaryQuery.data
  const fallbackClosingRows = useMemo<CashShiftPaymentRow[]>(
    () =>
      activeShift && summary && summary.paymentRows.length === 0
        ? (defaults?.paymentModes ?? []).slice(0, 4).map((mode) => ({
            mode_of_payment: mode.name,
            opening_amount: 0,
            sales_amount: 0,
            collection_amount: 0,
            disbursement_amount: 0,
            customer_refund_amount: 0,
            expected_amount: 0,
            counted_amount: 0,
            difference_amount: 0,
          }))
        : [],
    [activeShift, defaults?.paymentModes, summary],
  )
  const effectiveSummaryRows = summary?.paymentRows.length ? summary.paymentRows : fallbackClosingRows
  const rowsWithDifferences = useMemo<CashShiftPaymentRow[]>(() => {
    const countedByMode = new Map(countedRows.map((row) => [row.mode_of_payment, row.counted_amount]))

    return effectiveSummaryRows.map((row) => {
      const countedAmount = countedByMode.get(row.mode_of_payment) ?? row.expected_amount

      return {
        ...row,
        counted_amount: countedAmount,
        difference_amount: countedAmount - row.expected_amount,
      }
    })
  }, [countedRows, effectiveSummaryRows])
  const totalDifference = rowsWithDifferences.reduce((sum, row) => sum + row.difference_amount, 0)
  const canOpenShift = canUsePermission(openingPermissions.canCreate) && canUsePermission(openingPermissions.canSubmit)
  const canCloseShift = canUsePermission(closingPermissions.canCreate) && canUsePermission(closingPermissions.canSubmit)
  const openBlockers = [
    canOpenShift ? undefined : 'صلاحية إنشاء واعتماد POS Opening Entry غير متوفرة.',
    selectedProfile || effectiveProfile?.name ? undefined : 'لا يوجد POS Profile مفعل من ERPNext.',
    effectiveCompany ? undefined : 'لا توجد شركة مرتبطة بالوردية.',
    currentUser ? undefined : 'لا يوجد مستخدم كاشير معروف في الجلسة.',
    effectiveOpeningRows.length > 0 ? undefined : 'لا توجد طرق دفع مفعلة لفتح رصيد الصندوق.',
  ].filter((message): message is string => Boolean(message))
  const closeBlockers = [
    canCloseShift ? undefined : 'صلاحية إنشاء واعتماد POS Closing Entry غير متوفرة.',
    summary ? undefined : 'لم يكتمل تحميل ملخص الوردية.',
    rowsWithDifferences.length > 0 ? undefined : 'لا توجد طرق دفع أو صفوف جرد لإغلاق الوردية.',
  ].filter((message): message is string => Boolean(message))

  function updateOpeningAmount(mode: string, value: string) {
    setOpeningRows((current) =>
      (current.length > 0 ? current : defaultOpeningRows).map((row) =>
        row.mode_of_payment === mode
          ? {
              ...row,
              opening_amount: normalizeMoney(value),
            }
          : row,
      ),
    )
  }

  function updateCountedAmount(mode: string, value: string) {
    setCountedRows((current) =>
      (current.length > 0
        ? current
        : (summary?.paymentRows ?? []).map((row) => ({
            mode_of_payment: row.mode_of_payment,
            counted_amount: row.expected_amount,
          }))).map((row) =>
        row.mode_of_payment === mode
          ? {
              ...row,
              counted_amount: normalizeMoney(value),
            }
          : row,
      ),
    )
  }

  async function handleOpenShift(event: FormEvent) {
    event.preventDefault()

    await openMutation.mutateAsync({
      pos_profile: selectedProfile || effectiveProfile?.name || '',
      company: effectiveCompany,
      cashier: currentUser,
      openingRows: effectiveOpeningRows,
    })
  }

  async function handleCloseShift(event: FormEvent) {
    event.preventDefault()

    if (!activeShift || !summary) {
      return
    }

    await closeMutation.mutateAsync({
      shift: activeShift,
      summary: {
        ...summary,
        paymentRows: effectiveSummaryRows,
      },
      countedRows:
        countedRows.length > 0
          ? countedRows
          : effectiveSummaryRows.map((row) => ({
              mode_of_payment: row.mode_of_payment,
              counted_amount: row.expected_amount,
            })),
      notes: closingNotes,
    })

    setClosingNotes('')
  }

  if (defaultsQuery.isLoading || shiftsQuery.isLoading || activeShiftQuery.isLoading || openingPermissions.isLoading || closingPermissions.isLoading) {
    return <Loading />
  }

  if (defaultsQuery.isError) {
    return <ErrorState message={(defaultsQuery.error as Error).message} />
  }

  if (activeShiftQuery.isError) {
    return (
      <ErrorState
        message={`تعذر قراءة ورديات نقطة البيع من ERPNext. تأكد من صلاحيات وردية الافتتاح وإغلاق الوردية. التفاصيل: ${(activeShiftQuery.error as Error).message}`}
      />
    )
  }

  const recentRows = shiftsQuery.data?.rows ?? []

  return (
    <>
      <Breadcrumbs items={[{ label: 'ورديات الكاشير' }]} />
      <PageHeader
        actions={
          <Link className="button button-primary" to="/pos">
            <ScanBarcode size={17} aria-hidden="true" />
            فتح شاشة الكاشير
          </Link>
        }
        eyebrow="المالية / ورديات نقطة البيع"
        meta={<span>الكاشير الحالي: {currentUser ? displayErpLabel(currentUser) : 'غير معروف'} | آخر مزامنة: {summary?.lastSyncedAt ? formatDateTime(summary.lastSyncedAt) : 'بانتظار الوردية'}</span>}
        subtitle="فتح وإغلاق وردية الكاشير فوق مستندات الوردية الرسمية في ERPNext، مع جرد فعلي ومقارنة بين المتوقع والمعدود."
        title="ورديات الكاشير وإغلاق الصندوق"
      />

      <section className="metrics-grid" aria-label="ملخص الوردية">
        <MetricCard
          detail={activeShift ? activeShift.name : 'لا توجد وردية مفتوحة'}
          icon={activeShift ? DoorOpen : LockKeyhole}
          label="حالة الوردية"
          tone={activeShift ? 'green' : 'amber'}
          value={activeShift ? 'مفتوحة' : 'مغلقة'}
        />
        <MetricCard
          detail="رصيد بداية الوردية"
          icon={Banknote}
          label="الافتتاحي"
          tone="blue"
          value={formatMoney(summary?.openingTotal ?? 0)}
        />
        <MetricCard
          detail={`${summary?.invoicesCount ?? 0} فاتورة كاشير`}
          icon={PlusCircle}
          label="مبيعات الوردية"
          tone="green"
          value={formatMoney(summary?.salesTotal ?? 0)}
        />
        <MetricCard
          detail={`${summary?.returnsCount ?? 0} مرتجع مسجل`}
          icon={RefreshCw}
          label="مرتجعات الوردية"
          tone="amber"
          value={formatMoney(summary?.returnsTotal ?? 0)}
        />
        <MetricCard
          detail={`${summary?.disbursementsCount ?? 0} سند صرف`}
          icon={MinusCircle}
          label="المصروفات"
          tone="red"
          value={formatMoney(summary?.disbursementsTotal ?? 0)}
        />
        <MetricCard
          detail={`${summary?.customerRefundsCount ?? 0} سند استرداد`}
          icon={MinusCircle}
          label="استرداد العملاء"
          tone="red"
          value={formatMoney(summary?.customerRefundsTotal ?? 0)}
        />
      </section>

      {activeShift ? (
        <form className="cash-shift-grid" onSubmit={handleCloseShift}>
          <section className="form-layout cash-shift-panel">
            <div className="form-header">
              <div>
                <p className="eyebrow">وردية مفتوحة</p>
                <h3>إغلاق الصندوق بعد الجرد</h3>
                <p>أدخل المبالغ الفعلية الموجودة في الدرج أو الصراف، وسيظهر الفرق مباشرة قبل الإغلاق.</p>
              </div>
              <Badge tone="green">مفتوحة</Badge>
            </div>

            {summaryQuery.isLoading ? <Loading /> : null}
            {summaryQuery.isError ? <ErrorState message={(summaryQuery.error as Error).message} /> : null}

            {!summaryQuery.isLoading && summary ? (
              <>
                <div className="cash-shift-summary-line">
                  <div>
                    <span>بدأت الوردية</span>
                    <strong>{formatDateTime(activeShift.period_start_date ?? activeShift.creation)}</strong>
                  </div>
                  <div>
                    <span>ملف نقطة البيع</span>
                    <strong>{displayErpLabel(activeShift.pos_profile)}</strong>
                  </div>
                  <div>
                    <span>الشركة</span>
                    <strong>{displayErpLabel(activeShift.company)}</strong>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>طريقة الدفع</th>
                        <th>افتتاحي</th>
                        <th>مبيعات</th>
                        <th>قبض</th>
                        <th>صرف</th>
                        <th>استرداد عملاء</th>
                        <th>المتوقع</th>
                        <th>المعدود فعليا</th>
                        <th>الفرق</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsWithDifferences.map((row) => (
                        <tr key={row.mode_of_payment}>
                          <td>{displayErpLabel(row.mode_of_payment)}</td>
                          <td>{formatMoney(row.opening_amount)}</td>
                          <td>{formatMoney(row.sales_amount)}</td>
                          <td>{formatMoney(row.collection_amount)}</td>
                          <td>{formatMoney(row.disbursement_amount)}</td>
                          <td>{formatMoney(row.customer_refund_amount)}</td>
                          <td>{formatMoney(row.expected_amount)}</td>
                          <td>
                            <input
                              className="table-input"
                              min="0"
                              step="0.01"
                              type="number"
                              value={row.counted_amount}
                              onChange={(event) => updateCountedAmount(row.mode_of_payment, event.target.value)}
                            />
                          </td>
                          <td>
                            <Badge tone={differenceTone(row.difference_amount)}>{formatMoney(row.difference_amount)}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <label className="field">
                  <span>ملاحظة الإغلاق</span>
                  <textarea
                    placeholder="مثال: يوجد فرق بسبب صرف يدوي أو تحويل صراف لم يتم تسجيله."
                    rows={3}
                    value={closingNotes}
                    onChange={(event) => setClosingNotes(event.target.value)}
                  />
                </label>

                <div className="cash-shift-close-bar">
                  <div>
                    <span>إجمالي الفرق</span>
                    <strong className={Math.abs(totalDifference) < 0.01 ? 'amount-positive' : 'amount-danger'}>{formatMoney(totalDifference)}</strong>
                  </div>
                  <button className="button button-primary" disabled={closeMutation.isPending || closeBlockers.length > 0} type="submit">
                    <CheckCircle2 size={17} aria-hidden="true" />
                    {closeMutation.isPending ? 'جاري إغلاق الوردية' : 'إغلاق الوردية'}
                  </button>
                </div>

                {closeBlockers.length > 0 ? (
                  <div className="inline-alert inline-alert-warning" role="status">
                    <span>لا يمكن إغلاق الوردية الآن: {closeBlockers.join(' ')}</span>
                  </div>
                ) : null}

                {closeMutation.isError ? (
                  <div className="inline-alert inline-alert-danger" role="alert">
                    <span>{(closeMutation.error as Error).message}</span>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>

          <section className="cash-shift-panel cash-shift-guide">
            <Clock3 size={24} aria-hidden="true" />
            <h3>قاعدة التشغيل</h3>
            <p>لا يبدأ الكاشير البيع اليومي إلا بعد فتح وردية. نهاية اليوم لا تعتمد على التخمين: النظام يحسب المتوقع، والكاشير يدخل المعدود، والمدير يرى الفرق.</p>
            <ul>
              <li>الفرق صفر يعني الصندوق مطابق.</li>
              <li>فرق موجب يعني زيادة نقدية.</li>
              <li>فرق سالب يعني عجز يحتاج مراجعة.</li>
            </ul>
          </section>
        </form>
      ) : (
        <form className="form-layout cash-shift-panel" onSubmit={handleOpenShift}>
          <div className="form-header">
            <div>
              <p className="eyebrow">فتح وردية</p>
              <h3>ابدأ صندوق الكاشير</h3>
              <p>اختر ملف نقطة البيع والشركة، ثم أدخل الرصيد الافتتاحي الموجود فعليا قبل أول عملية بيع.</p>
            </div>
            <Badge tone="amber">بانتظار الفتح</Badge>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>ملف نقطة البيع</span>
              <select
                value={selectedProfile || effectiveProfile?.name || ''}
                onChange={(event) => {
                  const nextProfile = event.target.value
                  const profile = defaults?.profiles.find((item) => item.name === nextProfile)
                  setSelectedProfile(nextProfile)
                  setSelectedCompany(profile?.company ?? selectedCompany)
                }}
              >
                {(defaults?.profiles ?? []).map((profile) => (
                  <option key={profile.name} value={profile.name}>
                    {displayErpLabel(profile.name)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>الشركة</span>
              <select value={effectiveCompany} onChange={(event) => setSelectedCompany(event.target.value)}>
                {(defaults?.companies ?? []).map((company) => (
                  <option key={company.name} value={company.name}>
                    {displayErpLabel(company.name)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>الكاشير</span>
              <input readOnly value={displayErpLabel(currentUser)} />
            </label>
          </div>

          <div className="cash-shift-opening-rows">
            {effectiveOpeningRows.map((row) => (
              <label className="field" key={row.mode_of_payment}>
                <span>{displayErpLabel(row.mode_of_payment)}</span>
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  value={row.opening_amount}
                  onChange={(event) => updateOpeningAmount(row.mode_of_payment, event.target.value)}
                />
              </label>
            ))}
          </div>

          <div className="page-actions">
            <button
              className="button button-primary"
              disabled={openMutation.isPending || openBlockers.length > 0}
              type="submit"
            >
              <Coins size={17} aria-hidden="true" />
              {openMutation.isPending ? 'جاري فتح الوردية' : 'فتح الوردية'}
            </button>
          </div>

          {openBlockers.length > 0 ? (
            <div className="inline-alert inline-alert-warning" role="status">
              <span>لا يمكن فتح الوردية الآن: {openBlockers.join(' ')}</span>
            </div>
          ) : null}

          {openMutation.isError ? (
            <div className="inline-alert inline-alert-danger" role="alert">
              <span>{(openMutation.error as Error).message}</span>
            </div>
          ) : null}
        </form>
      )}

      <section className="cash-shift-panel">
        <div className="section-heading split">
          <div>
            <h4>آخر الورديات</h4>
            <p>قراءة مباشرة من ورديات نقطة البيع حتى يعرف المدير آخر ما تم فتحه.</p>
          </div>
          <button
            className="button button-secondary"
            disabled={shiftsQuery.isFetching}
            type="button"
            onClick={() => {
              void shiftsQuery.refetch()
              void activeShiftQuery.refetch()
              void summaryQuery.refetch()
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            تحديث
          </button>
        </div>

        {shiftsQuery.isError ? <ErrorState message={(shiftsQuery.error as Error).message} /> : null}
        {!shiftsQuery.isError && recentRows.length === 0 ? (
          <EmptyState message="افتح أول وردية حتى يبدأ النظام بتسجيل صندوق الكاشير بشكل واضح." title="لا توجد ورديات بعد." />
        ) : null}
        {!shiftsQuery.isError && recentRows.length > 0 ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الوردية</th>
                  <th>الحالة</th>
                  <th>ملف نقطة البيع</th>
                  <th>الكاشير</th>
                  <th>بدأت</th>
                  <th>افتتاحي</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((shift) => (
                  <tr key={shift.name}>
                    <td>{shift.name}</td>
                    <td>
                      <Badge tone={shift.status === 'open' ? 'green' : shift.status === 'closed' ? 'blue' : 'neutral'}>
                        {shift.status === 'open' ? 'مفتوحة' : shift.status === 'closed' ? 'مغلقة' : displayErpLabel(shift.rawStatus ?? shift.status)}
                      </Badge>
                      {shift.closingEntry ? <div className="muted">{shift.closingEntry}</div> : null}
                    </td>
                    <td>{displayErpLabel(shift.pos_profile)}</td>
                    <td>{displayErpLabel(shift.cashier ?? shift.user ?? shift.owner)}</td>
                    <td>{formatDateTime(shift.period_start_date ?? shift.creation)}</td>
                    <td>{formatMoney(shift.openingTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="cash-shift-panel cash-shift-note">
        <Scale size={20} aria-hidden="true" />
        <div>
          <strong>ملاحظة مهمة</strong>
          <span>
            ERPNext هو من يعتمد الوردية. إذا رفض السيرفر الفتح أو الإغلاق، فالسبب غالبا صلاحية ناقصة أو اختلاف إعداد ملف نقطة البيع أو نسخة ERPNext تحتاج إنشاء الوردية من شاشة نقطة البيع الرسمية.
          </span>
        </div>
      </section>
    </>
  )
}
