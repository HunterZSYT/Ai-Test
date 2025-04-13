import { createServerClient, requireAdmin } from '@/lib/supabase-server';
import ProductForm from '@/components/admin/product-form';
import { notFound } from 'next/navigation';

export const metadata = {
  title: "Edit Product - Admin Dashboard",
  description: "Edit product details and images",
};

export default async function EditProductPage({
  params
}: {
  params: { id: string }
}) {
  // Verify user is an admin
  await requireAdmin();
  
  const supabase = createServerClient();
  
  // Fetch the product by ID with its images
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        *
      )
    `)
    .eq('id', params.id)
    .single();
  
  // If product is not found, show 404 page
  if (error || !product) {
    notFound();
  }
  
  // Fetch categories for the dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Edit Product: {product.name}</h1>
      <ProductForm product={product} categories={categories || []} />
    </div>
  );
}