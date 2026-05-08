import { positiveNumber } from '../calculators/pos-calculations'
import type { PosDefaults } from '../types/pos.types'
import { PosDrawer } from './pos-drawer'
import { displayErpLabel } from '@/shared/utils/erp-labels'

interface PosSettingsDrawerProps {
  effectiveProfileName: string
  defaults?: PosDefaults
  company: string
  updateStock: boolean
  warehouse: string
  priceList: string
  currency: string
  conversionRate: number
  onClose: () => void
  onProfileChange: (value: string) => void
  onCompanyChange: (value: string) => void
  onUpdateStockChange: (value: boolean) => void
  onWarehouseChange: (value: string) => void
  onPriceListChange: (value: string) => void
  onCurrencyChange: (value: string) => void
  onConversionRateChange: (value: number) => void
}

export function PosSettingsDrawer({
  effectiveProfileName,
  defaults,
  company,
  updateStock,
  warehouse,
  priceList,
  currency,
  conversionRate,
  onClose,
  onProfileChange,
  onCompanyChange,
  onUpdateStockChange,
  onWarehouseChange,
  onPriceListChange,
  onCurrencyChange,
  onConversionRateChange,
}: PosSettingsDrawerProps) {
  return (
    <PosDrawer ariaLabel="إعدادات نقطة البيع" eyebrow="الإعدادات" title="إعدادات الفاتورة والمخزون" onClose={onClose}>
      <div className="pos-settings">
        <label className="field">
          <span>ملف نقطة البيع</span>
          <select value={effectiveProfileName} onChange={(event) => onProfileChange(event.target.value)}>
            <option value="">بدون ملف</option>
            {defaults?.profiles.map((profile) => (
              <option key={profile.name} value={profile.name}>
                {displayErpLabel(profile.name)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>الشركة</span>
          <select value={company} onChange={(event) => onCompanyChange(event.target.value)}>
            {defaults?.companies.map((option) => (
              <option key={option.name} value={option.name}>
                {displayErpLabel(option.name)}
              </option>
            ))}
          </select>
        </label>

        <div className={updateStock ? 'pos-stock-toggle active' : 'pos-stock-toggle'}>
          <label className="check-field">
            <input checked={updateStock} type="checkbox" onChange={(event) => onUpdateStockChange(event.target.checked)} />
            تأثير البيع على المخزون
          </label>
          <p>
            {updateStock
              ? 'سيتم خصم الأصناف من المخزن المحدد، وسيمنع النظام البيع إذا الكمية غير كافية.'
              : 'سيتم إنشاء فاتورة البيع بدون خصم من المخزون. مناسب للمحلات التي لا تدير الكميات أو تبيع خدمات.'}
          </p>
        </div>

        <label className="field">
          <span>المخزن</span>
          <select disabled={!updateStock} value={warehouse} onChange={(event) => onWarehouseChange(event.target.value)}>
            <option value="">بدون مخزن</option>
            {defaults?.warehouses.map((option) => (
              <option key={option.name} value={option.name}>
                {displayErpLabel(option.name)}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>قائمة الأسعار</span>
          <select value={priceList} onChange={(event) => onPriceListChange(event.target.value)}>
            {defaults?.priceLists.map((option) => (
              <option key={option.name} value={option.name}>
                {displayErpLabel(option.name)}
              </option>
            ))}
          </select>
        </label>

        <div className="field-grid compact-fields">
          <label className="field">
            <span>العملة</span>
            <input value={currency} onChange={(event) => onCurrencyChange(event.target.value)} />
          </label>
          <label className="field">
            <span>الصرف</span>
            <input
              min="0.0001"
              step="0.0001"
              type="number"
              value={conversionRate}
              onChange={(event) => onConversionRateChange(positiveNumber(event.target.value, 1))}
            />
          </label>
        </div>

        <div className="pos-currency-presets">
          {['YER', 'SAR', 'USD'].map((code) => (
            <button
              className={currency === code ? 'active' : undefined}
              key={code}
              type="button"
              onClick={() => {
                onCurrencyChange(code)
                if (code === 'YER') {
                  onConversionRateChange(1)
                }
              }}
            >
              {code}
            </button>
          ))}
        </div>

        <p className="pos-local-note">في مأرب واليمن راجع سعر الصرف قبل اعتماد الفاتورة، خصوصًا عند البيع بالسعودي أو الدولار.</p>
      </div>
    </PosDrawer>
  )
}
