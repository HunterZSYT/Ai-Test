import { createServerClient, requireAdmin } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import UserEditForm from '@/components/admin/user-edit-form';

export const metadata = {
  title: "Edit User - Admin Dashboard",
  description: "Edit user details and roles",
};

export default async function EditUserPage({
  params
}: {
  params: { id: string }
}) {
  // Verify user is an admin
  await requireAdmin();
  
  const supabase = createServerClient();
  
  // Fetch the user by ID
  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single();
  
  // If user is not found, show 404 page
  if (error || !user) {
    notFound();
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Edit User: {user.first_name} {user.last_name}</h1>
      <UserEditForm user={user} />
    </div>
  );
}