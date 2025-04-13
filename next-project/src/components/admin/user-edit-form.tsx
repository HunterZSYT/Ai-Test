"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/ui/form-input";
import { supabase } from "@/lib/supabase";

type UserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: 'admin' | 'customer';
  avatar_url: string | null;
};

export default function UserEditForm({ user }: { user: UserProfile }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    role: user.role
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role as 'admin' | 'customer',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess("User updated successfully");
      router.refresh();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update user";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <FormInput
            id="first_name"
            name="first_name"
            label="First Name"
            value={formData.first_name}
            onChange={handleChange}
          />
          
          <FormInput
            id="last_name"
            name="last_name"
            label="Last Name"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            isLoading={isLoading}
          >
            Update User
          </Button>
        </div>
      </form>
    </div>
  );
}