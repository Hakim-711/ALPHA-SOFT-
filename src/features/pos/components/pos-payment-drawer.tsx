import { Banknote, PlusCircle, Trash2 } from 'lucide-react'
import type { RefObject } from 'react'
import { nonNegativeMoney, roundMoney } from '../calculators/pos-calculations'
import type { PosAccountOption, PosDefaults, PosPaymentDraftLine, PosPaymentLine } from '../types/pos.types'
import { PosDrawer } from './pos-drawer'
import { formatMoney } from '@/shared/utils/format'

interface PosPaymentDrawerProps {
  subtotal: number
  itemDiscountTotal: number
  netTotal: number
  safeInvoiceDiscountAmount: number
  grandTotal: number
  currency: string
  paymentMode: string
  paymentAccount: string
  paymentAccounts: PosAccountOption[]
  paymentModes?: PosDefaults['paymentModes']
  receivedAmount: number
  paymentInputRef: RefObject<HTMLInputElement | null>
  referenceNo: string
  additionalPayments: PosPaymentDraftLine[]
  paymentTotal: number
  remainingAmount: number
  changeAmount: number
  printAfterSale: boolean
  remarks: string
  onClose: () => void
  onInvoiceDiscountChange: (amount: number) => void
  onPaymentModeChange: (value: string) => void
  onPaymentAccountChange: (value: string) => void
  onReceivedAmountChange: (amount: number) => void
  onReferenceNoChange: (value: string) => void
  onAddPaymentLine: () => void
  onUpdatePaymentLine: (id: string, values: Partial<PosPaymentLine>) => void
  onRemovePaymentLine: (id: string) => void
  onTenderKey: (key: string) => void
  onPrintAfterSaleChange: (value: boolean) => void
  onRemarksChange: (value: string) => void
}

