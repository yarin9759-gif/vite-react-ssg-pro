import { useSyncExternalStore } from 'react';

// Shopping cart: product id -> quantity, persisted in localStorage.
type Cart = Record<string, number>;

const STORAGE_KEY = 'cart';
const EMPTY: Cart = {};

function load(): Cart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Cart) : EMPTY;
  } catch {
    return EMPTY;
  }
}

let cart: Cart = load();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function save(next: Cart) {
  cart = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable (private mode) - cart still works for this visit
  }
  listeners.forEach((listener) => listener());
}

export function useCart() {
  return useSyncExternalStore(subscribe, () => cart, () => EMPTY);
}

export function setQuantity(id: string, quantity: number) {
  const next = { ...cart };
  if (quantity > 0) next[id] = quantity;
  else delete next[id];
  save(next);
}

export function clearCart() {
  save(EMPTY);
}
