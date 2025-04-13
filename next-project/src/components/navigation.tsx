"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase, getSessionId } from "@/lib/supabase";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Get the current user and cart count when the component mounts
  useEffect(() => {
    // Get the current user
    const getUserAndCart = async () => {
      setIsLoading(true);
      
      try {
        // Get the user session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get the user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', session.user.id)
            .single();
            
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            avatar_url: profile?.avatar_url || '',
          });
        } else {
          setUser(null);
        }

        // Get the cart count
        await fetchCartCount();
      } catch (error) {
        console.error("Error fetching user info:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getUserAndCart();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Just update user state, we'll fetch profile details on the next render
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          first_name: '',
          last_name: '',
          avatar_url: '',
        });
      } else {
        setUser(null);
      }
      
      // Refresh cart count when auth state changes
      fetchCartCount();
    });
    
    return () => {
      // Clean up subscription
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Function to fetch cart count
  const fetchCartCount = async () => {
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
        setCartItemCount(0);
        return;
      }

      // Get the count of items in the cart
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity', { count: 'exact' })
        .eq('cart_id', cartData.id);

      if (error) throw error;

      // Calculate the total quantity of all items
      const totalQuantity = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartItemCount(totalQuantity);
    } catch (error) {
      console.error("Error fetching cart count:", error);
      setCartItemCount(0);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-gray-800">E-Commerce Store</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`text-base font-medium ${
                pathname === '/' ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/products" 
              className={`text-base font-medium ${
                pathname === '/products' || pathname.startsWith('/products/') 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-blue-600'
              }`}
            >
              Products
            </Link>
          </nav>

          {/* Right side icons: cart and account */}
          <div className="flex items-center space-x-4">
            {/* Cart icon with counter */}
            <Link href="/cart" className="relative p-2 text-gray-500 hover:text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>

              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs font-medium">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Account menu */}
            <div className="relative">
              <button 
                type="button" 
                className="flex items-center focus:outline-none"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isLoading ? (
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                ) : user ? (
                  <div className="flex items-center">
                    <span className="hidden md:block text-sm text-gray-700 mr-2">
                      {user.first_name || user.email}
                    </span>
                    <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="hidden md:block text-sm text-gray-700 mr-2">Account</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}
              </button>

              {/* Dropdown menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  {user ? (
                    <>
                      <Link 
                        href="/account" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Account
                      </Link>
                      <Link 
                        href="/account/orders" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      {/* Show admin link only to users with admin role */}
                      {user.first_name && (
                        <Link 
                          href="/admin" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        onClick={handleSignOut}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        href="/auth/signin" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link 
                        href="/auth/signup" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}