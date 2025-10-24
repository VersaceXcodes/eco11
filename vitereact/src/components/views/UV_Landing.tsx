import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';

const UV_Landing: React.FC = () => {
  // Zustand store access (CRITICAL: individual selectors)
  const authToken = useAppStore(state => state.auth_token);
  const currentUser = useAppStore(state => state.current_user);
  const initializeAuth = useAppStore(state => state.initializeAuth);
  const clearError = useAppStore(state => state.clearError);
  
  // Navigation
  const navigate = useNavigate();
  
  // State for modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  
  // Data fetching
  const { data: featuredChallenge, isLoading: challengeLoading, error: challengeError } = useQuery({
    queryKey: ['featuredChallenge'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/challenges`);
      // Map to find featured challenge
      return response.data.results.find(c => c.is_featured === true);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const { data: ecoTips, isLoading: tipsLoading, error: tipsError } = useQuery({
    queryKey: ['ecoTips'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/educational_content?type=tips`);
      // Map Post objects to tip format
      return response.data.results.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        image_url: post.image_url
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Redirect if authenticated
  useEffect(() => {
    if (authToken && currentUser) {
      navigate('/dashboard');
    }
  }, [authToken, currentUser, navigate]);

  // Clear errors on mount
  useEffect(() => {
    clearError();
  }, [clearError]);

  // Error handling
  const generalError = useAppStore(state => state.error_message);
  const hasErrors = (challengeError || tipsError || generalError);

  return (
    <>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center text-lg">
            {/* Headline */}
            <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              <span className="block">Empowering Sustainable Living,</span>
              <span className="block text-blue-700">One Action at a Time</span>
            </h2>
            
            {/* Subheadline */}
            <div className="mt-10 sm:mt-12">
              <p className="text-base text-gray-900 sm:text-lg md:text-xl md:max-w-2xl md:mx-auto lg:text-xl">
                Track, reduce, and celebrate your environmental impact with intuitive tools, education, and community engagement.
              </p>
            </div>
            
            {/* CTAs */}
            <div className="mt-12 sm:mt-16 sm:flex sm:justify-center">
              <div className="sm:m-auto sm:max-w-xs">
                <div className="rounded-lg shadow-lg bg-white sm:p-0">
                  <div className="p-6">
                    <button
                      type="button"
                      className="block w-full px-6 py-3 bg-blue-600 rounded-md text-white font-medium text-base shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                      onClick={() => setShowSignupModal(true)}
                    >
                      Get Started
                    </button>
                    <p className="mt-3 text-sm text-gray-600">
                      Already have an account?{' '}
                      <button
                        type="button"
                        className="font-medium text-blue-600 hover:text-blue-500"
                        onClick={() => setShowLoginModal(true)}
                      >
                        Sign in
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative image */}
        <div className="absolute bottom-0 left-0 hidden lg:block">
          <img className="h-96 w-auto" src="https://picsum.photos/seed/eco11/800/600" alt="Sustainability illustration" />
        </div>
      </div>

      {/* Features Grid */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Key Features
            </h3>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Discover how eco11 helps you make a positive environmental impact through these core features:
            </p>
          </div>
          
          <div className="mt-16 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="lg:col-span-1">
              <div className="relative p-6 group rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="absolute inset-x-0 top-0 flex justify-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-t-xl"></div>
                </div>
                <h4 className="mt-6 text-xl font-semibold text-gray-900">Carbon Tracker</h4>
                <p className="mt-2 text-gray-600">
                  Easily log and track your daily environmental activities across multiple categories.
                </p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="lg:col-span-1">
              <div className="relative p-6 group rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="absolute inset-x-0 top-0 flex justify-center">
                  <div className="w-12 h-12 bg-green-100 rounded-t-xl"></div>
                </div>
                <h4 className="mt-6 text-xl font-semibold text-gray-900">Personalized Recommendations</h4>
                <p className="mt-2 text-gray-600">
                  Receive AI-powered suggestions tailored to your lifestyle and impact goals.
                </p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="lg:col-span-1">
              <div className="relative p-6 group rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-200">
                <div className="absolute inset-x-0 top-0 flex justify-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-t-xl"></div>
                </div>
                <h4 className="mt-6 text-xl font-semibold text-gray-900">Community Challenges</h4>
                <p className="mt-2 text-gray-600">
                  Join daily, weekly, or monthly challenges and compete with the eco11 community.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel (Simplified) */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              What Our Users Say
            </h3>
            <div className="mt-12 space-y-10">
              {/* Testimonial 1 */}
              <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <img 
                    className="h-12 w-12 rounded-full mr-4"
                    src="https://picsum.photos/seed/user1/200/200"
                    alt="User avatar"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Alex Green</h4>
                    <p className="text-sm text-gray-500">Active User</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "eco11 has completely transformed how I think about my daily impact. The tracking is so easy and the community keeps me motivated!"
                </p>
              </div>
              
              {/* Testimonial 2 */}
              <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
                <div className="flex items-center mb-4">
                  <img 
                    className="h-12 w-12 rounded-full mr-4"
                    src="https://picsum.photos/seed/user2/200/200"
                    alt="User avatar"
                  />
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">Sam Family</h4>
                    <p className="text-sm text-gray-500">Family User</p>
                  </div>
                </div>
                <p className="text-gray-600">
                  "The family setup feature helps us track our collective impact and teach our kids about sustainability in a fun way."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-blue-50 py-20">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to Make a Difference?
          </h2>
          
          <div className="mt-12">
            <button
              type="button"
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              onClick={() => setShowSignupModal(true)}
            >
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50"></div>
          <div className="relative p-4 max-w-md mx-auto my-8 bg-white rounded-lg shadow-xl transition-all ease-in-out duration-300">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">Sign In</h3>
              <form className="mt-6 space-y-6">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  />
                </div>
                
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="group relative w-full flex justify-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sign In
                  </button>
                </div>
              </form>
              <div className="mt-6 text-sm">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowSignupModal(true);
                  }}
                >
                  Need an account?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50"></div>
          <div className="relative p-4 max-w-md mx-auto my-8 bg-white rounded-lg shadow-xl transition-all ease-in-out duration-300">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900">Create Account</h3>
              <form className="mt-6 space-y-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  />
                </div>
                
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  />
                </div>
                
                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <button
                    type="submit"
                    className="group relative w-full flex justify-center px-6 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Account
                  </button>
                </div>
              </form>
              <div className="mt-6 text-sm">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => {
                    setShowSignupModal(false);
                    setShowLoginModal(true);
                  }}
                >
                  Already have an account?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_Landing;
