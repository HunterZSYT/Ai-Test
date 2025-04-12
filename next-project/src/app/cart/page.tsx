"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getSessionId } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface CartItem {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    slug: string;
    product_images: { url: string; alt_text: string | null }[];
  };
  variant?: {
    id: string;
    name: string;
    price: number | null;
  };
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  error: string | null;
  subtotal: number;
}

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({
    items: [],
    isLoading: true,
    error: null,
    subtotal: 0
  });

  // Fetch cart items
  const fetchCart = async () => {
    setCart(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Get user session for authenticated users or session ID for guests
      const { data: { session } } = await supabase.auth.getSession();
      const sessionId = getSessionId();
      
      // First, get the cart ID
      const { data: cartData } = await supabase
        .from('carts')
        .select('id')
        .or(`user_id.eq.${session?.user?.id || null},session_id.eq.${sessionId}`)
        .maybeSingle();

      if (!cartData) {
        setCart({
          items: [],
          isLoading: false,
          error: null,
          subtotal: 0
        });
        return;
      }

      // Then, get cart items with product details
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          variant_id,
          quantity,
          product:product_id (
            id,
            name, 
            price,
            slug,
            product_images (url, alt_text)
          ),
          variant:variant_id (
            id,
            name,
            price
          )
        `)
        .eq('cart_id', cartData.id);

      if (error) throw error;

      // Calculate subtotal
      const subtotal = cartItems?.reduce((total, item) => {
        const price = item.variant?.price ?? item.product.price;
        return total + (price * item.quantity);
      }, 0) || 0;

      setCart({
        items: cartItems || [],
        isLoading: false,
        error: null,
        subtotal
      });
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      setCart(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error.message || "Failed to load cart" 
      }));
    }
  };

  // Update item quantity
  const updateItemQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;

      fetchCart(); // Refresh cart after update
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      alert("Failed to update quantity");
    }
  };

  // Remove item from cart
  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      fetchCart(); // Refresh cart after removal
      router.refresh(); // Refresh navigation to update cart count
    } catch (error: any) {
      console.error("Error removing item:", error);
      alert("Failed to remove item");
    }
  };

  // Proceed to checkout
  const handleCheckout = async () => {
    // For now, we'll just redirect to a checkout page
    // In a real implementation, you might want to validate inventory, apply coupons, etc.
    router.push('/checkout');
  };

  // Load cart on component mount
  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      {cart.isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      )}

      {cart.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {cart.error}
        </div>
      )}

      {!cart.isLoading && cart.items.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-medium text-gray-900 mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Looks like you haven't added anything to your cart yet.</p>
          <Link href="/products">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      )}

      {cart.items.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cart.items.map((item) => {
                    const itemPrice = item.variant?.price ?? item.product.price;
                    const itemTotal = itemPrice * item.quantity;

                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16 relative">
                              {item.product.product_images && item.product.product_images.length > 0 ? (
                                <Image
                                  src={item.product.product_images[0].url}
                                  alt={item.product.product_images[0].alt_text || item.product.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="h-16 w-16 bg-gray-200 flex items-center justify-center">
                                  <span className="text-xs text-gray-500">No image</span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <Link 
                                href={`/products/${item.product.slug}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600"
                              >
                                {item.product.name}
                              </Link>
                              {item.variant && (
                                <p className="text-xs text-gray-500">
                                  Option: {item.variant.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(itemPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center rounded-md">
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="rounded-l-md border border-r-0 border-gray-300 px-3 py-1 text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value);
                                if (!isNaN(qty) && qty >= 1) {
                                  updateItemQuantity(item.id, qty);
                                }
                              }}
                              className="w-12 border-y border-gray-300 px-2 py-1 text-center focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                              className="rounded-r-md border border-l-0 border-gray-300 px-3 py-1 text-gray-500 hover:bg-gray-50"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPrice(itemTotal)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-between">
              <Link href="/products">
                <Button variant="outline">Continue Shopping</Button>
              </Link>
              <button
                onClick={fetchCart}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Update Cart
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-600">Calculated at checkout</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-600">Calculated at checkout</span>
                </div>
                <div className="border-t pt-4 flex justify-between">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-lg font-bold">{formatPrice(cart.subtotal)}</span>
                </div>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full mt-6 py-3"
                disabled={cart.items.length === 0}
              >
                Proceed to Checkout
              </Button>
              
              {/* Coupon code input could go here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}