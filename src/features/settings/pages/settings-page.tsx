import { Save, Store, WalletCards } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { Breadcrumbs } from '@/shared/ui/breadcrumbs'
import { PageHeader } from '@/shared/ui/page-header'
import { getStorePreferences, saveStorePreferences, type StorePreferences } from '@/core/config/store-preferences'

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<StorePreferences>(() => getStorePreferences())
  const [saved, setSaved] = useState(false)

  function updateField<Key extends keyof StorePreferences>(key: Key, value: StorePreferences[Key]) {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }))
    setSaved(false)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    saveStorePreferences(preferences)
    setSaved(true)
  }

  return (
    <>
      <Breadcrumbs items={[{ label: 'الإعدادات' }]} />
      <PageHeader
        eyebrow="إعدادات المحل"
        subtitle="إعدادات محلية للواجهة فقط: اسم المحل، الفرع، العملة الافتراضية، مدة الدين، وتنبيه المخزون. منطق ERPNext يبقى هو المصدر الحقيقي."
        title="إعدادات محل اليمن ومأرب"
      />

      {saved ? (
        <div className="inline-alert inline-alert-success" role="status">
          <Save size={18} aria-hidden="true" />
          <span>تم حفظ إعدادات الواجهة لهذا الجهاز.</span>
        </div>
      ) : null}

      <form className="form-layout settings-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <div>
            <p className="eyebrow">Store Profile</p>
            <h3>هوية المحل والفرع</h3>
            <p>هذه البيانات تساعد الكاشير والمالك على معرفة الفرع والسياق أثناء البيع والطباعة.</p>
          </div>
          <Store size={28} aria-hidden="true" />
        </div>

        <div className="field-grid">
          <label className="field">
            <span>اسم المحل</span>
            <input value={preferences.storeName} onChange={(event) => updateField('storeName', event.target.value)} />
          </label>
          <label className="field">
            <span>اسم الفرع</span>
            <input value={preferences.branchName} onChange={(event) => updateField('branchName', event.target.value)} />
          </label>
          <label className="field">
            <span>المدينة</span>
            <select value={preferences.city} onChange={(event) => updateField('city', event.target.value)}>
              <option value="مأرب">مأرب</option>
              <option value="صنعاء">صنعاء</option>
              <option value="عدن">عدن</option>
              <option value="تعز">تعز</option>
              <option value="إب">إب</option>
              <option value="أخرى">أخرى</option>
            </select>
          </label>
          <label className="field">
            <span>العملة الافتراضية</span>
            <select value={preferences.defaultCurrency} onChange={(event) => updateField('defaultCurrency', event.target.value)}>
              <option value="YER">YER - ريال يمني</option>
              <option value="SAR">SAR - ريال سعودي</option>
              <option value="USD">USD - دولار</option>
            </select>
          </label>
        </div>

        <div className="form-header">
          <div>
            <p className="eyebrow">Operations</p>
            <h3>إعدادات التشغيل اليومية</h3>
            <p>قيم افتراضية تساعد في البيع الآجل والمخزون والطباعة.</p>
          </div>
          <WalletCards size={28} aria-hidden="true" />
        </div>

        <div className="field-grid">
          <label className="field">
            <span>مدة الدين الافتراضية بالأيام</span>
            <input
              min="0"
              type="number"
              value={preferences.defaultCreditDueDays}
              onChange={(event) => updateField('defaultCreditDueDays', Number(event.target.value))}
            />
          </label>
          <label className="field">
            <span>حد تنبيه المخزون الناقص</span>
            <input
              min="0"
              type="number"
              value={preferences.lowStockAlertQty}
              onChange={(event) => updateField('lowStockAlertQty', Number(event.target.value))}
            />
          </label>
          <label className="check-field field-wide">
            <input checked={preferences.printAfterSale} type="checkbox" onChange={(event) => updateField('printAfterSale', event.target.checked)} />
            طباعة الإيصال مباشرة بعد البيع النقدي
          </label>
          <label className="check-field field-wide">
            <input checked={preferences.posUpdatesStock} type="checkbox" onChange={(event) => updateField('posUpdatesStock', event.target.checked)} />
            نقطة البيع تؤثر على المخزون افتراضيًا
          </label>
          <label className="field field-wide">
            <span>نص أسفل الإيصال</span>
            <textarea rows={3} value={preferences.receiptFooter} onChange={(event) => updateField('receiptFooter', event.target.value)} />
          </label>
        </div>

        <div className="page-actions">
          <button className="button button-primary" type="submit">
            <Save size={17} aria-hidden="true" />
            حفظ الإعدادات
          </button>
        </div>
      </form>
    </>
  )
}
