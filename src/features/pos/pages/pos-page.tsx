import {
  Banknote,
  Barcode,
  Calculator,
  Gauge,
  AlertTriangle,
  CreditCard,
  DoorOpen,
  LayoutDashboard,
  ExternalLink,
  Filter,
  HandCoins,
  Landmark,
  LogOut,
  Maximize2,
  Minus,
  PackageSearch,
  PauseCircle,
  Plus,
  PlusCircle,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPosItem, posItemToCartLine, searchPosItems } from '../api/pos.api'
import {
  buildPaymentsForGrandTotal,
  calculateCartTotals,
  calculateExpression,
  calculatePaymentTotal,
  findStockIssueLines,
  lineTotal,
  nonNegativeMoney,
  nonNegativeNumber,
  positiveNumber,
  roundMoney,
  safeNumber,
} from '../calculators/pos-calculations'
import { PosHeldCartsDrawer } from '../components/pos-held-carts-drawer'
import { PosPaymentDrawer } from '../components/pos-payment-drawer'
import { PosSettingsDrawer } from '../components/pos-settings-drawer'
import { useCompletePosSale } from '../hooks/use-complete-pos-sale'
import { usePosOfflineQueue } from '../hooks/use-pos-offline-queue'
import { usePosDefaults, usePosProfile } from '../hooks/use-pos-defaults'
import { usePosItemSearch } from '../hooks/use-pos-item-search'
import { enqueuePosSale, isLikelyOfflineError } from '../offline/pos-offline-queue'
import { readHeldCarts, writeHeldCarts } from '../storage/held-carts-storage'
import type { HeldPosCart, PosCartLine, PosItemSearchResult, PosPaymentDraftLine, PosPaymentLine } from '../types/pos.types'
import { addDays, today } from '../utils/pos-date'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useActiveCashShift } from '@/features/cash-shifts/hooks/use-cash-shifts'
import { canUsePermission, useDoctypePermissions } from '@/features/permissions/hooks/use-doctype-permissions'
import { ErrorState } from '@/shared/ui/error-state'
import { LinkDatalistInput } from '@/shared/ui/link-datalist-input'
import { Loading } from '@/shared/ui/loading'
import { displayErpLabel } from '@/shared/utils/erp-labels'
import { formatMoney } from '@/shared/utils/format'
import { getStorePreferences } from '@/core/config/store-preferences'

