
export type Product = {
    id: string,
    title: string,
    price: number,
    discountPercentage: number,
}

export type CartProduct = Product & {
    key: string,
    qty: number,
}
