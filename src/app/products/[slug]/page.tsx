'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { ProductCard } from '@/components/product/ProductCard';
import {
  Star,
  ShoppingBag,
  Heart,
  Truck,
  ShieldCheck,
  CheckCircle2,
  Share2,
  Sparkles,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();

  const [product, setProduct] = useState<any | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customizationNotes, setCustomizationNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  // Review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMessage, setReviewMessage] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (data.product) {
          setProduct(data.product);
          setSelectedImage(data.product.images[0]?.imageUrl || '/bags/b1.jpeg');
          setQuantity(data.product.minOrderQuantity || 1);
        }
        if (data.relatedProducts) {
          setRelatedProducts(data.relatedProducts);
        }
      } catch (err) {
        console.error('Fetch product detail error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProduct();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-eco-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 font-bold">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-slate-800">Product Not Found</h2>
        <button
          onClick={() => router.push('/shop')}
          className="bg-eco-700 text-white text-xs font-bold px-6 py-2.5 rounded-full"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async () => {
    setIsAdding(true);
    const res = await addToCart(product.id, quantity, customizationNotes);
    setIsAdding(false);
    if (res.success) {
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    setIsAdding(true);
    const res = await addToCart(product.id, quantity, customizationNotes);
    setIsAdding(false);
    if (res.success) {
      router.push('/checkout');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setReviewMessage('Please sign in to submit a review');
      return;
    }
    if (!reviewComment.trim()) return;

    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviewMessage('Thank you! Your review has been published.');
        setReviewComment('');
        // Reload product details
        const updateRes = await fetch(`/api/products/${slug}`);
        const updateData = await updateRes.json();
        if (updateData.product) setProduct(updateData.product);
      } else {
        setReviewMessage(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setReviewMessage('Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <a href="/" className="hover:text-eco-700">Home</a>
        <span>/</span>
        <a href="/shop" className="hover:text-eco-700">Shop</a>
        <span>/</span>
        <a href={`/shop?category=${product.category?.slug}`} className="hover:text-eco-700">
          {product.category?.name}
        </a>
        <span>/</span>
        <span className="font-bold text-slate-800 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 bg-white rounded-3xl p-6 md:p-10 border border-eco-100 shadow-sm">
        {/* Left Column: Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-canvas-100 rounded-2xl overflow-hidden border border-eco-200 relative group">
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {product.isCustomizable && (
              <span className="absolute top-3 left-3 bg-jute-600 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                Custom Printing Available
              </span>
            )}
          </div>

          {/* Gallery Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img.imageUrl ? 'border-eco-600 shadow-md' : 'border-transparent opacity-70'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Product Details & Purchase Form */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold text-eco-700 uppercase tracking-wider block">
              {product.category?.name}
            </span>
            <h1 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 mt-1">
              {product.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-500 font-mono">SKU: {product.sku}</span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.floor(product.avgRating || 5) ? 'fill-amber-400' : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-600 font-bold">
                  {product.avgRating?.toFixed(1) || '5.0'} ({product.totalReviews || 1} Reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 bg-canvas-100 rounded-2xl border border-eco-100 flex items-baseline gap-4">
            <span className="font-serif font-bold text-3xl text-eco-900">
              {formatPrice(product.discountPrice ?? product.price)}
            </span>
            {product.discountPrice && (
              <span className="text-base text-slate-400 line-through">
                {formatPrice(product.price)}
              </span>
            )}
            {product.discountPrice && (
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2.5 py-0.5 rounded-full ml-auto">
                Save {formatPrice(product.price - product.discountPrice)}
              </span>
            )}
          </div>

          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Product Specifications Table */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-canvas-50 p-4 rounded-2xl border border-eco-100">
            <div>
              <span className="text-slate-400 block font-medium">Material</span>
              <span className="font-bold text-slate-800">{product.material || '100% Natural Jute Yarn'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Dimensions</span>
              <span className="font-bold text-slate-800">{product.dimensions || 'Standard Tote Size'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Stock Availability</span>
              <span className={`font-bold ${product.stockQuantity > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity} pcs)` : 'Out of Stock'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Min Order Quantity</span>
              <span className="font-bold text-eco-800">{product.minOrderQuantity || 1} Pcs</span>
            </div>
          </div>

          {/* Custom Printing Request Form */}
          {product.isCustomizable && (
            <div className="p-4 bg-jute-50 rounded-2xl border border-jute-200 space-y-2">
              <label className="text-xs font-bold text-jute-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-jute-600" /> Custom Printing Instructions:
              </label>
              <textarea
                rows={2}
                placeholder="Enter Bride & Groom names, event dates, custom text, or brand printing notes..."
                value={customizationNotes}
                onChange={(e) => setCustomizationNotes(e.target.value)}
                className="w-full bg-white border border-jute-300 rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-jute-600"
              />
              <p className="text-[10px] text-jute-800">
                💡 Need custom logo file printing or bulk quotes? Visit our <a href="/custom-orders" className="font-bold underline">Custom Orders page</a>.
              </p>
            </div>
          )}

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-eco-300 rounded-xl bg-white">
                <button
                  onClick={() => setQuantity(Math.max(product.minOrderQuantity || 1, quantity - 1))}
                  className="px-3 py-1.5 text-slate-700 font-bold hover:bg-canvas-100"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-slate-700 font-bold hover:bg-canvas-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isAdding || product.stockQuantity <= 0}
                className={`py-3.5 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                  addedSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-eco-700 hover:bg-eco-800 text-white'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                {addedSuccess ? 'Added to Cart' : 'Add to Shopping Cart'}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isAdding || product.stockQuantity <= 0}
                className="bg-jute-400 hover:bg-jute-500 text-eco-950 font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                Buy Now <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <section className="bg-white rounded-3xl p-8 border border-eco-100 shadow-sm space-y-6">
        <h3 className="font-serif font-bold text-xl text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-eco-700" /> Customer Reviews & Feedback
        </h3>

        {/* Add Review Form */}
        <div className="bg-canvas-50 p-6 rounded-2xl border border-eco-100 space-y-4 max-w-xl">
          <h4 className="font-serif font-bold text-sm text-slate-900">Write a Product Review</h4>
          {reviewMessage && (
            <p className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
              {reviewMessage}
            </p>
          )}
          <form onSubmit={handleReviewSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Your Rating:</label>
              <div className="flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Your Review:</label>
              <textarea
                rows={3}
                required
                placeholder="Share details regarding stitch quality, jute fabric feel, and delivery..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full bg-white border border-eco-200 rounded-xl p-3 text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={reviewSubmitting}
              className="bg-eco-700 hover:bg-eco-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-colors"
            >
              {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Existing Reviews List */}
        <div className="space-y-4 pt-4">
          {product.reviews?.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No reviews yet. Be the first to write a review!</p>
          ) : (
            product.reviews?.map((rev: any) => (
              <div key={rev.id} className="p-4 bg-canvas-50 rounded-2xl border border-eco-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">{rev.userName}</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < rev.rating ? 'fill-amber-400' : 'text-slate-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600">{rev.comment}</p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h3 className="font-serif font-bold text-xl text-slate-900">
            Similar Products You Might Like
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
