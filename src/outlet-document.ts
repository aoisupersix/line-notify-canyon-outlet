/**
 * Outlet information obtained by scraping once
 */
export interface OutletDocument {
    productCount: number
    products: Product[]
    time: Date
}

/**
 * Outlet product
 */
export interface Product {
    name: string
}
