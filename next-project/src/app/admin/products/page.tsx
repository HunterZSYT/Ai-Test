import { createServerClient } from '@/lib/supabase-server';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: "Manage Products - Admin Dashboard",
  description: "Manage your e-commerce product catalog",
};

// Define types for the product data
type ProductImage = {
  id: string;
  url: string;
  position: number;
};

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  sku: string | null;
  inventory_quantity: number;
  is_published: boolean;
  product_images?: ProductImage[] | undefined;
  categories?: Category;
};

export default async function AdminProductsPage() {
  const supabase = createServerClient();

  // Fetch all products with their main image
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        url,
        position
      ),
      categories (
        id,
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link 
          href="/admin/products/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add New Product
        </Link>
      </div>
      
      {/* Products table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inventory
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products?.map((product: Product) => {
              // Ensure product_images is always an array
              const productImages = product.product_images || [];
              
              // Find the first image or use placeholder
              const mainImage = productImages.length > 0
                ? [...productImages].sort((a: ProductImage, b: ProductImage) => a.position - b.position)[0]
                : null;
              
              return (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 relative flex-shrink-0 rounded overflow-hidden">
                        {mainImage ? (
                          <Image
                            src={mainImage.url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.sku || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {product.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.inventory_quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.categories?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${(product.price / 100).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/admin/products/${product.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      Edit
                    </Link>
                    <Link href={`/products/${product.slug}`} target="_blank" className="text-gray-600 hover:text-gray-900">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            
            {products?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No products found. Create your first product to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}