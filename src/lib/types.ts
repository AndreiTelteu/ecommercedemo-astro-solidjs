
export type Product = {
    id: string,
    title: string,
    price: number,
    discountPercentage: number,
    thumbnail: string,
}

export type CartProduct = Product & {
    key: string,
    qty: number,
}
