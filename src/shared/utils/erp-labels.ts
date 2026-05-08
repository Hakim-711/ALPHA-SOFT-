const exactLabels: Record<string, string> = {
  Administrator: 'المدير',
  'Bank Draft': 'حوالة بنكية',
  Cash: 'نقدي',
  Cheque: 'شيك',
  'Credit Card': 'بطاقة ائتمان',
  'Wire Transfer': 'تحويل بنكي',
  'Charter (Demo)': 'شركة تشارتر (تجريبية)',
  POS: 'نقطة البيع',
  'POS Profile': 'ملف نقطة البيع',
  'POS Opening Entry': 'وردية افتتاح الكاشير',
  'POS Closing Entry': 'إغلاق وردية الكاشير',
  YER: 'ريال يمني',
  SAR: 'ريال سعودي',
  USD: 'دولار',
}

const termLabels: Array<[RegExp, string]> = [
  [/\bBank Draft\b/gi, 'حوالة بنكية'],
  [/\bCredit Card\b/gi, 'بطاقة ائتمان'],
  [/\bWire Transfer\b/gi, 'تحويل بنكي'],
  [/\bCash\b/gi, 'نقدي'],
  [/\bCheque\b/gi, 'شيك'],
  [/\bAdministrator\b/gi, 'المدير'],
  [/\bCharter\b/gi, 'تشارتر'],
  [/\bDemo\b/gi, 'تجريبي'],
  [/\bPOS Profile\b/gi, 'ملف نقطة البيع'],
  [/\bPOS Opening Entry\b/gi, 'وردية افتتاح الكاشير'],
  [/\bPOS Closing Entry\b/gi, 'إغلاق وردية الكاشير'],
  [/\bPOS\b/gi, 'نقطة البيع'],
]

export function displayErpLabel(value?: string | null) {
  const label = value?.trim()

  if (!label) {
    return '-'
  }

  const exact = exactLabels[label]

  if (exact) {
    return exact
  }

  return termLabels.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), label)
}
