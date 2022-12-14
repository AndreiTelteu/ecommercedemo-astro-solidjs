import { createResource, createSignal, For, onMount, Show } from 'solid-js';
import api from '~/lib/api';
import useState from '~/lib/useState';
import cart from '~/lib/cart';
import Fuse from 'fuse.js';
import Loader from '~/components/Loader/Loader';
import './ProductCatalog.scss';

export default function ProductCatalog(props) {
  const state = useState({
    showFilters: false,
    filters: {
      search: '',
      categories: [],
    },
  });
  
  function searchIsEmpty(filtersState = null) {
    if (filtersState === null) filtersState = state.filters;
    return filtersState.search == '' && filtersState.categories.length == 0;
  }
  
  const [data] = createResource(() => state.filters, async (filters) => {
    if (searchIsEmpty(filters)) {
      return props; // initial pageload with hidrated data from ssr
    }
    let { products, categories } = await api.getProducts();
    if (filters.search) {
      let searchResults = await searchIndex.search(filters.search);
      products = searchResults.map(({item}) => item);
    }
    if (filters.categories.length > 0) {
      products = products.filter((item) => filters.categories.includes(item.category));
    }
    return { products, categories };
  }, {
    initialValue: props,
    ssrLoadFrom: 'initial',
  });
  
  let searchIndex;
  onMount(() => {
    searchIndex = new Fuse(props.products, {
      keys: [
        { name: 'title', weight: 1 },
        { name: 'description', weight: 0.5 },
      ],
      threshold: 0.4,
    });
  });
  
  function resetFilters() {
    state.filters = {
      search: '',
      categories: [],
    };
  }
  
  let searchTimeout = null;
  function handleSearch(event) {
    if (searchTimeout) { clearTimeout(searchTimeout); searchTimeout = null; }
    searchTimeout = setTimeout(() => {
      state.filters = { ...state.filters, search: event.target.value };
    }, 150);
  }
  
  function handleCategoryToggle(item) {
    const selected = state.filters.categories.includes(item);
    const categories = [ ...state.filters.categories ];
    if (selected) {
      categories.splice(categories.indexOf(item), 1);
    } else {
      categories.push(item)
    }
    state.filters = {...state.filters, categories};
  }
  
  return (
    <div class="product-catalog__columns">
      <div class={`product-catalog__filters ${state.showFilters ? 'is-visible':''}`}>
        <div class="product-catalog__filters-inner">
          <button class="product-catalog__filters-toggle" onClick={() => state.showFilters = !state.showFilters}>
            {state.showFilters ? '-' : '+'}
          </button>
          <div class="product-catalog__search">
            <label>Filters</label>
            <input
              value={state.filters.search} onInput={handleSearch}
              placeholder="Search by name"
            />
          </div>
          <div class="product-catalog__categories">
            <label>Categories</label>
            <div class="product-catalog__categories-list">
              <For each={data()?.categories || []} children={(item: any, i) => {
                const selected = () => state.filters.categories.includes(item);
                return (
                  <label class={selected() ? 'is-selected' : ''}>
                    <input
                      type="checkbox"
                      checked={selected()}
                      onchange={() => handleCategoryToggle(item)}
                    />
                    <span>{item}</span><br />
                  </label>
                )
              }} />
            </div>
          </div>
        </div>
      </div>
      
      <div class="product-catalog__list">
        <div class="product-catalog__wrapper">
          <Show
            when={data.loading}
            children={() => (
              <For each={Array(6).fill(1)} children={() => (
                <div class="product-catalog__item">
                  <div class="product-catalog__img">
                    <Loader />
                  </div>
                </div>
              )} />
            )}
          />
          <For
            each={data.loading ? [] : (data()?.products || [])}
            children={(item: any, i) => (
              <a href={`/product/${item.id}`} class="product-catalog__item">
                <img src={item.thumbnail} class="product-catalog__img" />
                <div class="product-catalog__info">
                  <div class="product-catalog__title">
                    {item.title}
                  </div>
                  <div class="product-catalog__price">
                    <span>{item.price} $</span>
                    <button
                      type="button"
                      class="product-catalog__buy"
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); cart.add(item) }}
                    >Buy</button>
                  </div>
                </div>
              </a>
            )}
          />
        </div>
      </div>
    </div>
  );
}