function makePaymentLine(mode = '', account = '', amount = 0): PosPaymentDraftLine {
  return {
    id: `payment-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    mode_of_payment: mode,
    account,
    amount,
    reference_no: '',
  }
}

export default function PosPage() {
  const storePreferences = useMemo(() => getStorePreferences(), [])
  const auth = useAuth()
  const salesInvoicePermissions = useDoctypePermissions('Sales Invoice')
  const itemPermissions = useDoctypePermissions('Item')
  const paymentEntryPermissions = useDoctypePermissions('Payment Entry')
  const defaultsQuery = usePosDefaults()
  const completeSaleMutation = useCompletePosSale()
  const offlineQueue = usePosOfflineQueue()
  const scanInputRef = useRef<HTMLInputElement | null>(null)
  const paymentInputRef = useRef<HTMLInputElement | null>(null)
  const shortcutActionsRef = useRef({
    cancelSaleFromShortcut: () => undefined as void,
    completeSale: () => undefined as void | Promise<void>,
    holdCurrentCart: () => undefined as void,
  })
  const [selectedProfile, setSelectedProfile] = useState('')
  const defaults = defaultsQuery.data
  const effectiveProfileName = selectedProfile || defaults?.profiles[0]?.name || ''
  const profileQuery = usePosProfile(effectiveProfileName)
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [selectedPriceList, setSelectedPriceList] = useState('')
  const [selectedCurrency, setSelectedCurrency] = useState('')
  const [conversionRate, setConversionRate] = useState(1)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('')
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState('')
  const [selectedReceivableAccount, setSelectedReceivableAccount] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItemGroup, setSelectedItemGroup] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [saleMode, setSaleMode] = useState<'cash' | 'credit' | 'partial'>('cash')
  const [dueDate, setDueDate] = useState(() => addDays(storePreferences.defaultCreditDueDays))
  const [cart, setCart] = useState<PosCartLine[]>([])
  const [invoiceDiscountAmount, setInvoiceDiscountAmount] = useState(0)
  const [receivedAmount, setReceivedAmount] = useState(0)
  const [additionalPayments, setAdditionalPayments] = useState<PosPaymentDraftLine[]>([])
  const [updateStock, setUpdateStock] = useState(storePreferences.posUpdatesStock)
  const [referenceNo, setReferenceNo] = useState('')
  const [remarks, setRemarks] = useState('')
  const [heldCarts, setHeldCarts] = useState<HeldPosCart[]>(() => readHeldCarts())
  const [posError, setPosError] = useState<string | null>(null)
  const [completedInvoiceName, setCompletedInvoiceName] = useState<string | null>(null)
  const [printAfterSale, setPrintAfterSale] = useState(storePreferences.printAfterSale)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const [calculatorExpression, setCalculatorExpression] = useState('')
  const [calculatorResult, setCalculatorResult] = useState<number | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [saleDetailsOpen, setSaleDetailsOpen] = useState(false)
  const [paymentDetailsOpen, setPaymentDetailsOpen] = useState(false)
  const [settingsDetailsOpen, setSettingsDetailsOpen] = useState(false)
  const [heldDetailsOpen, setHeldDetailsOpen] = useState(false)
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const effectiveProfile = profileQuery.data ?? defaults?.profiles.find((profile) => profile.name === effectiveProfileName)
  const company = selectedCompany || effectiveProfile?.company || defaults?.companies[0]?.name || ''
  const companyOption = defaults?.companies.find((option) => option.name === company)
  const customer = selectedCustomer || effectiveProfile?.customer || ''
  const warehouse = selectedWarehouse || effectiveProfile?.warehouse || defaults?.warehouses.find((option) => option.company === company)?.name || ''
  const priceList = selectedPriceList || effectiveProfile?.selling_price_list || defaults?.priceLists[0]?.name || ''
  const priceListOption = defaults?.priceLists.find((option) => option.name === priceList)
  const currency = selectedCurrency || effectiveProfile?.currency || priceListOption?.currency || companyOption?.default_currency || storePreferences.defaultCurrency || 'YER'
  const profileDefaultPayment = effectiveProfile?.payments?.find((payment) => payment.default === 1) ?? effectiveProfile?.payments?.[0]
  const paymentMode = selectedPaymentMode || profileDefaultPayment?.mode_of_payment || defaults?.paymentModes[0]?.name || ''
  const paymentAccount =
    selectedPaymentAccount ||
    profileDefaultPayment?.account ||
    companyOption?.default_cash_account ||
    companyOption?.default_bank_account ||
    defaults?.paymentAccounts.find((account) => account.company === company)?.name ||
    ''
  const paymentAccounts = useMemo(
    () => defaults?.paymentAccounts.filter((account) => !company || account.company === company) ?? [],
    [company, defaults?.paymentAccounts],
  )
  const receivableAccount =
    selectedReceivableAccount ||
    companyOption?.default_receivable_account ||
    defaults?.receivableAccounts.find((account) => account.company === company)?.name ||
    ''
  const itemSearchQuery = usePosItemSearch(searchTerm, priceList, warehouse, selectedItemGroup, selectedBrand)
  const { totalQuantity, subtotal, itemDiscountTotal, netTotal, safeInvoiceDiscountAmount, grandTotal } = useMemo(
    () => calculateCartTotals(cart, invoiceDiscountAmount),
    [cart, invoiceDiscountAmount],
  )
  const allPaymentLines = useMemo(
    () => [
      {
        mode_of_payment: paymentMode,
        account: paymentAccount,
        amount: receivedAmount,
        reference_no: referenceNo,
      },
      ...additionalPayments,
    ],
    [additionalPayments, paymentAccount, paymentMode, receivedAmount, referenceNo],
  )
  const paymentTotal = useMemo(() => calculatePaymentTotal(allPaymentLines), [allPaymentLines])
  const changeAmount = Math.max(0, roundMoney(paymentTotal - grandTotal))
  const remainingAmount = Math.max(0, roundMoney(grandTotal - paymentTotal))
  const hasValidPayment = allPaymentLines.some((payment) => payment.mode_of_payment.trim() && nonNegativeMoney(payment.amount) > 0)
  const paymentsWithAmount = allPaymentLines.filter((payment) => nonNegativeMoney(payment.amount) > 0)
  const paymentsHaveAccounts = paymentsWithAmount.every((payment) => Boolean(payment.account?.trim()))
  const stockIssueLines = useMemo(() => findStockIssueLines(cart, updateStock), [cart, updateStock])
  const stockRequirementMet = stockIssueLines.length === 0
  const canUsePos =
    canUsePermission(salesInvoicePermissions.canCreate) &&
    canUsePermission(salesInvoicePermissions.canSubmit) &&
    canUsePermission(itemPermissions.canRead)
  const activeShiftQuery = useActiveCashShift(effectiveProfileName, auth.user?.name ?? auth.user?.email, canUsePos && Boolean(effectiveProfileName))
  const activeCashShift = activeShiftQuery.data
  const cashShiftReady = Boolean(activeCashShift)
  const hasPosNotices =
    Boolean(posError) ||
    activeShiftQuery.isError ||
    !cashShiftReady ||
    Boolean(offlineQueue.lastSyncMessage) ||
    offlineQueue.queuedCount > 0 ||
    stockIssueLines.length > 0 ||
    Boolean(completedInvoiceName)
  const creditSaleHasNoPayment = saleMode !== 'credit' || paymentTotal === 0
  const paymentRequirementMet =
    saleMode === 'cash'
      ? paymentTotal >= grandTotal && hasValidPayment && paymentsHaveAccounts
      : saleMode === 'partial'
        ? paymentTotal > 0 && paymentTotal < grandTotal && hasValidPayment && paymentsHaveAccounts
        : true
  const receivableRequirementMet = saleMode === 'cash' || Boolean(receivableAccount)
  const canUsePartialPayment =
    canUsePermission(paymentEntryPermissions.canCreate) && canUsePermission(paymentEntryPermissions.canSubmit)
  const canCompleteSale =
    cart.length > 0 &&
    customer &&
    company &&
    priceList &&
    grandTotal > 0 &&
    paymentRequirementMet &&
    receivableRequirementMet &&
    creditSaleHasNoPayment &&
    (saleMode !== 'partial' || canUsePartialPayment) &&
    stockRequirementMet &&
    cashShiftReady

  function focusScanner() {
    scanInputRef.current?.focus()
  }

  function persistHeldCarts(nextCarts: HeldPosCart[]) {
    setHeldCarts(nextCarts)
    writeHeldCarts(nextCarts)
  }

  function addItemToCart(item: PosItemSearchResult) {
    setPosError(null)
    setCompletedInvoiceName(null)
    setCart((current) => {
      const rate = Number(item.price_list_rate ?? item.standard_rate ?? 0)
      const existingLine = current.find((line) => line.item_code === item.item_code && line.rate === rate)

      if (existingLine) {
        return current.map((line) => (line.id === existingLine.id ? { ...line, qty: line.qty + 1 } : line))
      }

      return [posItemToCartLine(item, warehouse), ...current]
    })
    setReceivedAmount(0)
    setSearchTerm('')
    focusScanner()
  }

  function updateLine(lineId: string, values: Partial<PosCartLine>) {
    setCart((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              ...values,
              qty: Math.max(0.001, safeNumber(values.qty ?? line.qty, line.qty)),
              rate: nonNegativeMoney(values.rate ?? line.rate, line.rate),
              discountPercent: Math.min(100, Math.max(0, safeNumber(values.discountPercent ?? line.discountPercent, line.discountPercent))),
            }
          : line,
      ),
    )
  }

  function removeLine(lineId: string) {
    setCart((current) => current.filter((line) => line.id !== lineId))
  }

  function clearSale() {
    setCart([])
    setReceivedAmount(0)
    setAdditionalPayments([])
    setInvoiceDiscountAmount(0)
    setReferenceNo('')
    setRemarks('')
    setDueDate(addDays(storePreferences.defaultCreditDueDays))
    setSaleMode('cash')
    setUpdateStock(storePreferences.posUpdatesStock)
    setPosError(null)
    setCompletedInvoiceName(null)
    setCancelConfirmOpen(false)
    focusScanner()
  }

  function cancelSaleFromShortcut() {
    if (cancelConfirmOpen) {
      setCancelConfirmOpen(false)
      focusScanner()
      return
    }

    if (paymentDetailsOpen || settingsDetailsOpen || heldDetailsOpen) {
      setPaymentDetailsOpen(false)
      setSettingsDetailsOpen(false)
      setHeldDetailsOpen(false)
      focusScanner()
      return
    }

    if (saleDetailsOpen) {
      setSaleDetailsOpen(false)
      focusScanner()
      return
    }

    if (calculatorOpen) {
      setCalculatorOpen(false)
      focusScanner()
      return
    }

    if (cart.length === 0) {
      focusScanner()
      return
    }

    setCancelConfirmOpen(true)
  }

  function changeSaleMode(nextMode: 'cash' | 'credit' | 'partial') {
    setSaleMode(nextMode)
    setPosError(null)

    if (nextMode === 'credit') {
      setReceivedAmount(0)
      setAdditionalPayments([])
      setReferenceNo('')
    }
  }

  function addPaymentLine() {
    setAdditionalPayments((current) => [
      ...current,
      makePaymentLine(paymentMode, paymentAccount, remainingAmount || 0),
    ])
  }

  function updatePaymentLine(id: string, values: Partial<PosPaymentLine>) {
    setAdditionalPayments((current) =>
      current.map((payment) =>
        payment.id === id
          ? {
              ...payment,
              ...values,
              amount: nonNegativeMoney(values.amount ?? payment.amount, payment.amount),
            }
          : payment,
      ),
    )
  }

  function removePaymentLine(id: string) {
    setAdditionalPayments((current) => current.filter((payment) => payment.id !== id))
  }

  async function handleScanSubmit(event: FormEvent) {
    event.preventDefault()
    const term = searchTerm.trim()

    if (!term) {
      return
    }

    try {
      setPosError(null)
      const [directItem] = await searchPosItems(term, priceList, warehouse, {
        itemGroup: selectedItemGroup,
        brand: selectedBrand,
      })

      if (directItem) {
        addItemToCart(directItem)
        return
      }

      const item = await getPosItem(term, priceList, warehouse)
      addItemToCart(item)
    } catch {
      setPosError('لم يتم العثور على صنف مطابق للباركود أو البحث الحالي.')
    }
  }

  function holdCurrentCart() {
    if (cart.length === 0) {
      setPosError('لا توجد أصناف لحفظ الفاتورة كمعلقة.')
      return
    }

    const heldCart: HeldPosCart = {
      id: `${Date.now()}`,
      label: `${customer || 'عميل نقدي'} - ${formatMoney(grandTotal)} ${currency}`,
      createdAt: new Date().toISOString(),
      customer,
      saleMode,
      dueDate,
      currency,
      conversionRate: positiveNumber(conversionRate),
      updateStock,
      cart,
      invoiceDiscountAmount: safeInvoiceDiscountAmount,
    }
    persistHeldCarts([heldCart, ...heldCarts].slice(0, 10))
    clearSale()
  }

  function restoreHeldCart(heldCart: HeldPosCart) {
    setCart(heldCart.cart)
    setSelectedCustomer(heldCart.customer)
    setSaleMode(heldCart.saleMode ?? 'cash')
    setDueDate(heldCart.dueDate ?? addDays(storePreferences.defaultCreditDueDays))
    setSelectedCurrency(heldCart.currency ?? '')
    setConversionRate(positiveNumber(heldCart.conversionRate, 1))
    setUpdateStock(heldCart.updateStock ?? storePreferences.posUpdatesStock)
    setInvoiceDiscountAmount(nonNegativeMoney(heldCart.invoiceDiscountAmount))
    setReceivedAmount(0)
    setAdditionalPayments([])
    setCompletedInvoiceName(null)
    persistHeldCarts(heldCarts.filter((entry) => entry.id !== heldCart.id))
  }

  function deleteHeldCart(id: string) {
    persistHeldCarts(heldCarts.filter((entry) => entry.id !== id))
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
      return
    }

    void document.documentElement.requestFullscreen().catch(() => {
      setPosError('تعذر تفعيل وضع الشاشة الكاملة من المتصفح.')
    })
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    try {
      await auth.logout()
    } catch {
      // Keep the POS exit usable even if the ERPNext logout request fails.
    } finally {
      setIsLoggingOut(false)
      window.location.replace('/login?logged_out=1')
    }
  }

  function appendCalculatorToken(token: string) {
    setCalculatorExpression((current) => `${current}${token}`)
    setCalculatorResult(null)
  }

  function evaluateCalculator() {
    const result = calculateExpression(calculatorExpression)
    setCalculatorResult(result)

    if (result === null) {
      setPosError('صيغة الحاسبة غير صحيحة.')
    } else {
      setPosError(null)
    }
  }

  function applyCalculatorResult(target: 'payment' | 'discount') {
    const result = calculatorResult ?? calculateExpression(calculatorExpression)

    if (result === null) {
      setPosError('احسب العملية أولاً قبل تطبيقها.')
      return
    }

    if (target === 'payment') {
      setReceivedAmount(nonNegativeMoney(result))
    } else {
      setInvoiceDiscountAmount(Math.min(netTotal, nonNegativeMoney(result)))
    }

    setCalculatorOpen(false)
    focusScanner()
  }

  function setFullCashPayment() {
    if (grandTotal <= 0) {
      return
    }

    changeSaleMode('cash')
    setReceivedAmount(grandTotal)
    paymentInputRef.current?.focus()
    paymentInputRef.current?.select()
  }

  function handleTenderKey(key: string) {
    changeSaleMode('cash')

    if (key === 'full') {
      setFullCashPayment()
      return
    }

    if (key === 'clear') {
      setReceivedAmount(0)
      return
    }

    if (key === 'backspace') {
      setReceivedAmount((current) => nonNegativeMoney(String(current).slice(0, -1) || '0'))
      return
    }

    if (key.startsWith('+')) {
      setReceivedAmount((current) => roundMoney(nonNegativeMoney(current) + nonNegativeMoney(key.slice(1))))
      return
    }

    setReceivedAmount((current) => {
      const currentText = current > 0 ? String(current) : ''

      if (key === '.' && currentText.includes('.')) {
        return current
      }

      return nonNegativeMoney(`${currentText}${key}`)
    })
  }

  function buildPaymentsForPayload() {
    return buildPaymentsForGrandTotal(allPaymentLines, grandTotal)
  }

  function buildSalePayload() {
    return {
      saleMode,
      customer,
      company,
      posting_date: today(),
      due_date: saleMode === 'cash' ? today() : dueDate,
      currency,
      conversion_rate: positiveNumber(conversionRate, 1),
      selling_price_list: priceList,
      set_warehouse: warehouse,
      pos_profile: effectiveProfileName,
      posOpeningEntry: activeCashShift?.name,
      receivableAccount,
      updateStock,
      invoiceDiscountAmount: safeInvoiceDiscountAmount,
      paidAmount: saleMode === 'cash' ? grandTotal : paymentTotal,
      remarks,
      cart,
      payments: buildPaymentsForPayload(),
    }
  }

  async function completeSale() {
    if (!canCompleteSale) {
      const firstStockIssue = stockIssueLines[0]

      if (firstStockIssue) {
        setPosError(
          `الكمية المطلوبة من ${firstStockIssue.item_name} (${formatMoney(firstStockIssue.qty)}) أكبر من المتاح في المخزن (${formatMoney(
            firstStockIssue.stockQty ?? 0,
          )}).`,
        )
        return
      }

      if (saleMode === 'partial' && !canUsePartialPayment) {
        setPosError('الدفعة الجزئية تحتاج صلاحية إنشاء واعتماد سند قبض Payment Entry.')
        return
      }

      if (!cashShiftReady) {
        setPosError('افتح وردية الكاشير قبل اعتماد البيع. هذا يمنع ضياع الصندوق ويسمح بإغلاق اليوم ومطابقة النقد الفعلي.')
        return
      }

      setPosError('راجع العميل والأصناف وطريقة البيع. البيع النقدي يحتاج دفع كامل وحساب تحصيل، والبيع الجزئي يحتاج دفعة أقل من الإجمالي وحساب تحصيل، والبيع الآجل لا يقبل دفعة ويحتاج حساب ذمم.')
      return
    }

    setPosError(null)

    try {
      const result = await completeSaleMutation.mutateAsync(buildSalePayload())

      setCompletedInvoiceName(result.submittedInvoice.name)
      setCart([])
      setReceivedAmount(0)
      setAdditionalPayments([])
      setInvoiceDiscountAmount(0)
      setReferenceNo('')
      setRemarks('')
      setDueDate(addDays(storePreferences.defaultCreditDueDays))

      if (printAfterSale) {
        window.setTimeout(() => window.print(), 250)
      }
    } catch (error) {
      if (isLikelyOfflineError(error)) {
        enqueuePosSale(buildSalePayload())
        offlineQueue.refreshQueue()
        setCompletedInvoiceName(null)
        setPosError('تم حفظ الفاتورة محليًا بسبب انقطاع الاتصال. ستظهر ضمن فواتير بانتظار المزامنة.')
        setCart([])
        setReceivedAmount(0)
        setAdditionalPayments([])
        setInvoiceDiscountAmount(0)
        setReferenceNo('')
        setRemarks('')
        setDueDate(addDays(storePreferences.defaultCreditDueDays))
        return
      }

      setPosError(error instanceof Error ? error.message : 'تعذر إنهاء عملية البيع.')
    }
  }

  useEffect(() => {
    shortcutActionsRef.current = {
      cancelSaleFromShortcut,
      completeSale,
      holdCurrentCart,
    }
  })

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return
      }

      if (event.key === 'F1') {
        event.preventDefault()
        scanInputRef.current?.focus()
        return
      }

      if (event.key === 'F2') {
        event.preventDefault()
        setPaymentDetailsOpen(true)
        window.setTimeout(() => {
          paymentInputRef.current?.focus()
          paymentInputRef.current?.select()
        }, 50)
        return
      }

      if (event.key === 'F3') {
        event.preventDefault()
        if (grandTotal > 0) {
          setSaleMode('cash')
          setPosError(null)
          setReceivedAmount(grandTotal)
          paymentInputRef.current?.focus()
          paymentInputRef.current?.select()
        }
        return
      }

      if (event.key === 'F4') {
        event.preventDefault()
        shortcutActionsRef.current.holdCurrentCart()
        return
      }

      if (event.key === 'F8') {
        event.preventDefault()
        window.print()
        return
      }

      if (event.key === 'F9') {
        event.preventDefault()
        if (canCompleteSale && !completeSaleMutation.isPending) {
          void shortcutActionsRef.current.completeSale()
        }
        return
      }

      if (event.key === 'Escape') {
        event.preventDefault()
        shortcutActionsRef.current.cancelSaleFromShortcut()
      }
    }

    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [canCompleteSale, completeSaleMutation.isPending, grandTotal])

  if (salesInvoicePermissions.isLoading || itemPermissions.isLoading || defaultsQuery.isLoading || activeShiftQuery.isLoading) {
    return <Loading />
  }

  if (!canUsePos) {
    return <ErrorState message="لا توجد صلاحية لاستخدام نقطة البيع. تحتاج صلاحية قراءة الأصناف وإنشاء واعتماد فواتير البيع." />
  }

  if (defaultsQuery.isError) {
    return <ErrorState message={(defaultsQuery.error as Error).message} />
  }

  return (
    <div className="pos-screen">
      <section className="pos-toolbar">
        <div className="pos-toolbar-title">
          <span className="pos-terminal-mark" aria-hidden="true">
            <ShoppingCart size={21} />
          </span>
          <div>
          <p className="eyebrow">نقطة البيع</p>
          <h2>الكاشير</h2>
          <p>{offlineQueue.isOnline ? 'جاهز للبيع' : 'وضع أوفلاين'}</p>
          </div>
        </div>
        <div className="pos-toolbar-actions">
          <Link className="button button-secondary" to="/cash-shifts">
            <DoorOpen size={17} aria-hidden="true" />
            الوردية
          </Link>
          <Link className="button button-secondary" to="/pos/returns">
            <RotateCcw size={17} aria-hidden="true" />
            مرتجع
          </Link>
          <Link className="button button-secondary" to="/dashboard">
            <LayoutDashboard size={17} aria-hidden="true" />
            لوحة التحكم
          </Link>
          <button className="button button-secondary" disabled={isLoggingOut} type="button" onClick={handleLogout}>
            <LogOut size={17} aria-hidden="true" />
            {isLoggingOut ? 'جاري الخروج' : 'خروج'}
          </button>
          <span className={updateStock ? 'pos-stock-mode-chip active' : 'pos-stock-mode-chip'}>
            <Gauge size={16} aria-hidden="true" />
            {updateStock ? 'المخزون مفعّل' : 'بيع بدون مخزون'}
          </span>
          <span className={offlineQueue.isOnline ? 'pos-stock-mode-chip active' : 'pos-stock-mode-chip warning'}>
            <Gauge size={16} aria-hidden="true" />
            {offlineQueue.isOnline ? 'متصل' : 'غير متصل'}
          </span>
          <span className={cashShiftReady ? 'pos-stock-mode-chip active' : 'pos-stock-mode-chip warning'}>
            <DoorOpen size={16} aria-hidden="true" />
            {cashShiftReady ? `وردية ${activeCashShift?.name}` : 'لا توجد وردية'}
          </span>
          {offlineQueue.queuedCount > 0 ? (
            <button
              className="button button-secondary"
              disabled={!offlineQueue.isOnline || offlineQueue.isSyncing}
              type="button"
              onClick={() => {
                void offlineQueue.syncQueue()
              }}
            >
              <ReceiptText size={17} aria-hidden="true" />
              {offlineQueue.isSyncing ? 'جاري المزامنة' : `مزامنة ${offlineQueue.queuedCount}`}
            </button>
          ) : null}
          <button className="button button-secondary" type="button" onClick={() => setCalculatorOpen((current) => !current)}>
            <Calculator size={17} aria-hidden="true" />
            حاسبة
          </button>
          <button className="button button-secondary" type="button" onClick={toggleFullscreen}>
            <Maximize2 size={17} aria-hidden="true" />
            شاشة كاملة
          </button>
        </div>
      </section>

      <section className="pos-shortcuts-strip" aria-label="اختصارات الكاشير">
        <span><kbd>F1</kbd> بحث</span>
        <span><kbd>F2</kbd> الدفع</span>
        <span><kbd>F3</kbd> دفع كامل</span>
        <span><kbd>F4</kbd> تعليق</span>
        <span><kbd>F8</kbd> طباعة</span>
        <span><kbd>F9</kbd> إنهاء البيع</span>
        <span><kbd>ESC</kbd> إلغاء</span>
      </section>

      <section className="pos-command-center" aria-label="شاشة الكاشير الحالية">
        <div className="pos-command-total">
          <span>الإجمالي المستحق</span>
          <strong>
            {formatMoney(grandTotal)} {currency}
          </strong>
          <small>
            {saleMode === 'credit'
              ? `بيع آجل حتى ${dueDate}`
              : remainingAmount > 0
                ? `متبقي ${formatMoney(remainingAmount)} ${currency}`
                : 'جاهز للاعتماد'}
          </small>
        </div>

        <div className="pos-command-stats">
          <div>
            <span>الأصناف</span>
            <strong>{cart.length}</strong>
          </div>
          <div>
            <span>الكمية</span>
            <strong>{formatMoney(totalQuantity)}</strong>
          </div>
          <div>
            <span>المدفوع</span>
            <strong>{formatMoney(paymentTotal)}</strong>
          </div>
          <div>
            <span>المعلقة</span>
            <strong>{heldCarts.length + offlineQueue.queuedCount}</strong>
          </div>
          <div>
            <span>الوردية</span>
            <strong>{cashShiftReady ? 'مفتوحة' : 'مغلقة'}</strong>
          </div>
        </div>

      </section>

      <section className="pos-kpi-strip">
        <div className="pos-kpi-card">
          <span className="pos-kpi-icon pos-kpi-icon-blue">
            <ShoppingCart size={18} aria-hidden="true" />
          </span>
          <div>
            <p>عدد الأصناف</p>
            <strong>{cart.length}</strong>
          </div>
        </div>
        <div className="pos-kpi-card">
          <span className="pos-kpi-icon pos-kpi-icon-teal">
            <PackageSearch size={18} aria-hidden="true" />
          </span>
          <div>
            <p>إجمالي الكمية</p>
            <strong>{formatMoney(totalQuantity)}</strong>
          </div>
        </div>
        <div className="pos-kpi-card">
          <span className="pos-kpi-icon pos-kpi-icon-amber">
            <Banknote size={18} aria-hidden="true" />
          </span>
          <div>
            <p>صافي الفاتورة</p>
            <strong>
              {formatMoney(grandTotal)} {currency}
            </strong>
          </div>
        </div>
        <div className="pos-kpi-card">
          <span className="pos-kpi-icon pos-kpi-icon-violet">
            <PauseCircle size={18} aria-hidden="true" />
          </span>
          <div>
            <p>فواتير معلقة</p>
            <strong>{heldCarts.length}</strong>
          </div>
        </div>
      </section>

      {calculatorOpen ? (
        <section className="pos-calculator" aria-label="حاسبة نقطة البيع">
          <div className="section-heading split">
            <div>
              <h4>حاسبة سريعة</h4>
              <p>استخدمها للحسابات اليومية ثم طبق الناتج على الدفع أو الخصم.</p>
            </div>
            <button className="icon-button" type="button" onClick={() => setCalculatorOpen(false)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <input
            className="pos-calculator-display"
            dir="ltr"
            inputMode="decimal"
            placeholder="مثال: 1500+250-50"
            value={calculatorExpression}
            onChange={(event) => {
              setCalculatorExpression(event.target.value)
              setCalculatorResult(null)
            }}
          />
          <div className="pos-calculator-keys">
            {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '+', 'C'].map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => {
                  if (token === 'C') {
                    setCalculatorExpression('')
                    setCalculatorResult(null)
                  } else {
                    appendCalculatorToken(token)
                  }
                }}
              >
                {token}
              </button>
            ))}
          </div>
          <div className="pos-calculator-result">
            <span>الناتج</span>
            <strong>{calculatorResult === null ? '-' : formatMoney(calculatorResult)}</strong>
          </div>
          <div className="pos-calculator-actions">
            <button className="button button-secondary" type="button" onClick={evaluateCalculator}>
              احسب
            </button>
            <button className="button button-secondary" type="button" onClick={() => applyCalculatorResult('discount')}>
              تطبيق كخصم
            </button>
            <button className="button button-primary" type="button" onClick={() => applyCalculatorResult('payment')}>
              تطبيق كدفع
            </button>
          </div>
        </section>
      ) : null}

      {hasPosNotices ? (
        <section className="pos-notice-stack" aria-label="تنبيهات نقطة البيع" aria-live="polite">
          {posError ? (
            <div className="inline-alert inline-alert-danger" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{posError}</span>
            </div>
          ) : null}
          {activeShiftQuery.isError ? (
            <div className="inline-alert inline-alert-danger" role="alert">
              <AlertTriangle size={18} aria-hidden="true" />
              <span>تعذر التحقق من وردية الكاشير. راجع صلاحيات وردية افتتاح الكاشير أو افتح صفحة الورديات.</span>
              <Link to="/cash-shifts">فتح الورديات</Link>
            </div>
          ) : null}
          {!activeShiftQuery.isError && !cashShiftReady ? (
            <div className="inline-alert inline-alert-warning" role="status">
              <DoorOpen size={18} aria-hidden="true" />
              <span>لا توجد وردية كاشير مفتوحة. افتح وردية قبل اعتماد البيع حتى يتم إغلاق الصندوق بشكل صحيح.</span>
              <Link to="/cash-shifts">فتح وردية</Link>
            </div>
          ) : null}
      {offlineQueue.lastSyncMessage ? (
        <div className="inline-alert inline-alert-success" role="status">
          <ReceiptText size={18} aria-hidden="true" />
          <span>{offlineQueue.lastSyncMessage}</span>
        </div>
      ) : null}
      {offlineQueue.queuedCount > 0 ? (
        <div className="inline-alert inline-alert-warning" role="status">
          <ReceiptText size={18} aria-hidden="true" />
          <span>
            يوجد {offlineQueue.queuedCount} فاتورة محفوظة محليًا بانتظار المزامنة. لا تعتبر معتمدة في ERPNext حتى تتم المزامنة.
          </span>
        </div>
      ) : null}
      {stockIssueLines.length > 0 ? (
        <div className="inline-alert inline-alert-warning" role="status">
          <PackageSearch size={18} aria-hidden="true" />
          <span>
            يوجد أصناف كميتها أكبر من المتاح في المخزن:{' '}
            {stockIssueLines
              .slice(0, 3)
              .map((line) => `${line.item_name} (${formatMoney(line.qty)} / المتاح ${formatMoney(line.stockQty ?? 0)})`)
              .join('، ')}
          </span>
        </div>
      ) : null}
      {completedInvoiceName ? (
        <div className="inline-alert inline-alert-success" role="status">
          <ReceiptText size={18} aria-hidden="true" />
          <span>تمت عملية البيع واعتماد الفاتورة: {completedInvoiceName}</span>
          <Link to={`/sales-invoices/${encodeURIComponent(completedInvoiceName)}`}>
            فتح الفاتورة
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
        </div>
      ) : null}
        </section>
      ) : null}

      <section className="pos-layout">
        <div className="pos-sale-area">
          <form className="pos-scan-box" onSubmit={handleScanSubmit}>
            <Barcode size={22} aria-hidden="true" />
            <input
              ref={scanInputRef}
              autoFocus
              placeholder="باركود أو اسم صنف أو كود"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <button className="button button-primary" type="submit">
              <Search size={17} aria-hidden="true" />
              إضافة
            </button>
          </form>

          <div className="pos-filter-bar">
            <label className="field compact-field">
              <span>القسم</span>
              <select value={selectedItemGroup} onChange={(event) => setSelectedItemGroup(event.target.value)}>
                <option value="">كل الأقسام</option>
                {defaults?.itemGroups.map((group) => (
                  <option key={group.name} value={group.name}>
                    {displayErpLabel(group.name)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field compact-field">
              <span>الماركة</span>
              <select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)}>
                <option value="">كل الماركات</option>
                {defaults?.brands.map((brand) => (
                  <option key={brand.name} value={brand.name}>
                    {displayErpLabel(brand.name)}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setSelectedItemGroup('')
                setSelectedBrand('')
                setSearchTerm('')
              }}
            >
              <Filter size={16} aria-hidden="true" />
              تصفير الفلاتر
            </button>
            <Link className="button button-secondary" to="/items/new">
              <PlusCircle size={16} aria-hidden="true" />
              صنف سريع
            </Link>
          </div>

          <div className="pos-category-rail" aria-label="أقسام الأصناف السريعة">
            <button className={!selectedItemGroup ? 'active' : undefined} type="button" onClick={() => setSelectedItemGroup('')}>
              كل الأصناف
            </button>
            {defaults?.itemGroups.slice(0, 9).map((group) => (
              <button
                className={selectedItemGroup === group.name ? 'active' : undefined}
                key={group.name}
                type="button"
                onClick={() => setSelectedItemGroup(group.name)}
              >
                {displayErpLabel(group.name)}
              </button>
            ))}
          </div>

          <div className="pos-products-header">
            <div>
              <span>كتالوج البيع</span>
              <strong>{itemSearchQuery.data?.length ?? 0} صنف جاهز</strong>
            </div>
            <small>{selectedItemGroup || selectedBrand || searchTerm ? 'نتائج مفلترة حسب البحث الحالي' : 'اضغط على الصنف لإضافته فورًا للسلة'}</small>
          </div>

          <div className="pos-product-grid">
            {itemSearchQuery.isFetching ? <Loading /> : null}
            {!itemSearchQuery.isFetching && itemSearchQuery.data?.length === 0 ? (
              <div className="state-block">
                <div className="state-heading">
                  <PackageSearch size={22} aria-hidden="true" />
                  <div>
                    <h3>لا توجد أصناف مطابقة</h3>
                    <p>جرّب الباركود أو كود الصنف أو غيّر فلتر القسم والماركة.</p>
                  </div>
                </div>
              </div>
            ) : null}
            {(itemSearchQuery.data ?? []).map((item) => (
              <button className="pos-product-card" key={item.name} type="button" onClick={() => addItemToCart(item)}>
                <span className="pos-product-icon">
                  <PackageSearch size={19} aria-hidden="true" />
                </span>
                <strong>{item.item_name || item.item_code}</strong>
                <span>{item.item_code}</span>
                <b>
                  {formatMoney(item.price_list_rate ?? item.standard_rate ?? 0)} {currency}
                </b>
                <small>{displayErpLabel(item.item_group || item.brand || 'صنف بيع')}</small>
                {updateStock && typeof item.actual_qty === 'number' ? <em>المتاح: {formatMoney(item.actual_qty)}</em> : null}
                {!updateStock ? <em>بدون تأثير مخزون</em> : null}
              </button>
            ))}
          </div>

          <div className="pos-cart-panel">
            <div className="section-heading split">
              <div>
                <h4>السلة</h4>
                <p>{cart.length} صنف في الفاتورة الحالية</p>
              </div>
              <ShoppingCart size={22} aria-hidden="true" />
            </div>
            <div className="pos-cart-mini-total" aria-label="ملخص السلة">
              <span>الإجمالي</span>
              <strong>
                {formatMoney(grandTotal)} {currency}
              </strong>
            </div>

            {cart.length === 0 ? (
              <div className="state-block">
                <div className="state-heading">
                  <ShoppingCart size={22} aria-hidden="true" />
                  <div>
                    <h3>السلة فارغة</h3>
                    <p>أضف صنفًا بالبحث أو الباركود لبدء البيع.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pos-cart-lines">
                {cart.map((line) => (
                  <div className="pos-cart-line" key={line.id}>
                    <div className="pos-cart-item-main">
                      <strong>{line.item_name}</strong>
                      <span>{line.item_code}</span>
                      {updateStock && typeof line.stockQty === 'number' ? (
                        <small className={line.isStockItem !== 0 && nonNegativeNumber(line.qty) > line.stockQty ? 'pos-cart-stock danger' : 'pos-cart-stock'}>
                          المتاح: {formatMoney(line.stockQty)}
                        </small>
                      ) : null}
                    </div>
                    <div className="pos-cart-controls">
                      <button className="icon-button" type="button" onClick={() => updateLine(line.id, { qty: line.qty - 1 })}>
                        <Minus size={16} aria-hidden="true" />
                      </button>
                      <input
                        aria-label="الكمية"
                        min="0.001"
                        step="0.001"
                        type="number"
                        value={line.qty}
                        onChange={(event) => updateLine(line.id, { qty: safeNumber(event.target.value, line.qty) })}
                      />
                      <button className="icon-button" type="button" onClick={() => updateLine(line.id, { qty: line.qty + 1 })}>
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <label className="pos-line-field">
                      <span>السعر</span>
                      <input type="number" value={line.rate} onChange={(event) => updateLine(line.id, { rate: nonNegativeMoney(event.target.value, line.rate) })} />
                    </label>
                    <label className="pos-line-field">
                      <span>خصم %</span>
                      <input
                        max="100"
                        min="0"
                        type="number"
                        value={line.discountPercent}
                        onChange={(event) => updateLine(line.id, { discountPercent: safeNumber(event.target.value, line.discountPercent) })}
                      />
                    </label>
                    <strong className="pos-line-total">
                      {formatMoney(lineTotal(line))} {currency}
                    </strong>
                    <button className="icon-button" title="حذف الصنف" type="button" onClick={() => removeLine(line.id)}>
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </section>

      {saleDetailsOpen ? (
        <div className="pos-drawer-backdrop" role="presentation" onMouseDown={() => setSaleDetailsOpen(false)}>
          <aside
            aria-label="بيانات طريقة البيع والعميل والدين"
            aria-modal="true"
            className="pos-sale-details-drawer"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="pos-drawer-header">
              <div>
                <p className="eyebrow">بيانات البيع</p>
                <h3>طريقة البيع والعميل والدين</h3>
              </div>
              <button className="icon-button" type="button" onClick={() => setSaleDetailsOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="pos-sale-mode-panel">
              <div className="section-heading">
                <h4>طريقة البيع</h4>
                <p>اختر نقدي، آجل، أو دفعة جزئية بدون ازدحام شاشة الكاشير الرئيسية.</p>
              </div>
              <div className="pos-sale-mode-grid">
                <button className={saleMode === 'cash' ? 'pos-sale-mode active' : 'pos-sale-mode'} type="button" onClick={() => changeSaleMode('cash')}>
                  <Banknote size={17} aria-hidden="true" />
                  <span>نقدي</span>
                </button>
                <button className={saleMode === 'credit' ? 'pos-sale-mode active' : 'pos-sale-mode'} type="button" onClick={() => changeSaleMode('credit')}>
                  <Landmark size={17} aria-hidden="true" />
                  <span>آجل / دين</span>
                </button>
                <button
                  className={saleMode === 'partial' ? 'pos-sale-mode active' : 'pos-sale-mode'}
                  disabled={!canUsePartialPayment}
                  title={!canUsePartialPayment ? 'تحتاج صلاحية إنشاء واعتماد سند قبض' : undefined}
                  type="button"
                  onClick={() => changeSaleMode('partial')}
                >
                  <HandCoins size={17} aria-hidden="true" />
                  <span>دفعة جزئية</span>
                </button>
              </div>

              {saleMode === 'partial' && paymentTotal >= grandTotal && grandTotal > 0 ? (
                <div className="inline-alert inline-alert-warning" role="status">
                  <span>الدفعة الجزئية يجب أن تكون أقل من إجمالي الفاتورة. إذا دفع العميل كامل المبلغ اختر بيع نقدي.</span>
                </div>
              ) : null}

              {saleMode === 'credit' && paymentTotal > 0 ? (
                <div className="inline-alert inline-alert-warning" role="status">
                  <span>وضع البيع الآجل لا يسجل دفعة. إذا استلمت مبلغًا من العميل اختر دفعة جزئية.</span>
                </div>
              ) : null}

              {(saleMode === 'cash' || saleMode === 'partial') && paymentsWithAmount.length > 0 && !paymentsHaveAccounts ? (
                <div className="inline-alert inline-alert-warning" role="status">
                  <span>كل دفعة تحتاج حساب تحصيل واضح: صندوق، بنك، أو حساب صراف.</span>
                </div>
              ) : null}
            </div>

            <div className="pos-customer-debt-panel">
              <div className="section-heading split">
                <div>
                  <h4>العميل والدين</h4>
                  <p>هذه البيانات تؤثر على الذمم وكشف حساب العميل.</p>
                </div>
                <span className={saleMode === 'cash' ? 'pos-sale-badge cash' : 'pos-sale-badge credit'}>
                  {saleMode === 'cash' ? 'نقدي' : saleMode === 'credit' ? 'آجل' : 'دفعة جزئية'}
                </span>
              </div>

              <div className="pos-customer-row">
                <label className="field">
                  <span>العميل</span>
                  <LinkDatalistInput
                    doctype="Customer"
                    listId="pos-customers"
                    placeholder="عميل نقدي أو اسم العميل"
                    value={customer}
                    onChange={(event) => setSelectedCustomer(event.target.value)}
                  />
                </label>
                <Link className="button button-secondary pos-inline-link" to="/customers/new">
                  <UserPlus size={16} aria-hidden="true" />
                  إضافة عميل
                </Link>
              </div>

              {saleMode !== 'cash' ? (
                <div className="pos-credit-fields">
                  <label className="field">
                    <span>تاريخ الاستحقاق</span>
                    <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
                  </label>
                  <label className="field">
                    <span>حساب الذمم</span>
                    <select value={receivableAccount} onChange={(event) => setSelectedReceivableAccount(event.target.value)}>
                      <option value="">من إعدادات الشركة</option>
                      {defaults?.receivableAccounts
                        .filter((option) => !company || option.company === company)
                        .map((option) => (
                          <option key={option.name} value={option.name}>
                            {displayErpLabel(option.name)}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>
              ) : (
                <div className="pos-cash-customer-note">
                  <Banknote size={17} aria-hidden="true" />
                  <span>في البيع النقدي لا يتم تسجيل دين. اختر آجل أو دفعة جزئية إذا سيبقى مبلغ على العميل.</span>
                </div>
              )}
            </div>

            <button className="button button-primary pos-drawer-done" type="button" onClick={() => setSaleDetailsOpen(false)}>
              حفظ والعودة للكاشير
            </button>
          </aside>
        </div>
      ) : null}

      {paymentDetailsOpen ? (
        <PosPaymentDrawer
          additionalPayments={additionalPayments}
          changeAmount={changeAmount}
          currency={currency}
          grandTotal={grandTotal}
          itemDiscountTotal={itemDiscountTotal}
          netTotal={netTotal}
          paymentAccount={paymentAccount}
          paymentAccounts={paymentAccounts}
          paymentInputRef={paymentInputRef}
          paymentMode={paymentMode}
          paymentModes={defaults?.paymentModes}
          paymentTotal={paymentTotal}
          printAfterSale={printAfterSale}
          receivedAmount={receivedAmount}
          referenceNo={referenceNo}
          remainingAmount={remainingAmount}
          remarks={remarks}
          safeInvoiceDiscountAmount={safeInvoiceDiscountAmount}
          subtotal={subtotal}
          onAddPaymentLine={addPaymentLine}
          onClose={() => setPaymentDetailsOpen(false)}
          onInvoiceDiscountChange={setInvoiceDiscountAmount}
          onPaymentAccountChange={setSelectedPaymentAccount}
          onPaymentModeChange={setSelectedPaymentMode}
          onPrintAfterSaleChange={setPrintAfterSale}
          onReceivedAmountChange={setReceivedAmount}
          onReferenceNoChange={setReferenceNo}
          onRemarksChange={setRemarks}
          onRemovePaymentLine={removePaymentLine}
          onTenderKey={handleTenderKey}
          onUpdatePaymentLine={updatePaymentLine}
        />
      ) : null}

      {settingsDetailsOpen ? (
        <PosSettingsDrawer
          company={company}
          conversionRate={conversionRate}
          currency={currency}
          defaults={defaults}
          effectiveProfileName={effectiveProfileName}
          priceList={priceList}
          updateStock={updateStock}
          warehouse={warehouse}
          onClose={() => setSettingsDetailsOpen(false)}
          onCompanyChange={setSelectedCompany}
          onConversionRateChange={setConversionRate}
          onCurrencyChange={setSelectedCurrency}
          onPriceListChange={setSelectedPriceList}
          onProfileChange={setSelectedProfile}
          onUpdateStockChange={setUpdateStock}
          onWarehouseChange={setSelectedWarehouse}
        />
      ) : null}

      {heldDetailsOpen ? (
        <PosHeldCartsDrawer
          heldCarts={heldCarts}
          onClose={() => setHeldDetailsOpen(false)}
          onDeleteHeldCart={deleteHeldCart}
          onRestoreHeldCart={restoreHeldCart}
        />
      ) : null}

      {cancelConfirmOpen ? (
        <div className="pos-drawer-backdrop pos-confirm-backdrop" role="presentation" onMouseDown={() => setCancelConfirmOpen(false)}>
          <div
            aria-label="تأكيد إلغاء الفاتورة الحالية"
            aria-modal="true"
            className="pos-confirm-dialog"
            role="dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="pos-confirm-icon">
              <RotateCcw size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="eyebrow">تأكيد الإلغاء</p>
              <h3>إلغاء الفاتورة الحالية؟</h3>
              <p>سيتم مسح السلة والمدفوعات والخصومات الحالية فقط. لن يتم حذف أي فاتورة معتمدة في ERPNext.</p>
            </div>
            <div className="pos-confirm-actions">
              <button className="button button-secondary" type="button" onClick={() => setCancelConfirmOpen(false)}>
                العودة للكاشير
              </button>
              <button className="button button-danger" type="button" onClick={clearSale}>
                إلغاء الفاتورة
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="pos-register-footer" aria-label="أوامر الكاشير السريعة">
        <Link to="/cash-shifts">
          <DoorOpen size={17} aria-hidden="true" />
          {cashShiftReady ? 'إغلاق الوردية' : 'فتح الوردية'}
        </Link>
        <button type="button" onClick={focusScanner}>
          <Search size={17} aria-hidden="true" />
          بحث / باركود
        </button>
        <button type="button" onClick={() => setSaleDetailsOpen(true)}>
          <HandCoins size={17} aria-hidden="true" />
          بيانات البيع
        </button>
        <button type="button" onClick={() => setPaymentDetailsOpen(true)}>
          <CreditCard size={17} aria-hidden="true" />
          الدفع
        </button>
        <button type="button" onClick={() => setSettingsDetailsOpen(true)}>
          <Gauge size={17} aria-hidden="true" />
          الإعدادات
        </button>
        <button type="button" onClick={() => setHeldDetailsOpen(true)}>
          <PauseCircle size={17} aria-hidden="true" />
          المعلقات {heldCarts.length > 0 ? `(${heldCarts.length})` : ''}
        </button>
        <button disabled={grandTotal <= 0} type="button" onClick={setFullCashPayment}>
          <Banknote size={17} aria-hidden="true" />
          دفع كامل
        </button>
        <button disabled={cart.length === 0} type="button" onClick={holdCurrentCart}>
          <PauseCircle size={17} aria-hidden="true" />
          تعليق
        </button>
        <button type="button" onClick={clearSale}>
          <RotateCcw size={17} aria-hidden="true" />
          فاتورة جديدة
        </button>
        <div className="pos-footer-total">
          <span>المطلوب</span>
          <strong>
            {formatMoney(grandTotal)} {currency}
          </strong>
        </div>
        <button className="primary" disabled={!canCompleteSale || completeSaleMutation.isPending} type="button" onClick={completeSale}>
          <CreditCard size={18} aria-hidden="true" />
          {completeSaleMutation.isPending ? 'جاري الاعتماد' : 'اعتماد البيع'}
        </button>
      </section>
    </div>
  )
}
