import { PauseCircle, Save, Trash2 } from 'lucide-react'
import type { HeldPosCart } from '../types/pos.types'
import { PosDrawer } from './pos-drawer'

interface PosHeldCartsDrawerProps {
  heldCarts: HeldPosCart[]
  onClose: () => void
  onRestoreHeldCart: (heldCart: HeldPosCart) => void
  onDeleteHeldCart: (id: string) => void
}

export function PosHeldCartsDrawer({
  heldCarts,
  onClose,
  onRestoreHeldCart,
  onDeleteHeldCart,
}: PosHeldCartsDrawerProps) {
  return (
    <PosDrawer
      ariaLabel="الفواتير المعلقة"
      doneLabel="العودة للكاشير"
      eyebrow="المعلقات"
      title="الفواتير المعلقة"
      onClose={onClose}
    >
      <div className="pos-held-panel">
        <div className="section-heading">
          <h4>الفواتير المعلقة</h4>
        </div>

        {heldCarts.length === 0 ? (
          <div className="state-block">
            <div className="state-heading">
              <PauseCircle size={22} aria-hidden="true" />
              <div>
                <h3>لا توجد فواتير معلقة</h3>
                <p>عند تعليق فاتورة ستظهر هنا لاسترجاعها لاحقًا.</p>
              </div>
            </div>
          </div>
        ) : (
          heldCarts.map((heldCart) => (
            <div className="pos-held-row" key={heldCart.id}>
              <button type="button" onClick={() => onRestoreHeldCart(heldCart)}>
                <Save size={15} aria-hidden="true" />
                {heldCart.label}
              </button>
              <button className="icon-button" type="button" onClick={() => onDeleteHeldCart(heldCart.id)}>
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>
    </PosDrawer>
  )
}
