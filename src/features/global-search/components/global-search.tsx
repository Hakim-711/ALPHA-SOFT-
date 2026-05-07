import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GlobalSearchPermissions } from '../api/global-search.api'
import { useGlobalSearch } from '../hooks/use-global-search'

interface GlobalSearchProps {
  permissions: GlobalSearchPermissions
}

export function GlobalSearch({ permissions }: GlobalSearchProps) {
  const [term, setTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const searchQuery = useGlobalSearch(term, permissions)
  const sections = searchQuery.data ?? []
  const firstResultPath = searchQuery.data?.[0]?.items[0]?.path ?? searchQuery.data?.[0]?.listPath
  const hasAnyPermission =
    permissions.accounts ||
    permissions.customers ||
    permissions.suppliers ||
    permissions.items ||
    permissions.salesOrders ||
    permissions.purchaseOrders ||
    permissions.purchaseInvoices ||
    permissions.collections ||
    permissions.disbursements ||
    permissions.stockEntries ||
    permissions.stockReconciliations ||
    permissions.salesInvoices
  const trimmedTerm = term.trim()
  const showPanel = isOpen && hasAnyPermission

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  function handleNavigate(path: string) {
    navigate(path)
    setIsOpen(false)
    setTerm('')
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!firstResultPath) {
      return
    }

    handleNavigate(firstResultPath)
  }

  return (
    <div className="global-search-shell" ref={containerRef}>
      <form className="global-search" onSubmit={handleSubmit}>
        <Search size={17} aria-hidden="true" />
        <input
          disabled={!hasAnyPermission}
          placeholder={hasAnyPermission ? 'ابحث عن عميل أو مورد أو صنف أو فاتورة أو حركة مخزون' : 'لا توجد صلاحيات للبحث'}
          value={term}
          onChange={(event) => {
            setTerm(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setIsOpen(false)
            }
          }}
        />
      </form>

      {showPanel ? (
        <div className="global-search-panel" role="dialog" aria-label="نتائج البحث العام">
          {!trimmedTerm ? <p className="global-search-hint">ابدأ بكتابة كلمة بحث لعرض النتائج مباشرة.</p> : null}
          {trimmedTerm && trimmedTerm.length < 2 ? <p className="global-search-hint">اكتب حرفين على الأقل حتى نبحث داخل السجلات.</p> : null}
          {trimmedTerm.length >= 2 && searchQuery.isLoading ? <p className="global-search-hint">جاري البحث في السجلات المتاحة...</p> : null}
          {trimmedTerm.length >= 2 && searchQuery.isError ? <p className="global-search-hint">تعذر جلب نتائج البحث الآن. حاول مرة أخرى.</p> : null}
          {trimmedTerm.length >= 2 && !searchQuery.isLoading && !searchQuery.isError && sections.length === 0 ? (
            <p className="global-search-hint">لا توجد نتائج مطابقة في الوحدات المنفذة حاليًا.</p>
          ) : null}

          {sections.map((section) => (
            <section className="global-search-section" key={section.key}>
              <div className="global-search-section-head">
                <strong>{section.label}</strong>
                <button className="global-search-link" type="button" onClick={() => handleNavigate(section.listPath)}>
                  عرض الكل
                </button>
              </div>
              <div className="global-search-results">
                {section.items.map((item) => (
                  <button
                    className="global-search-result"
                    key={`${section.key}-${item.id}`}
                    type="button"
                    onClick={() => handleNavigate(item.path)}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.subtitle}</span>
                    </div>
                    {item.meta ? <small>{item.meta}</small> : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}
