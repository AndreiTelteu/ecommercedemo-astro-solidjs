import { atom, map, MapStore, WritableAtom } from 'nanostores';
import type { Product, CartProduct } from '~/lib/types';

interface CartStore {
  open: WritableAtom<Boolean>,
  items: MapStore<Record<string, CartProduct>>,
  add: Function,
  edit: Function,
  remove: Function,
  reset: Function,
}

export const open = atom(false);

export const items = map<Record<string, CartProduct>>({});

export const generateItemKey = (item: Product) => {
  return item.id; // to combine with product options/variants in the future
}

const add = (item: Product) => {
  const key = generateItemKey(item);
  const existingEntry = items.get()[key];
  if (existingEntry) {
    items.setKey(key, {
      ...existingEntry,
      qty: (existingEntry.qty || 0) + 1,
    });
  } else {
    items.setKey(key, { ...item, key, qty: 1 });
  }
  save();
};

const edit = (key: string, toUpdate: any) => {
  if (typeof toUpdate?.qty !== 'undefined' && toUpdate?.qty < 1) {
    return remove(key);
  }
  const existingEntry = items.get()[key];
  items.setKey(key, { ...(existingEntry || {}), ...toUpdate });
  save();
};

const remove = (key: string) => {
  let newItems = { ...items.get() };
  try {
    delete newItems[key];
  } catch (e) {}
  items.set(newItems);
  save(newItems);
};

const reset = () => {
  items.set({});
  save({});
};

const init = () => {
  if (!window?.localStorage) return;
  let existingCart: any = window.localStorage.getItem('astro-cart');
  try {
    existingCart = JSON.parse(existingCart);
  } catch (e) {
    existingCart = {};
  }
  if (existingCart && Object.keys(existingCart).length) {
    items.set(existingCart);
  }
}
const save = (newItems = null) => {
  if (!window?.localStorage) return;
  if (newItems == null) newItems = items.get()
  window.localStorage.setItem('astro-cart', JSON.stringify(newItems))
};

init();

const cart: CartStore = {
  open,
  items,
  add,
  edit,
  remove,
  reset,
};
export default cart;
