import { Suspense } from 'react';
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import AddToCartButton from "@/components/add-to-cart-button";
import ProductImageGallery from "@/components/product-image-gallery";

async function getProduct(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      product_variants(*),
      categories:category_id(id, name, slug)
    `)
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getRelatedProducts(categoryId: string, currentProductId: string) {
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      categories:category_id(name)
    `)
    .eq('category_id', categoryId)
    .eq('is_published', true)
    .neq('id', currentProductId)
    .limit(4);

  return data || [];
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = product.category_id
    ? await getRelatedProducts(product.category_id, product.id)
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <nav className="text-sm breadcrumbs">
          <ol className="flex items-center space-x-1">
            <li>
              <Link href="/" className="text-gray-500 hover:text-blue-600">
                Home
              </Link>
              <span className="mx-1">/</span>
            </li>
            <li>
              <Link href="/products" className="text-gray-500 hover:text-blue-600">
                Products
              </Link>
              <span className="mx-1">/</span>
            </li>
            {product.categories && (
              <li>
                <Link 
                  href={`/products?category=${product.categories.slug}`}
                  className="text-gray-500 hover:text-blue-600"
                >
                  {product.categories.name}
                </Link>
                <span className="mx-1">/</span>
              </li>
            )}
            <li className="text-gray-900 font-medium">{product.name}</li>
          </ol>
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div>
          <Suspense fallback={<div className="h-96 bg-gray-100 rounded-lg animate-pulse"></div>}>
            <ProductImageGallery images={product.product_images || []} productName={product.name} />
          </Suspense>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          {/* Price */}
          <div className="mb-4">
            <span className="text-2xl font-bold mr-2">
              {formatPrice(product.price)}
            </span>
            
            {product.compare_at_price && product.compare_at_price > product.price && (
              <>
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded">
                  Save {formatPrice(product.compare_at_price - product.price)}
                </span>
              </>
            )}
          </div>

          {/* Availability */}
          <div className="mb-4">
            <p className={`text-sm ${product.inventory_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.inventory_quantity > 0 
                ? `In Stock (${product.inventory_quantity} available)` 
                : 'Out of Stock'}
            </p>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6 text-gray-700">
              <h2 className="font-semibold mb-2">Description</h2>
              <p>{product.description}</p>
            </div>
          )}

          {/* Variants Selection */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold mb-2">Options</h2>
              <AddToCartButton 
                product={product} 
                variants={product.product_variants} 
              />
            </div>
          )}

          {/* Simple Add to Cart (if no variants) */}
          {(!product.product_variants || product.product_variants.length === 0) && (
            <div className="mb-6">
              <AddToCartButton product={product} />
            </div>
          )}

          {/* Additional Info */}
          <div className="mt-auto">
            <div className="border-t pt-4">
              {product.sku && (
                <p className="text-sm text-gray-500 mb-1">
                  SKU: {product.sku}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Category: {product.categories?.name || 'Uncategorized'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Link 
                key={relatedProduct.id} 
                href={`/products/${relatedProduct.slug}`}
                className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48">
                  {relatedProduct.product_images && relatedProduct.product_images.length > 0 ? (
                    <Image
                      src={relatedProduct.product_images[0].url}
                      alt={relatedProduct.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-gray-600 mt-1">{formatPrice(relatedProduct.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}