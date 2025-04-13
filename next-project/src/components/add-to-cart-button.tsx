"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, getSessionId } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  isInStock: boolean;
  showQuantity?: boolean;
  buttonText?: string;
  redirectToCart?: boolean;
}

export default function AddToCartButton({
  productId,
  variantId = null,
  isInStock = true,
  showQuantity = true,
  buttonText = "Add to Cart",
  redirectToCart = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!isInStock) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get the current user or session ID for guest cart
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = user ? null : getSessionId();

      // Find or create cart
      let cartId;
      if (user) {
        // Get user's cart or create it
        const { data: existingCart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingCart) {
          cartId = existingCart.id;
        } else {
          const { data: newCart, error } = await supabase
            .from('carts')
            .insert({ user_id: user.id })
            .select('id')
            .single();

          if (error) throw error;
          cartId = newCart.id;
        }
      } else {
        // Get session cart or create it
        const { data: existingCart } = await supabase
          .from('carts')
          .select('id')
          .eq('session_id', sessionId)
          .is('user_id', null)
          .maybeSingle();

        if (existingCart) {
          cartId = existingCart.id;
        } else {
          const { data: newCart, error } = await supabase
            .from('carts')
            .insert({ session_id: sessionId })
            .select('id')
            .single();

          if (error) throw error;
          cartId = newCart.id;
        }
      }

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .eq('variant_id', variantId)
        .maybeSingle();

      if (existingItem) {
        // Update quantity of existing item
        const { error } = await supabase
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        // Add new item to cart
        const { error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: productId,
            variant_id: variantId,
            quantity: quantity
          });

        if (error) throw error;
      }

      // Redirect to cart if needed
      if (redirectToCart) {
        router.push('/cart');
      }
      
      // Refresh page data
      router.refresh();
    } catch (err) {
      console.error("Error adding item to cart:", err);
      setError("Failed to add item to cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      {showQuantity && (
        <div className="flex items-center space-x-3 mb-3">
          <label htmlFor="quantity" className="text-sm font-medium text-gray-700">
            Quantity
          </label>
          <div className="flex items-center border rounded-md">
            <button
              type="button"
              className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              disabled={quantity <= 1 || isLoading}
              onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
            >
              -
            </button>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-12 border-0 text-center focus:ring-0"
            />
            <button
              type="button"
              className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50"
              disabled={quantity >= 99 || isLoading}
              onClick={() => setQuantity((prev) => Math.min(prev + 1, 99))}
            >
              +
            </button>
          </div>
        </div>
      )}

      <Button 
        onClick={handleAddToCart}
        disabled={!isInStock || isLoading}
        isLoading={isLoading}
        variant={isInStock ? "primary" : "outline"}
        fullWidth={true}
      >
        {!isInStock ? "Out of Stock" : buttonText}
      </Button>

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}