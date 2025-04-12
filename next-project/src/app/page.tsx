import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .limit(4);
  return data || [];
}

async function getFeaturedProducts() {
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      product_images(*),
      categories:category_id(name)
    `)
    .eq('is_published', true)
    .limit(8);
  return data || [];
}

export default async function Home() {
  const categories = await getCategories();
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl overflow-hidden mb-12">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
              Welcome to EcomStore
            </h1>
            <p className="text-lg text-blue-100 mb-6">
              Discover amazing products at unbeatable prices. Shop now and enjoy exclusive deals!
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <Button size="lg">Shop Now</Button>
              </Link>
              <Link href="/categories">
                <Button variant="outline" size="lg" className="bg-white hover:bg-gray-100 text-blue-600">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
            <div className="rounded-lg bg-white/10 backdrop-blur-md p-6 rotate-3 shadow-lg">
              <Image 
                src="/hero-image.jpg" 
                alt="Shopping collection" 
                width={400} 
                height={300}
                className="rounded-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Shop by Category</h2>
          <Link href="/categories" className="text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/categories/${category.slug}`}
              className="group relative h-64 rounded-lg overflow-hidden bg-gray-100 transition-transform hover:scale-105"
            >
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">{category.name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <div className="p-4 text-white">
                  <h3 className="text-lg font-medium">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-200 line-clamp-2">{category.description}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link href="/products" className="text-blue-600 hover:underline">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <Link 
              key={product.id} 
              href={`/products/${product.slug}`}
              className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="relative h-48">
                {product.product_images && product.product_images.length > 0 ? (
                  <Image
                    src={product.product_images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                    SALE
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2">
                  {product.categories?.name || 'Uncategorized'}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold">{formatPrice(product.price)}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-sm text-gray-500 line-through ml-2">
                        {formatPrice(product.compare_at_price)}
                      </span>
                    )}
                  </div>
                  <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    View
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="bg-gray-100 rounded-lg p-8 mb-12">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-2/3 mb-4 md:mb-0 md:pr-6">
            <h2 className="text-2xl font-bold mb-2">Special Offer</h2>
            <p className="text-gray-700 mb-4">
              Sign up for our newsletter and get 10% off your first order!
            </p>
            <form className="flex w-full max-w-md">
              <input
                type="email"
                placeholder="Your email"
                className="flex-grow rounded-l-md border-y border-l border-gray-300 px-4 py-2"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md"
              >
                Subscribe
              </button>
            </form>
          </div>
          <div className="md:w-1/3 flex justify-center">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="text-center">
                <span className="text-2xl font-bold text-blue-600">10% OFF</span>
                <p className="text-sm">Use code: WELCOME10</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
