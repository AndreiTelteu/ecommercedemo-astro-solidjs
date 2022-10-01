import { createResource, createSignal, For, onMount, Show } from 'solid-js';
import useState from '~/lib/useState';
import cart from '~/lib/cart';
import './ProductDetails.scss';

export default function ProductDetails({ product, carousel = null }) {
  
  return (
    <div class="product-details">
      
      <div class="product-details-header">
        <div class="product-details-header__container">
          
          <div class="product-details-header__preview">
            {carousel}
          </div>
          
          <div class="product-details-header__info">
            <h1 class="product-details-header__title">
              {product.title}
            </h1>
            price si chestii
          </div>
          
        </div>
      </div>
      
    </div>
  );
}
