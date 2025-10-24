import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';
import { z } from 'zod';

// Schema for challenge details
const ChallengeDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  rules: z.array(z.string()),
  progress: z.number(),
  participants: z.array(z.string()),
  required_activities: z.array(z.string()),
});

type ChallengeDetail = z.infer<typeof ChallengeDetailSchema>;

// Schema for user progress
const UserProgressSchema = z.object({
  progress_percentage: z.number(),
  completed_activities: z.array(z.string()),
});

type UserProgress = z.infer<typeof UserProgressSchema>;

const UV_ChallengeDetails: React.FC = () => {
  // Get challenge ID from URL parameter
  const challengeId = window.location.pathname.split('/').pop() || '';

  // Get auth state
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const logout = useAppStore(state => state.logout_user);

  // Fetch challenge details
  const { data: challengeData, isLoading: challengeLoading, error: challengeError } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/challenges/${challengeId}`
      );
      return ChallengeDetailSchema.parse(response.data);
    },
  });

  // Fetch user progress
  const { data: userProgressData, isLoading: progressLoading, error: progressError } = useQuery({
    queryKey: ['user_progress', challengeId],
    queryFn: async () => {
      if (!currentUser) return null;
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user_challenges/${challengeId}`
      );
      return UserProgressSchema.parse(response.data);
    },
    enabled:!!currentUser,
  });

  // Join challenge mutation
  const [joinMutation] = useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('User not authenticated');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/challenges/${challengeId}/join`,
        {},
        { headers: { Authorization: `Bearer ${currentUser.auth_token}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      // Refetch user progress after joining
      queryClient.invalidateQueries(['user_progress', challengeId]);
    },
  });

  // Handle errors
  if (challengeError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold text-red-600 mb-4">
            Error loading challenge details
          </h2>
          <p className="text-gray-700">{challengeError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (challengeLoading || progressLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!challengeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Challenge not found
          </h2>
          <Link
            to="/community"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  const isJoined = userProgressData!== null;

  return (
    <>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <h1 className="text-xl font-bold text-gray-900">
                {challengeData.title}
              </h1>
              <Link
                to="/community"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Back
              </Link>
            </div>
          </div>
        </header>

        {/* Challenge Details */}
        <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-xl p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {challengeData.title}
                </h2>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Description
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {challengeData.description}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Duration
                </h3>
                <p className="mt-2 text-gray-600">
                  {challengeData.duration}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-700">
                  Rules
                </h3>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  {challengeData.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          {isJoined && (
            <div className="mt-12 bg-white shadow-lg rounded-xl p-8">
              <h3 className="text-lg font-semibold text-gray-700">
                Your Progress
              </h3>
              
              <div className="mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {userProgressData?.progress_percentage || 0}%
                  </span>
                  <span className="text-gray-600">
                    {userProgressData?.completed_activities?.length || 0} / 
                    {challengeData.required_activities.length} activities completed
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full mt-1">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                    style={{ width: `${userProgressData?.progress_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Participant List */}
          <div className="mt-12 bg-white shadow-lg rounded-xl p-8">
            <h3 className="text-lg font-semibold text-gray-700">
              Participants ({challengeData.participants.length})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {challengeData.participants.map((participantId, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {/* Placeholder for participant avatar */}
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-gray-600">User {index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mt-12 bg-white shadow-lg rounded-xl p-8">
            <h3 className="text-lg font-semibold text-gray-700">
              Leaderboard
            </h3>
            
            <div className="mt-4">
              {/* Placeholder for leaderboard entries */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Alex Green</span>
                  </div>
                  <span className="text-sm text-gray-600">75%</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Sam Eco</span>
                  </div>
                  <span className="text-sm text-gray-600">65%</span>
                </div>
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                    <span className="text-sm text-gray-600">Jordan Green</span>
                  </div>
                  <span className="text-sm text-gray-600">55%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Join Button */}
          {!isJoined && (
            <div className="mt-12 text-center">
              <button
                onClick={() => joinMutation.mutate()}
                disabled={joinMutation.isPending}
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joinMutation.isPending? 'Joining...' : 'Join Challenge'}
              </button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default UV_ChallengeDetails;
