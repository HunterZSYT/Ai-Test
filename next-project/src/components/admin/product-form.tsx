"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase, uploadProductImage, addProductImageRecord, deleteProductImage } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

type Category = {
  id: string;
  name: string;
};

type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  position: number;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  barcode: string | null;
  inventory_quantity: number;
  slug: string;
  is_published: boolean;
  category_id: string | null;
  product_images?: ProductImage[];
};

interface ProductFormProps {
  product?: Product | null;
  categories: Category[];
}

const emptyProduct = {
  id: uuidv4(),
  name: "",
  description: "",
  price: 0,
  compare_at_price: null,
  sku: "",
  barcode: "",
  inventory_quantity: 0,
  slug: "",
  is_published: false,
  category_id: null,
  product_images: [],
};

export default function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter();
  const isNewProduct = !product;
  const [formData, setFormData] = useState<Product>(product || emptyProduct);
  const [images, setImages] = useState<ProductImage[]>(product?.product_images || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Create a slug from the product name
  useEffect(() => {
    if (isNewProduct && formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.name, isNewProduct]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let processedValue: string | number | boolean = value;

    // Convert value based on input type
    if (type === "number") {
      processedValue = value === "" ? 0 : Number(value);
    } else if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === "price" || name === "compare_at_price") {
      // Convert dollar amount to cents
      processedValue = Math.round(parseFloat(value) * 100);
    }

    setFormData({ ...formData, [name]: processedValue });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Define a type that includes created_at for new products
      type ProductDataWithDates = Product & { 
        updated_at: string;
        created_at?: string; 
      };

      // Prepare product data with proper typing
      const productData: ProductDataWithDates = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (isNewProduct) {
        // Only add created_at when creating a new product
        productData.created_at = new Date().toISOString();
      }

      // Insert or update product
      const { error } = isNewProduct
        ? await supabase.from("products").insert(productData)
        : await supabase.from("products").update(productData).eq("id", formData.id);

      if (error) throw error;

      // Redirect to products list or product page
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      console.error("Error saving product:", err);
      setError("Failed to save product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    setUploadError(null);

    try {
      const file = e.target.files[0];
      
      // Upload image to Supabase Storage
      const imageUrl = await uploadProductImage(file, formData.id);
      
      // Add image to database
      await addProductImageRecord(
        formData.id,
        imageUrl,
        formData.name,
        images.length // Position will be at the end
      );
      
      // Refresh images list
      const { data: updatedImages, error } = await supabase
        .from("product_images")
        .select("*")
        .eq("product_id", formData.id);
        
      if (error) throw error;
      setImages(updatedImages || []);
      
      // Reset file input
      e.target.value = "";
    } catch (err) {
      console.error("Error uploading image:", err);
      setUploadError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: string, imageUrl: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    setIsUploading(true);
    
    try {
      await deleteProductImage(imageId, imageUrl);
      
      // Update the images state by filtering out the deleted image
      setImages((prevImages) => prevImages.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error("Error deleting image:", err);
      setUploadError("Failed to delete image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Basic Details */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Basic Details</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                  Slug
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  value={formData.description || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Price & Inventory */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Price & Inventory</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    step="0.01"
                    value={formData.price / 100} // Display in dollars
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="compare_at_price" className="block text-sm font-medium text-gray-700">
                    Compare-at Price ($)
                  </label>
                  <input
                    type="number"
                    id="compare_at_price"
                    name="compare_at_price"
                    step="0.01"
                    value={formData.compare_at_price ? formData.compare_at_price / 100 : ""} // Display in dollars
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                    SKU
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="barcode" className="block text-sm font-medium text-gray-700">
                    Barcode
                  </label>
                  <input
                    type="text"
                    id="barcode"
                    name="barcode"
                    value={formData.barcode || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="inventory_quantity" className="block text-sm font-medium text-gray-700">
                  Inventory Quantity
                </label>
                <input
                  type="number"
                  id="inventory_quantity"
                  name="inventory_quantity"
                  value={formData.inventory_quantity}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_published"
                  name="is_published"
                  checked={formData.is_published}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_published" className="ml-2 block text-sm font-medium text-gray-700">
                  Publish product (visible to customers)
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Images */}
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Product Images</h3>
          
          {/* Image upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
            <div className="flex items-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploading || !formData.id}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
              />
              {isUploading && <span className="ml-3 text-sm text-gray-500">Uploading...</span>}
            </div>
            
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
            
            {isNewProduct && !formData.id && (
              <p className="mt-2 text-sm text-amber-600">
                Save the product first before uploading images.
              </p>
            )}
          </div>
          
          {/* Image gallery */}
          <div className="grid grid-cols-2 gap-4">
            {images.map((image) => (
              <div key={image.id} className="group relative border rounded-lg overflow-hidden">
                <div className="aspect-square relative">
                  <Image
                    src={image.url}
                    alt={image.alt_text || formData.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteImage(image.id, image.url)}
                  className="absolute top-2 right-2 bg-white bg-opacity-70 rounded-full p-1 shadow-sm 
                  text-gray-600 hover:text-red-600 focus:outline-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                    strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
            
            {images.length === 0 && (
              <div className="aspect-square flex items-center justify-center border rounded-lg bg-gray-50 text-gray-500">
                No images yet
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end pt-5 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isLoading ? "Saving..." : isNewProduct ? "Create Product" : "Update Product"}
        </button>
      </div>
    </form>
  );
}