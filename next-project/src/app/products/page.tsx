import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";

async function getProducts(
  searchParams: { category?: string; sort?: string; order?: string }
) {
  let query = supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      categories:category_id(id, name, slug)
    `)
    .eq('is_published', true);

  // Safely access parameters
  const category = searchParams.category || '';
  const sortField = searchParams.sort || 'created_at';
  const sortOrder = searchParams.order === 'asc' ? true : false;

  // Apply category filter
  if (category) {
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();

    if (categoryData) {
      query = query.eq('category_id', categoryData.id);
    }
  }

  // Apply sorting
  const { data, error } = await query.order(sortField, { ascending: sortOrder });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data;
}

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('name, slug')
    .order('name', { ascending: true });
    
  return data || [];
}

// Create helper function to build URL with params
function buildFilterUrl(baseParams: {category?: string}, newParams: {sort?: string, order?: string}) {
  const params = new URLSearchParams();
  
  if (baseParams.category) {
    params.set('category', baseParams.category);
  }
  
  if (newParams.sort) {
    params.set('sort', newParams.sort);
  }
  
  if (newParams.order) {
    params.set('order', newParams.order);
  }
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; order?: string };
}) {
  // Create serialized copies of search parameters that won't trigger the warning
  const category = searchParams.category || '';
  const sort = searchParams.sort || 'created_at';
  const order = searchParams.order || 'desc';
  
  const productsPromise = getProducts(searchParams);
  const categoriesPromise = getCategories();
  
  const [products, categories] = await Promise.all([
    productsPromise,
    categoriesPromise
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar with filters */}
        <div className="lg:w-1/4">
          <div className="border rounded-lg p-4 sticky top-4">
            <h2 className="text-lg font-medium mb-4">Categories</h2>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/products" 
                  className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                    !category ? 'font-medium text-blue-600' : ''
                  }`}
                >
                  All Categories
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link 
                    href={`/products?category=${cat.slug}`} 
                    className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                      category === cat.slug ? 'font-medium text-blue-600' : ''
                    }`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="border-t my-4 pt-4">
              <h2 className="text-lg font-medium mb-4">Sort By</h2>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href={`/products${buildFilterUrl({category}, {sort: 'created_at', order: 'desc'})}`}
                    className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                      (sort === 'created_at' || !sort) && 
                      (order === 'desc' || !order) ? 'font-medium text-blue-600' : ''
                    }`}
                  >
                    Newest First
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/products${buildFilterUrl({category}, {sort: 'created_at', order: 'asc'})}`}
                    className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                      sort === 'created_at' && order === 'asc' ? 'font-medium text-blue-600' : ''
                    }`}
                  >
                    Oldest First
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/products${buildFilterUrl({category}, {sort: 'price', order: 'asc'})}`}
                    className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                      sort === 'price' && order === 'asc' ? 'font-medium text-blue-600' : ''
                    }`}
                  >
                    Price: Low to High
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/products${buildFilterUrl({category}, {sort: 'price', order: 'desc'})}`}
                    className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                      sort === 'price' && order === 'desc' ? 'font-medium text-blue-600' : ''
                    }`}
                  >
                    Price: High to Low
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/products${buildFilterUrl({category}, {sort: 'name', order: 'asc'})}`}
                    className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                      sort === 'name' && order === 'asc' ? 'font-medium text-blue-600' : ''
                    }`}
                  >
                    Name: A-Z
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/products${buildFilterUrl({category}, {sort: 'name', order: 'desc'})}`}
                    className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                      sort === 'name' && order === 'desc' ? 'font-medium text-blue-600' : ''
                    }`}
                  >
                    Name: Z-A
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Product grid */}
        <div className="lg:w-3/4">
          <Suspense fallback={<div>Loading products...</div>}>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {products.map((product) => (
                  <Link 
                    key={product.id} 
                    href={`/products/${product.slug}`}
                    className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48">
                      {product.product_images && product.product_images.length > 0 ? (
                        <Image
                          src={product.product_images[0].url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500">No image</span>
                        </div>
                      )}
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          SALE
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        {product.categories?.name || 'Uncategorized'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-lg font-semibold">{formatPrice(product.price)}</span>
                          {product.compare_at_price && product.compare_at_price > product.price && (
                            <span className="text-sm text-gray-500 line-through ml-2">
                              {formatPrice(product.compare_at_price)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your filters or check back later for new products.</p>
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}