export function PosPaymentDrawer({
  subtotal,
  itemDiscountTotal,
  netTotal,
  safeInvoiceDiscountAmount,
  grandTotal,
  currency,
  paymentMode,
  paymentAccount,
  paymentAccounts,
  paymentModes = [],
  receivedAmount,
  paymentInputRef,
  referenceNo,
  additionalPayments,
  paymentTotal,
  remainingAmount,
  changeAmount,
  printAfterSale,
  remarks,
  onClose,
  onInvoiceDiscountChange,
  onPaymentModeChange,
  onPaymentAccountChange,
  onReceivedAmountChange,
  onReferenceNoChange,
  onAddPaymentLine,
  onUpdatePaymentLine,
  onRemovePaymentLine,
  onTenderKey,
  onPrintAfterSaleChange,
  onRemarksChange,
}: PosPaymentDrawerProps) {
  return (
    <PosDrawer ariaLabel="تفاصيل الدفع والخصومات" eyebrow="الدفع" title="الدفع والخصومات" onClose={onClose}>
      <div className="pos-totals">
        <div>
          <span>الإجمالي قبل الخصم</span>
          <strong>
            {formatMoney(subtotal)} {currency}
          </strong>
        </div>
        <div>
          <span>خصم الأصناف</span>
          <strong>
            {formatMoney(itemDiscountTotal)} {currency}
          </strong>
        </div>
        <label>
          <span>خصم الفاتورة</span>
          <input
            max={netTotal}
            min="0"
            type="number"
            value={safeInvoiceDiscountAmount}
            onChange={(event) => onInvoiceDiscountChange(Math.min(netTotal, nonNegativeMoney(event.target.value)))}
          />
        </label>
        <div className="pos-discount-presets">
          {[0, 5, 10, 20].map((percent) => (
            <button key={percent} type="button" onClick={() => onInvoiceDiscountChange(roundMoney(netTotal * (percent / 100)))}>
              {percent}%
            </button>
          ))}
        </div>
        <div className="pos-grand-total">
          <span>المطلوب</span>
          <strong>
            {formatMoney(grandTotal)} {currency}
          </strong>
        </div>
      </div>

      <div className="pos-payment">
        <div className="section-heading">
          <h4>الدفع</h4>
          <p>يدعم الكاش والشبكة والتحويلات مع أكثر من طريقة دفع في نفس الفاتورة.</p>
        </div>

        <div className="pos-payment-line">
          <label className="field">
            <span>طريقة الدفع</span>
            <select value={paymentMode} onChange={(event) => onPaymentModeChange(event.target.value)}>
              {paymentModes.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>حساب التحصيل</span>
            <select value={paymentAccount} onChange={(event) => onPaymentAccountChange(event.target.value)}>
              <option value="">من إعدادات ERPNext</option>
              {paymentAccounts.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>المبلغ المستلم</span>
            <input
              ref={paymentInputRef}
              min="0"
              type="number"
              value={receivedAmount}
              onChange={(event) => onReceivedAmountChange(nonNegativeMoney(event.target.value))}
            />
          </label>

          <label className="field">
            <span>مرجع الدفع</span>
            <input value={referenceNo} onChange={(event) => onReferenceNoChange(event.target.value)} />
          </label>
        </div>

        {additionalPayments.map((payment) => (
          <div className="pos-payment-line with-remove" key={payment.id}>
            <label className="field">
              <span>طريقة إضافية</span>
              <select value={payment.mode_of_payment} onChange={(event) => onUpdatePaymentLine(payment.id, { mode_of_payment: event.target.value })}>
                {paymentModes.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>الحساب</span>
              <select value={payment.account ?? ''} onChange={(event) => onUpdatePaymentLine(payment.id, { account: event.target.value })}>
                <option value="">من إعدادات ERPNext</option>
                {paymentAccounts.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>المبلغ</span>
              <input min="0" type="number" value={payment.amount} onChange={(event) => onUpdatePaymentLine(payment.id, { amount: nonNegativeMoney(event.target.value) })} />
            </label>
            <label className="field">
              <span>المرجع</span>
              <input value={payment.reference_no ?? ''} onChange={(event) => onUpdatePaymentLine(payment.id, { reference_no: event.target.value })} />
            </label>
            <button className="icon-button" type="button" onClick={() => onRemovePaymentLine(payment.id)}>
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}

        <button className="button button-secondary" type="button" onClick={onAddPaymentLine}>
          <PlusCircle size={16} aria-hidden="true" />
          إضافة طريقة دفع
        </button>

        <div className="pos-quick-cash">
          {[grandTotal, grandTotal + 100, grandTotal + 500, grandTotal + 1000].filter((value) => value > 0).map((value) => (
            <button key={value} type="button" onClick={() => onReceivedAmountChange(roundMoney(value))}>
              <Banknote size={15} aria-hidden="true" />
              {formatMoney(value)}
            </button>
          ))}
        </div>

        <div className="pos-cash-keypad" aria-label="لوحة الدفع السريع">
          {['7', '8', '9', 'clear', '4', '5', '6', 'backspace', '1', '2', '3', '+100', '0', '00', '.', 'full'].map((key) => (
            <button className={key === 'full' ? 'primary' : undefined} key={key} type="button" onClick={() => onTenderKey(key)}>
              {key === 'clear' ? 'C' : key === 'backspace' ? '⌫' : key === 'full' ? 'كامل' : key}
            </button>
          ))}
        </div>

        <div className="pos-payment-status">
          <div>
            <span>المدفوع</span>
            <strong>
              {formatMoney(paymentTotal)} {currency}
            </strong>
          </div>
          <div>
            <span>المتبقي</span>
            <strong>
              {formatMoney(remainingAmount)} {currency}
            </strong>
          </div>
          <div>
            <span>الباقي للعميل</span>
            <strong>
              {formatMoney(changeAmount)} {currency}
            </strong>
          </div>
        </div>

        <label className="check-field">
          <input checked={printAfterSale} type="checkbox" onChange={(event) => onPrintAfterSaleChange(event.target.checked)} />
          طباعة الإيصال بعد البيع
        </label>

        <label className="field">
          <span>ملاحظات</span>
          <textarea rows={3} value={remarks} onChange={(event) => onRemarksChange(event.target.value)} />
        </label>
      </div>
    </PosDrawer>
  )
}
