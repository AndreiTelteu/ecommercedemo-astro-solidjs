import type { Product } from '~/lib/types';

const api: any = {};

api.getProducts = async (filters = {}) => {
  const data = await fetch("https://dummyjson.com/products?limit=100").then(r => r.json());
  const { products } = data;
  
  let categories: string[] = [];
  products.forEach((item: any) => {
    if (categories.indexOf(item.category) === -1) {
      categories.push(item.category);
    }
  });
  
  return {
    products,
    categories,
  };
};

export default api;
