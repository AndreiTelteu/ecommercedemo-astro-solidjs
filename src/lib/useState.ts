import { createSignal, Signal } from "solid-js";

interface StateRef<T> {
  [key: string]: Signal<T>;
}

export default function useState<T>(initialState: T): T {
  const stateRef: StateRef<T> = {};
  Object.entries(initialState).forEach((item) => {
    stateRef[item[0] as string] = createSignal(item[1]);
  });
  const state = new Proxy({}, {
    get(target, key) {
      return stateRef?.[key as string]?.[0]?.() as T;
    },
    set(target, key, value) {
      stateRef?.[key as string]?.[1]?.(value);
      return value;
    },
  });
  return state as T;
}
