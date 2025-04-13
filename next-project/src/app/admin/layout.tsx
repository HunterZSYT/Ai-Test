import Link from 'next/link';
import { requireAdmin } from '@/lib/supabase-server';

export const metadata = {
  title: "Admin - E-commerce Dashboard",
  description: "Admin dashboard for e-commerce management",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verify user is an admin
  await requireAdmin();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-xl font-bold">Store</Link>
              </div>
              <nav className="ml-8 flex space-x-8">
                <Link href="/admin/products" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Products
                </Link>
                <Link href="/admin/users" className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
                  Users
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-8 px-4">
        <main>{children}</main>
      </div>
    </div>
  );
}