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

const open = atom(false);

const items = map<Record<string, CartProduct>>({});

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
};

const edit = (key: string, toUpdate: any) => {
  if (typeof toUpdate?.qty !== 'undefined' && toUpdate?.qty < 1) {
    return remove(key);
  }
  const existingEntry = items.get()[key];
  items.setKey(key, { ...(existingEntry || {}), ...toUpdate });
};

const remove = (key: string) => {
  let newItems = { ...items.get() };
  try {
    delete newItems[key];
  } catch (e) {}
  items.set(newItems);
};

const reset = () => {
  items.set({});
};

const cart: CartStore = {
  open,
  items,
  add,
  edit,
  remove,
  reset,
};
export default cart;
