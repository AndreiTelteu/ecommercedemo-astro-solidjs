import { createSignal, For, Show } from 'solid-js';
import { useStore } from '@nanostores/solid';
import useState from '~/lib/useState';
import cart from '~/lib/cart';
import './MiniCartBtn.scss';

export default function MiniCartBtn(props) {
  const state = useState({
  });
  const $cartOpen = useStore(cart.open);
  const $cartItems = useStore(cart.items);
  
  return (
    <div class="mini-cart-wrapper">
      <div class="mini-cart-button" onClick={() => cart.open.set(!cart.open.get())}>
        <span>Cart</span>
        {Object.keys($cartItems()).length}
      </div>
      
      <div class={`mini-cart__sidebar ${$cartOpen() ? 'is-open': 'is-closed'}`}>
        <div class="mini-cart__overlay" onClick={() => cart.open.set(false)}></div>
        <div class="mini-cart__content">
          <div class="mini-cart__header">
            <span>Cart</span>
            {Object.keys($cartItems()).length}
            <button
              class="mini-cart__item-remove is-absolute"
              type="button"
              onClick={() => cart.open.set(false)}
            >X</button>
          </div>
          <div class="mini-cart__body">
            <div class="mini-cart__items">
              <Show
                when={Object.keys($cartItems()).length == 0}
                children={() => (
                  <div class="mini-cart__items-empty">
                    No item in cart. Add one !
                  </div>
                )}
              />
              <For
                each={Object.entries($cartItems())}
                children={([key, item], i) => (
                  <div class="mini-cart__item">
                    <a class="mini-cart__item-img" href={`/product/${item.id}`}>
                      <img src={item.thumbnail} />
                    </a>
                    <div class="mini-cart__item-info">
                      <a class="mini-cart__item-title"  href={`/product/${item.id}`}>
                        {item.title}
                      </a>
                      {/* add product options here */}
                    </div>
                    <div class="mini-cart__item-price">
                      <span>{item.price} $</span>
                      <br /><small>x{item.qty}</small>
                    </div>
                    <div class="mini-cart__item-actions">
                      <button
                        class="mini-cart__item-remove"
                        type="button"
                        onClick={() => cart.remove(item.id)}
                      >X</button>
                    </div>
                  </div>
                )}
          />
            </div>
          </div>
          <div class="mini-cart__actions">
            <button
              class="mini-cart__btn-checkout"
              type="button"
              onClick={() => {}}
            >
              <span>Continue to Checkout</span>
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}