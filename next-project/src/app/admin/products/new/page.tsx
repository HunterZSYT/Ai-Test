import { createServerClient } from '@/lib/supabase-server';
import ProductForm from '@/components/admin/product-form';

export const metadata = {
  title: "Add New Product - Admin Dashboard",
  description: "Add a new product to your store",
};

export default async function NewProductPage() {
  const supabase = createServerClient();
  
  // Fetch categories for the dropdown
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Add New Product</h1>
      <ProductForm categories={categories || []} />
    </div>
  );
}