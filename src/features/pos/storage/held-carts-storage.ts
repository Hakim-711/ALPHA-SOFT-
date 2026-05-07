import type { HeldPosCart } from '../types/pos.types'

const HELD_CARTS_KEY = 'alpha-neqat.pos.held-carts.v1'

export function readHeldCarts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HELD_CARTS_KEY) || '[]') as HeldPosCart[]

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeHeldCarts(carts: HeldPosCart[]) {
  localStorage.setItem(HELD_CARTS_KEY, JSON.stringify(carts))
}
