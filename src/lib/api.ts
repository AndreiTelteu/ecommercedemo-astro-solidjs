import axios from 'axios';
import type { Product } from '~/lib/types';

const api: any = {};

api.getProducts = async (filters = {}) => {
  const { data } = await axios.get("https://dummyjson.com/products?limit=100");
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
