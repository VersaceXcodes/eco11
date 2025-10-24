import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, QueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { z } from 'zod';

// Schema for product data
const ProductSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  price: z.number(),
  impact_score: z.number(),
  image_url: z.string().nullable(),
  additional_images: z.array(z.string()).optional().default([]),
});

type Product = z.infer<typeof ProductSchema>;

// Schema for review data
const ReviewSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  post_id: z.string(),
  content: z.string(),
  created_at: z.string(),
  username: z.string(),
});

type Review = z.infer<typeof ReviewSchema>;

// Component
const UV_ProductDetails: React.FC = () => {
  const params = useParams();
  const productId = params.id;

  // Zustand hooks
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const clearError = useAppStore(state => state.clear_auth_error);

  // Query for product details
  const { data: productData, isLoading: productLoading, error: productError } = useQuery(
    ['product', productId],
    async () => {
      const response = await axios.get<Product>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/marketplace/products/${productId}`
      );
      return ProductSchema.parse(response.data);
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  );

  // Query for product reviews
  const { data: reviewsData, isLoading: reviewsLoading, error: reviewsError } = useQuery(
    ['reviews', productId],
    async () => {
      const response = await axios.get<Review[]>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/marketplace/products/${productId}/reviews`
      );
      return response.data.map(review => ReviewSchema.parse(review));
    },
    {
      enabled:!!productId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  );

  // Mutation for submitting review
  const [submitReview] = useMutation(
    async (reviewData: { content: string }) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/marketplace/products/${productId}/reviews`,
        { content: reviewData.content }
      );
      return ReviewSchema.parse(response.data);
    },
    {
      onSuccess: () => {
        queryClient.refetchQueries(['reviews', productId]);
      },
    }
  );

  // Local state for review form
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Error handling
  if (productError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold text-red-600 mb-4">Error Loading Product</h2>
          <p className="text-red-500">{productError.message}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (productLoading || reviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Product Not Found</h2>
          <Link 
            to="/marketplace"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  // Handle review submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    try {
      await submitReview({ content: reviewText });
      setReviewText('');
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Product Header */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* Main Image */}
          <div className="relative">
            <img 
              src={productData.image_url || 'https://picsum.photos/seed/default/800/600'}
              alt={productData.title}
              className="w-full h-64 object-cover"
            />
          </div>
          
          {/* Product Info */}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{productData.title}</h1>
            
            <div className="space-y-2 mb-6">
              <div className="flex items-center">
                <span className="text-xl font-semibold text-gray-800">${productData.price.toFixed(2)}</span>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800">Environmental Impact</h3>
                <p className="text-gray-700 mt-2">
                  Impact Score: {productData.impact_score}/10
                </p>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Description</h3>
              <p className="text-gray-700 leading-relaxed">{productData.content}</p>
            </div>
            
            {/* Image Gallery */}
            {productData.additional_images?.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                {productData.additional_images.map((img, idx) => (
                  <div key={idx} className="overflow-hidden rounded-lg">
                    <img 
                      src={img || 'https://picsum.photos/seed/gallery/300/200'}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* Affiliate Link */}
            <div className="mt-8">
              <a 
                href={`https://example.com/affiliate/${productId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-green-700"
              >
                Buy Now
              </a>
            </div>
          </div>
        </div>
        
        {/* Reviews Section */}
        <div className="mt-12">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            </div>
            
            {/* Reviews List */}
            {reviewsData?.length > 0? (
              <div className="space-y-6 mb-8">
                {reviewsData.map(review => (
                  <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-800">{review.username}</span>
                      <time className="text-sm text-gray-500">{new Date(review.created_at).toLocaleDateString()}</time>
                    </div>
                    <p className="text-gray-700">{review.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600 mb-8">
                Be the first to leave a review!
              </div>
            )}
            
            {/* Review Submission Form */}
            {currentUser? (
              <form 
                onSubmit={handleReviewSubmit}
                className="space-y-4 p-4 border border-gray-200 rounded-lg"
              >
                <textarea
                  value={reviewText}
                  onChange={(e) => {
                    clearError();
                    setReviewText(e.target.value);
                  }}
                  placeholder="Write your review..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                />
                
                <button
                  type="submit"
                  disabled={!reviewText.trim() || isSubmitting}
                  className={`bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                   !reviewText.trim() || isSubmitting? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <p className="text-gray-600 mb-2">Sign in to leave a review</p>
                <Link 
                  to="/"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ProductDetails;