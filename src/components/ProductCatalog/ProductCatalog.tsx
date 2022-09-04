import { createResource, createSignal, For, onMount } from 'solid-js';
import api from '~/lib/api';
import Fuse from 'fuse.js';
import './ProductCatalog.scss';

export default function ProductCatalog(props) {
  const [filters, setFilters] = createSignal({
    search: '',
    categories: [],
  });
  const [data] = createResource(filters, async (filters) => {
    if (filters.search == '' && filters.categories.length == 0) {
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
    setFilters({
      search: '',
      categories: [],
    });
  }
  
  let searchTimeout = null;
  function handleSearch(event) {
    if (searchTimeout) { clearTimeout(searchTimeout); searchTimeout = null; }
    searchTimeout = setTimeout(() => {
      setFilters({...filters(), search: event.target.value})
    }, 150);
  }
  
  return (
    <div>
      <div class="product-catalog__filters">
        <div class="product-catalog__search">
          <input value={filters().search} onInput={handleSearch} />
        </div>
        <div class="product-catalog__categories">
          
        </div>
      </div>
      <div class="product-catalog__list">
        <span>{data.loading && "Loading..."}</span>
        <For each={data()?.products} children={(item: any, i) => (
          <a href={`/product/${item.id}`} class="product-catalog__item">
            <img src={item.thumbnail} class="product-catalog__img" />
            <div class="product-catalog__info">
              
            </div>
          </a>
        )} />
      </div>
    </div>
  );
}

