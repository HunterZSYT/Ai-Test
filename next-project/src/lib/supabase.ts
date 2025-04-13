import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

// These types will ensure we have proper TypeScript support for our database schema
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          role: 'admin' | 'customer';
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'admin' | 'customer';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string | null;
          last_name?: string | null;
          role?: 'admin' | 'customer';
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          inventory_quantity?: number;
          slug: string;
          is_published?: boolean;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          sku?: string | null;
          barcode?: string | null;
          inventory_quantity?: number;
          slug?: string;
          is_published?: boolean;
          category_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          slug: string;
          image_url: string | null;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          position: number;
          created_at: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string | null;
          price: number | null;
          inventory_quantity: number;
          created_at: string;
          updated_at: string;
        };
      };
      carts: {
        Row: {
          id: string;
          user_id: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          order_number: string;
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          subtotal: number;
          tax: number;
          shipping_fee: number;
          discount: number;
          total: number;
          billing_address: Record<string, unknown>;
          shipping_address: Record<string, unknown>;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Session ID for anonymous users (cart storage)
const SESSION_ID_KEY = "ecommerce_session_id";

/**
 * Gets a unique session ID for the client (stored in localStorage)
 * This is used to identify anonymous user carts
 */
export function getSessionId(): string {
  // For server-side rendering, return a random ID that won't be used
  if (typeof window === "undefined") {
    return "server-rendering";
  }

  const sessionId = localStorage.getItem(SESSION_ID_KEY);
  
  // If no session ID exists, create one
  if (!sessionId) {
    const newSessionId = uuidv4();
    localStorage.setItem(SESSION_ID_KEY, newSessionId);
    return newSessionId;
  }
  
  return sessionId;
}

/**
 * Merges anonymous cart with user cart upon login
 */
export async function mergeCartsOnLogin(userId: string): Promise<void> {
  try {
    const sessionId = getSessionId();
    
    // Find the anonymous cart
    const { data: anonymousCart } = await supabase
      .from('carts')
      .select('id, cart_items(id, product_id, variant_id, quantity)')
      .eq('session_id', sessionId)
      .is('user_id', null)
      .maybeSingle();
    
    // If no anonymous cart exists, nothing to do
    if (!anonymousCart) return;
    
    // Find or create the user cart
    let userCartId;
    const { data: existingUserCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (existingUserCart) {
      userCartId = existingUserCart.id;
    } else {
      const { data: newUserCart, error } = await supabase
        .from('carts')
        .insert({ user_id: userId })
        .select('id')
        .single();
      
      if (error) throw error;
      userCartId = newUserCart.id;
    }
    
    // Merge cart items
    if (anonymousCart.cart_items?.length > 0) {
      // For each cart item, add to user cart or update quantity
      for (const item of anonymousCart.cart_items) {
        // Check if product already exists in user cart
        const { data: existingItem } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', userCartId)
          .eq('product_id', item.product_id)
          .eq('variant_id', item.variant_id)
          .maybeSingle();
        
        if (existingItem) {
          // Update quantity
          await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + item.quantity })
            .eq('id', existingItem.id);
        } else {
          // Add new item to user cart
          await supabase
            .from('cart_items')
            .insert({
              cart_id: userCartId,
              product_id: item.product_id,
              variant_id: item.variant_id,
              quantity: item.quantity
            });
        }
      }
    }
    
    // Delete anonymous cart
    await supabase
      .from('carts')
      .delete()
      .eq('id', anonymousCart.id);
      
    // Clear session ID from localStorage
    localStorage.removeItem(SESSION_ID_KEY);
    
  } catch (error) {
    console.error("Error merging carts:", error);
  }
}

/**
 * Listen for auth state changes and merge carts on login
 */
export function setupAuthListener() {
  if (typeof window === "undefined") return;
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      mergeCartsOnLogin(session.user.id);
    }
  });
  
  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Format price from cents to dollars
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Check if a product is in stock
 */
export function isInStock(inventory: number): boolean {
  return inventory > 0;
}

/**
 * Upload a product image to the storage bucket
 * @param file - The file to upload
 * @param productId - The ID of the product the image belongs to
 * @returns The public URL of the uploaded image
 */
export async function uploadProductImage(file: File, productId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${productId}/${uuidv4()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }
  
  // Get public URL
  const { data } = supabase.storage
    .from('products')
    .getPublicUrl(filePath);
    
  return data.publicUrl;
}

/**
 * Add a product image record to the database
 * @param productId - The ID of the product
 * @param imageUrl - The URL of the uploaded image
 * @param altText - Alternative text for the image
 * @param position - Display position/order of the image
 */
export async function addProductImageRecord(
  productId: string, 
  imageUrl: string, 
  altText?: string,
  position: number = 0
): Promise<void> {
  const { error } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      url: imageUrl,
      alt_text: altText || null,
      position
    });

  if (error) {
    console.error('Error adding product image record:', error);
    throw error;
  }
}

/**
 * Delete a product image from storage and the database
 * @param imageId - The ID of the image record to delete
 * @param imageUrl - The URL of the image to delete from storage
 */
export async function deleteProductImage(imageId: string, imageUrl: string): Promise<void> {
  // Extract the file path from the URL
  const urlParts = imageUrl.split('/');
  const filePath = urlParts.slice(-2).join('/');
  
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('products')
    .remove([filePath]);
    
  if (storageError) {
    console.error('Error removing image from storage:', storageError);
    throw storageError;
  }
  
  // Delete the database record
  const { error: dbError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId);
    
  if (dbError) {
    console.error('Error removing image record from database:', dbError);
    throw dbError;
  }
}

/**
 * Check if the storage bucket exists and is properly configured
 * @returns Boolean indicating if the storage bucket is available
 */
export async function checkStorageBucket(): Promise<boolean> {
  try {
    // Try to list files in the bucket
    const { error } = await supabase.storage
      .from('products')
      .list();
      
    // If we get an error about the bucket not existing, it's not configured
    if (error && error.message.includes('bucket not found')) {
      console.error('Products storage bucket not found:', error);
      return false;
    }
    
    // Otherwise the bucket exists
    return true;
  } catch (error) {
    console.error('Error checking storage bucket:', error);
    return false;
  }
}