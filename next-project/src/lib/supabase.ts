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