import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { v4 as uuidv4 } from 'uuid';

// Define local interfaces for data
interface CarbonFootprint {
  total_co2: number;
  breakdown: Record<string, number>;
}

interface Challenge {
  id: string;
  name: string;
  progress: number;
  start_date: string;
  end_date: string;
}

interface Recommendation {
  id: string;
  title: string;
  impact: number;
  difficulty: string;
}

// Dashboard component
const UV_Dashboard: React.FC = () => {
  // Zustand store access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const setCarbonFootprint = useAppStore(state => state.set_carbon_footprint);
  const setRecommendations = useAppStore(state => state.set_recommendations);
  const setChallenges = useAppStore(state => state.set_challenges);
  const offlineActivities = useAppStore(state => state.offline_activities);
  const clearOfflineActivities = useAppStore(state => state.clear_offline_activities);
  const buyCarbonOffset = useAppStore(state => state.buy_carbon_offset);
  
  // URL parameter for tab selection
  const [activeTab, setActiveTab] = useState<string>('footprint');
  const params = new URLSearchParams(window.location.search);
  useEffect(() => {
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, []);

  // Query for carbon footprint data
  const { data: footprintData, isLoading: isFootprintLoading, error: footprintError } = useQuery({
    queryKey: ['footprint', 'ytd'],
    queryFn: async () => {
      const response = await axios.get<CarbonFootprint>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/tracker?category=transportation&date_range=ytd`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Query for active challenges
  const { data: challengesData, isLoading: isChallengesLoading, error: challengesError } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const response = await axios.get<Challenge[]>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/challenges`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Query for recommendations
  const { data: recommendationsData, isLoading: isRecommendationsLoading, error: recommendationsError } = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const response = await axios.get<Recommendation[]>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/recommendations`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Handle offline activities
  useEffect(() => {
    if (offlineActivities.length > 0) {
      // Sync offline activities when online
      const syncActivities = async () => {
        try {
          for (const activity of offlineActivities) {
            await axios.post(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/activities`,
              {
                category: activity.category,
                quantity: activity.quantity,
                unit: activity.unit,
                timestamp: activity.timestamp
              }
            );
          }
          clearOfflineActivities();
        } catch (error) {
          console.error('Failed to sync offline activities:', error);
        }
      };
      syncActivities();
    }
  }, [offlineActivities, clearOfflineActivities]);

  // Handle carbon offset purchase
  const handleBuyCredits = async () => {
    if (!currentUser) return;
    
    try {
      const amount = 1; // Default to 1 ton of CO2
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/carbon-offset`,
        { amount }
      );
      console.log('Carbon offset purchase successful:', response.data);
      // Update user's footprint after purchase
      setCarbonFootprint({
        total_co2: (footprintData?.total_co2 || 0) - amount,
        breakdown: footprintData?.breakdown || {}
      });
    } catch (error) {
      console.error('Failed to purchase carbon offset:', error);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.history.replaceState({}, '', `${window.location.pathname}?tab=${tab}`);
  };

  // Render loading state
  if (isFootprintLoading || isChallengesLoading || isRecommendationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-transparent rounded-full"></div>
      </div>
    );
  }

  // Handle errors
  if (footprintError || challengesError || recommendationsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Error loading dashboard data
          </h2>
          <p className="text-gray-700 mb-6">
            We encountered an issue while loading your dashboard. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBuyCredits}
                className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
              >
                Buy Credits
              </button>
              <Link
                to="/profile"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-gray-200 mb-6">
          <button
            onClick={() => handleTabChange('footprint')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'footprint' 
             ? 'border-b-2 border-blue-600 text-blue-700' 
              : 'border-b border-gray-300 text-gray-700 hover:text-blue-700'}}
          >
            Footprint
          </button>
          <button
            onClick={() => handleTabChange('challenges')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'challenges' 
             ? 'border-b-2 border-blue-600 text-blue-700' 
              : 'border-b border-gray-300 text-gray-700 hover:text-blue-700'}}
          >
            Challenges
          </button>
          <button
            onClick={() => handleTabChange('recommendations')}
            className={`px-4 py-2 text-sm font-medium ${activeTab === 'recommendations' 
             ? 'border-b-2 border-blue-600 text-blue-700' 
              : 'border-b border-gray-300 text-gray-700 hover:text-blue-700'}}
          >
            Recommendations
          </button>
        </div>

        {/* Content Sections */}
        {activeTab === 'footprint' && (
          <section className="space-y-8">
            {/* Carbon Footprint Card */}
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800">Carbon Footprint</h3>
              <div className="mt-6">
                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total CO2 (YTD):</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {footprintData?.total_co2?.toFixed(2)} kg
                    </p>
                  </div>
                  <div className="h-20 w-20">
                    {/* Placeholder for chart */}
                    <canvas className="border border-gray-300 rounded-md"></canvas>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-700">Breakdown</h4>
                  <ul className="mt-4 space-y-2">
                    {footprintData?.breakdown && Object.entries(footprintData.breakdown).map(([category, value], index) => (
                      <li key={uuidv4()} className="flex justify-between">
                        <span className="text-sm text-gray-600">{category.replace('_', ' ').toUpperCase()}</span>
                        <span className="text-sm font-medium">{value.toFixed(2)} kg</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'challenges' && (
          <section className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800">Active Challenges</h3>
              
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {challengesData?.map(challenge => (
                  <div key={challenge.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between">
                      <h4 className="text-lg font-semibold">{challenge.name}</h4>
                      <span className="text-sm text-gray-500">{new Date(challenge.start_date).toLocaleDateString()} - {new Date(challenge.end_date).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center mb-2">
                        <span className="text-sm text-gray-600">Progress:</span>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div className={`w-full ${Math.min(100, challenge.progress)}% bg-green-500 rounded-full h-full`}></div>
                        </div>
                        <span className="text-sm text-gray-700">{Math.min(100, challenge.progress).toFixed(0)}%</span>
                      </div>
                      
                      <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Track Activity
                      </button>
                    </div>
                  </div>
                ))}
                
                {!challengesData || challengesData.length === 0? (
                  <div className="text-center p-6">
                    <p className="text-gray-600">No active challenges found</p>
                    <button className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
                      Browse Challenges
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'recommendations' && (
          <section className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800">Top Recommendations</h3>
              
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendationsData?.map(recommendation => (
                  <div key={recommendation.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold">{recommendation.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{recommendation.content}</p>
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-sm font-medium text-green-700">{recommendation.impact} kg CO2 saved</span>
                        <span className="text-sm text-gray-500 mt-1">
                          {recommendation.difficulty === 'beginner'? '🌱 Easy' 
                           : recommendation.difficulty === 'intermediate'? '🌳 Medium' 
                           : '🌲 Hard'}
                        </span>
                      </div>
                    </div>
                    
                    <button className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                      Complete
                    </button>
                  </div>
                ))}
                
                {!recommendationsData || recommendationsData.length === 0? (
                  <div className="col-span-3 text-center p-6">
                    <p className="text-gray-600">No recommendations available</p>
                    <button className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
                      Explore Education
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        )}

        {/* Gamification Section */}
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-gray-800">Your Progress</h3>
          
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Badges */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <h4 className="text-lg font-semibold text-green-800">Eco Warrior</h4>
                <div className="w-8 h-8 flex items-center justify-center bg-green-200 text-green-900 rounded-full">🌱</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">Completed 5 recommendations</p>
            </div>
            
            {/* Streak */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <h4 className="text-lg font-semibold text-blue-800">Streak</h4>
                <div className="w-8 h-8 flex items-center justify-center bg-blue-200 text-blue-900 rounded-full">🔥</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">7 days in a row</p>
            </div>
            
            {/* Impact Summary */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <h4 className="text-lg font-semibold text-yellow-800">Total Impact</h4>
                <div className="w-8 h-8 flex items-center justify-center bg-yellow-200 text-yellow-900 rounded-full">💡</div>
              </div>
              <p className="text-sm text-gray-600 mt-2">120 kg CO2 saved</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UV_Dashboard;