import { getProducts } from "@/actions/product.actions";
import { ProductClient } from "@/components/products/product-client";

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <ProductClient initialProducts={products} />
        </div>
    );
}
