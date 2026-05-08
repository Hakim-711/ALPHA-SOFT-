import {
  ArrowLeft,
  BadgeCheck,
  CreditCard,
  DoorOpen,
  FileSearch,
  LayoutDashboard,
  ReceiptText,
  RotateCcw,
  ShoppingCart,
} from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useActiveCashShift } from '@/features/cash-shifts/hooks/use-cash-shifts'
import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import { usePosDefaults } from '@/features/pos/hooks/use-pos-defaults'
import { Badge } from '@/shared/ui/badge'
import { ErrorState } from '@/shared/ui/error-state'
import { Loading } from '@/shared/ui/loading'
import { displayErpLabel } from '@/shared/utils/erp-labels'
import { formatDateTime, formatMoney } from '@/shared/utils/format'
import { useCreatePosReturn, usePosReturnSource } from '../hooks/use-pos-return'

function clampReturnQuantity(value: string, max: number) {
  const numberValue = Number(value)

  if (!Number.isFinite(numberValue)) {
    return 0
  }

  return Math.min(max, Math.max(0, Math.round(numberValue * 1000) / 1000))
}

export default function PosReturnsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialInvoiceName = searchParams.get('invoice') ?? ''
  const [invoiceSearch, setInvoiceSearch] = useState(initialInvoiceName)
  const [activeInvoiceName, setActiveInvoiceName] = useState(initialInvoiceName)
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({})
  const [remarks, setRemarks] = useState('')
  const [createdReturnName, setCreatedReturnName] = useState<string | null>(null)
  const [createdRefundName, setCreatedRefundName] = useState<string | null>(null)
  const [refundWarning, setRefundWarning] = useState<string | null>(null)
  const [refundMode, setRefundMode] = useState<'credit_note' | 'cash_refund'>('credit_note')
  const [selectedRefundAccount, setSelectedRefundAccount] = useState('')
  const [selectedRefundPaymentMode, setSelectedRefundPaymentMode] = useState('')
  const auth = useAuth()
  const permissions = useDoctypePermissions('Sales Invoice')
  const paymentPermissions = useDoctypePermissions('Payment Entry')
  const defaultsQuery = usePosDefaults()
  const createReturnMutation = useCreatePosReturn()
  const canCreateReturn =
    canUsePermission(permissions.canRead) &&
    canUsePermission(permissions.canCreate) &&
    canUsePermission(permissions.canSubmit)
  const canCreateRefundPayment =
    canUsePermission(paymentPermissions.canCreate) && canUsePermission(paymentPermissions.canSubmit)
  const sourceQuery = usePosReturnSource(activeInvoiceName)
  const source = sourceQuery.data
  const invoice = source?.invoice
  const profileName = defaultsQuery.data?.profiles[0]?.name ?? ''
  const profile = defaultsQuery.data?.profiles[0]
  const company = invoice?.company ?? profile?.company ?? defaultsQuery.data?.companies[0]?.name ?? ''
  const companyOption = defaultsQuery.data?.companies.find((option) => option.name === company)
  const refundAccounts = useMemo(
    () => defaultsQuery.data?.paymentAccounts.filter((account) => !company || account.company === company) ?? [],
    [company, defaultsQuery.data?.paymentAccounts],
  )
  const refundPaymentModes = defaultsQuery.data?.paymentModes ?? []
  const effectiveRefundAccount =
    selectedRefundAccount ||
    companyOption?.default_cash_account ||
    companyOption?.default_bank_account ||
    refundAccounts[0]?.name ||
    ''
  const effectiveRefundPaymentMode =
    selectedRefundPaymentMode || refundPaymentModes.find((mode) => mode.name === 'Cash')?.name || refundPaymentModes[0]?.name || ''
  const activeShiftQuery = useActiveCashShift(profileName, auth.user?.name ?? auth.user?.email, canCreateReturn && Boolean(profileName))
  const currency = invoice?.currency ?? 'YER'
  const returnableLines = useMemo(() => source?.lines.filter((line) => line.returnable_qty > 0) ?? [], [source?.lines])
  const selectedLines = useMemo(
    () =>
      returnableLines
        .map((line) => ({
          key: line.key,
          return_qty: Math.min(line.returnable_qty, Math.max(0, returnQuantities[line.key] ?? 0)),
          item_name: line.item_name,
          rate: line.rate,
        }))
        .filter((line) => line.return_qty > 0),
    [returnQuantities, returnableLines],
  )
  const selectedAmount = selectedLines.reduce((total, line) => total + line.return_qty * line.rate, 0)
  const canSubmit =
    canCreateReturn &&
    Boolean(activeShiftQuery.data) &&
    selectedLines.length > 0 &&
    (refundMode !== 'cash_refund' || (canCreateRefundPayment && Boolean(effectiveRefundAccount))) &&
    !sourceQuery.isLoading &&
    !createReturnMutation.isPending

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault()
    const cleanInvoiceName = invoiceSearch.trim()

    setCreatedReturnName(null)
    setCreatedRefundName(null)
    setRefundWarning(null)
    setActiveInvoiceName(cleanInvoiceName)
    setSearchParams(cleanInvoiceName ? { invoice: cleanInvoiceName } : {})
  }

  function updateReturnQuantity(lineKey: string, value: string, max: number) {
    setReturnQuantities((current) => ({
      ...current,
      [lineKey]: clampReturnQuantity(value, max),
    }))
  }

  function fillAllReturnable() {
    const nextQuantities = returnableLines.reduce<Record<string, number>>((result, line) => {
      result[line.key] = line.returnable_qty
      return result
    }, {})

    setReturnQuantities(nextQuantities)
  }

  async function handleCreateReturn() {
    if (!source || !activeShiftQuery.data) {
      return
    }

    const result = await createReturnMutation.mutateAsync({
      invoiceName: source.invoice.name,
      lines: selectedLines.map((line) => ({
        key: line.key,
        return_qty: line.return_qty,
      })),
      remarks,
      shiftName: activeShiftQuery.data.name,
      refundMode,
      refundAccount: refundMode === 'cash_refund' ? effectiveRefundAccount : undefined,
      refundPaymentMode: refundMode === 'cash_refund' ? effectiveRefundPaymentMode : undefined,
    })

    setCreatedReturnName(result.submittedReturnInvoice.name)
    setCreatedRefundName(result.refundPayment?.name ?? null)
    setRefundWarning(result.refundError ?? null)
    setReturnQuantities({})
    setRemarks('')
    setActiveInvoiceName(source.invoice.name)
  }

  if (!canCreateReturn && !permissions.isLoading) {
    return <ErrorState message="لا توجد صلاحية لإنشاء واعتماد مرتجع نقطة البيع. تحتاج صلاحية قراءة وإنشاء واعتماد فواتير البيع." />
  }

  return (
    <main className="pos-return-screen" dir="rtl">
      <section className="pos-return-hero">
        <div className="pos-return-title">
          <span className="pos-return-mark" aria-hidden="true">
            <RotateCcw size={26} />
          </span>
          <div>
            <p className="eyebrow">مرتجعات نقطة البيع</p>
            <h1>إرجاع فاتورة كاشير</h1>
            <p>ابحث عن فاتورة معتمدة، اختر الأصناف الراجعة، ثم أنشئ مرتجعًا معتمدًا داخل ERPNext.</p>
          </div>
        </div>
        <div className="pos-return-actions">
          <Link className="button button-secondary" to="/pos">
            <ShoppingCart size={17} aria-hidden="true" />
            الكاشير
          </Link>
          <Link className="button button-secondary" to="/cash-shifts">
            <DoorOpen size={17} aria-hidden="true" />
            الورديات
          </Link>
          <Link className="button button-secondary" to="/dashboard">
            <LayoutDashboard size={17} aria-hidden="true" />
            لوحة التحكم
          </Link>
        </div>
      </section>

      <section className="pos-return-status-strip">
        <div>
          <span>ملف POS</span>
          <strong>{displayErpLabel(profileName) || '-'}</strong>
        </div>
        <div>
          <span>الكاشير</span>
          <strong>{displayErpLabel(auth.user?.fullName || auth.user?.name || auth.user?.email)}</strong>
        </div>
        <div>
          <span>الوردية</span>
          <strong>{activeShiftQuery.data ? displayErpLabel(activeShiftQuery.data.name) : 'لا توجد وردية مفتوحة'}</strong>
        </div>
        <div>
          <span>الصلاحية</span>
          <strong>{canCreateReturn ? 'مسموح' : 'غير مسموح'}</strong>
        </div>
      </section>

      {!profileName && !defaultsQuery.isLoading ? (
        <div className="inline-alert inline-alert-warning" role="status">
          <span>لا يوجد ملف POS مفعل. افتح أو أنشئ POS Profile من ERPNext حتى يتم ربط المرتجعات بالوردية الصحيحة.</span>
        </div>
      ) : null}

      {!activeShiftQuery.data && !activeShiftQuery.isLoading ? (
        <div className="inline-alert inline-alert-warning" role="status">
          <span>لا يمكن تنفيذ مرتجع من الكاشير بدون وردية مفتوحة. افتح الوردية أولًا من شاشة الورديات.</span>
          <Link className="button button-secondary" to="/cash-shifts">
            فتح وردية
          </Link>
        </div>
      ) : null}

      {createdReturnName ? (
        <div className="inline-alert inline-alert-success" role="status">
          <span>
            تم إنشاء واعتماد المرتجع بنجاح: {createdReturnName}
            {createdRefundName ? ` | تم إنشاء سند الاسترداد: ${createdRefundName}` : ''}
          </span>
          <Link className="button button-secondary" to={`/sales-invoices/${encodeURIComponent(createdReturnName)}`}>
            فتح المرتجع
          </Link>
        </div>
      ) : null}

      {refundWarning ? (
        <div className="inline-alert inline-alert-warning" role="alert">
          <span>تم إنشاء المرتجع، لكن تعذر إنشاء سند الاسترداد النقدي: {refundWarning}</span>
        </div>
      ) : null}

      <section className="pos-return-search-panel">
        <form className="pos-return-search" onSubmit={handleSearchSubmit}>
          <label htmlFor="return-invoice-search">رقم فاتورة البيع الأصلية</label>
          <div>
            <input
              id="return-invoice-search"
              autoFocus
              placeholder="مثال: ACC-SINV-2026-00001"
              value={invoiceSearch}
              onChange={(event) => setInvoiceSearch(event.target.value)}
            />
            <button className="button button-primary" type="submit">
              <FileSearch size={17} aria-hidden="true" />
              بحث
            </button>
          </div>
        </form>
      </section>

      {sourceQuery.isLoading || defaultsQuery.isLoading ? <Loading /> : null}
      {sourceQuery.isError ? <ErrorState message={(sourceQuery.error as Error).message} /> : null}
      {activeShiftQuery.isError ? <ErrorState message={(activeShiftQuery.error as Error).message} /> : null}
      {createReturnMutation.isError ? <ErrorState message={(createReturnMutation.error as Error).message} /> : null}

      {source ? (
        <section className="pos-return-workspace">
          <aside className="pos-return-summary">
            <div className="pos-return-summary-card primary">
              <span>قيمة الفاتورة الأصلية</span>
              <strong>
                {formatMoney(invoice?.grand_total)} {currency}
              </strong>
              <small>{invoice?.name}</small>
            </div>
            <div className="pos-return-summary-card">
              <span>قيمة المرتجع المختار</span>
              <strong>
                {formatMoney(selectedAmount)} {currency}
              </strong>
              <small>{selectedLines.length} صنف محدد</small>
            </div>
            <div className="pos-return-info-list">
              <div>
                <span>العميل</span>
                <strong>{invoice?.customer_name || invoice?.customer}</strong>
              </div>
              <div>
                <span>الشركة</span>
                <strong>{displayErpLabel(invoice?.company)}</strong>
              </div>
              <div>
                <span>تاريخ الفاتورة</span>
                <strong>{formatDateTime(invoice?.posting_date)}</strong>
              </div>
              <div>
                <span>مرتجعات سابقة</span>
                <strong>{source.returnInvoices.length}</strong>
              </div>
              <div>
                <span>أثر المخزون</span>
                <strong>{invoice?.update_stock === 1 ? 'يرجع للمخزون' : 'بدون مخزون'}</strong>
              </div>
            </div>
            <div className="pos-return-policy">
              <Badge tone={refundMode === 'cash_refund' ? 'green' : 'blue'}>
                {refundMode === 'cash_refund' ? 'استرداد نقدي' : 'إشعار دائن'}
              </Badge>
              <p>
                {refundMode === 'cash_refund'
                  ? 'سيتم إنشاء مرتجع معتمد ثم سند صرف للعميل من حساب الصندوق المحدد، وسيظهر الصرف في حركة الصندوق والوردية.'
                  : 'سيتم إنشاء مرتجع معتمد فقط ويبقى المبلغ كرصيد أو إشعار دائن على العميل حتى تتم تسويته لاحقًا.'}
              </p>
            </div>
          </aside>

          <section className="pos-return-lines-panel">
            <div className="section-heading split">
              <div>
                <h3>الأصناف القابلة للإرجاع</h3>
                <p>لا يسمح النظام بإرجاع كمية أكبر من الكمية المتبقية بعد المرتجعات السابقة.</p>
              </div>
              <button className="button button-secondary" disabled={returnableLines.length === 0} type="button" onClick={fillAllReturnable}>
                تحديد كل المتاح
              </button>
            </div>

            {returnableLines.length === 0 ? (
              <div className="empty-state compact">
                <ReceiptText size={24} aria-hidden="true" />
                <h4>لا توجد كميات متاحة للإرجاع</h4>
                <p>يبدو أن كل أصناف هذه الفاتورة تم إرجاعها مسبقًا أو أن الفاتورة لا تحتوي على أصناف قابلة للإرجاع.</p>
              </div>
            ) : (
              <div className="pos-return-lines" role="table" aria-label="أصناف المرتجع">
                <div className="pos-return-line header" role="row">
                  <span>الصنف</span>
                  <span>المباع</span>
                  <span>المرتجع سابقًا</span>
                  <span>المتاح</span>
                  <span>كمية المرتجع</span>
                  <span>القيمة</span>
                </div>
                {returnableLines.map((line) => {
                  const quantity = returnQuantities[line.key] ?? 0

                  return (
                    <div className="pos-return-line" key={line.key} role="row">
                      <div>
                        <strong>{line.item_name}</strong>
                        <small>{line.item_code}</small>
                      </div>
                      <span>
                        {formatMoney(line.sold_qty)} {line.uom}
                      </span>
                      <span>
                        {formatMoney(line.already_returned_qty)} {line.uom}
                      </span>
                      <span>
                        {formatMoney(line.returnable_qty)} {line.uom}
                      </span>
                      <input
                        aria-label={`كمية مرتجع ${line.item_name}`}
                        inputMode="decimal"
                        max={line.returnable_qty}
                        min={0}
                        step="0.001"
                        type="number"
                        value={quantity}
                        onChange={(event) => updateReturnQuantity(line.key, event.target.value, line.returnable_qty)}
                      />
                      <strong>
                        {formatMoney(quantity * line.rate)} {currency}
                      </strong>
                    </div>
                  )
                })}
              </div>
            )}

            <section className="pos-return-refund-panel" aria-label="طريقة معالجة قيمة المرتجع">
              <div className="section-heading split">
                <div>
                  <h3>طريقة معالجة المبلغ</h3>
                  <p>اختر هل سيبقى المبلغ رصيدًا على العميل أو سيتم صرفه نقدًا من الصندوق.</p>
                </div>
                <CreditCard size={22} aria-hidden="true" />
              </div>

              <div className="pos-return-refund-options">
                <button
                  className={refundMode === 'credit_note' ? 'pos-return-refund-option active' : 'pos-return-refund-option'}
                  type="button"
                  onClick={() => setRefundMode('credit_note')}
                >
                  <strong>إشعار دائن</strong>
                  <span>لا يوجد خروج نقدي الآن، ويبقى الرصيد على العميل.</span>
                </button>
                <button
                  className={refundMode === 'cash_refund' ? 'pos-return-refund-option active' : 'pos-return-refund-option'}
                  disabled={!canCreateRefundPayment}
                  type="button"
                  onClick={() => setRefundMode('cash_refund')}
                >
                  <strong>استرداد نقدي</strong>
                  <span>ينشئ سند صرف للعميل ويرتبط بالصندوق اليومي.</span>
                </button>
              </div>

              {!canCreateRefundPayment ? (
                <div className="inline-alert inline-alert-warning" role="status">
                  <span>لا توجد صلاحية إنشاء واعتماد سندات الدفع، لذلك الاسترداد النقدي غير متاح لهذا المستخدم.</span>
                </div>
              ) : null}

              {refundMode === 'cash_refund' ? (
                <div className="pos-return-refund-fields">
                  <label className="field">
                    <span>حساب الصرف</span>
                    <select value={effectiveRefundAccount} onChange={(event) => setSelectedRefundAccount(event.target.value)}>
                      {refundAccounts.map((account) => (
                        <option key={account.name} value={account.name}>
                          {displayErpLabel(account.name)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>طريقة الدفع</span>
                    <select value={effectiveRefundPaymentMode} onChange={(event) => setSelectedRefundPaymentMode(event.target.value)}>
                      {refundPaymentModes.map((mode) => (
                        <option key={mode.name} value={mode.name}>
                          {displayErpLabel(mode.name)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="pos-return-refund-amount">
                    <span>المبلغ المتوقع صرفه</span>
                    <strong>
                      {formatMoney(selectedAmount)} {currency}
                    </strong>
                  </div>
                </div>
              ) : null}
            </section>

            <label className="pos-return-note">
              <span>سبب المرتجع أو ملاحظة الكاشير</span>
              <textarea
                placeholder="مثال: العميل أرجع الصنف بسبب تلف / تبديل / خطأ في الكمية..."
                rows={3}
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
              />
            </label>

            <div className="pos-return-submit-bar">
              <Link className="button button-secondary" to="/pos">
                <ArrowLeft size={17} aria-hidden="true" />
                رجوع للكاشير
              </Link>
              <button className="button button-primary" disabled={!canSubmit} type="button" onClick={() => void handleCreateReturn()}>
                <BadgeCheck size={18} aria-hidden="true" />
                {createReturnMutation.isPending ? 'جاري اعتماد المرتجع' : 'إنشاء واعتماد المرتجع'}
              </button>
            </div>
          </section>
        </section>
      ) : null}
    </main>
  )
}
