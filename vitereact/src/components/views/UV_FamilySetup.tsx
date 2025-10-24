import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const UV_FamilySetup: React.FC = () => {
  // Zustand state and actions
  const familyGroup = useAppStore(state => state.familyGroup);
  const setFamilyGroup = useAppStore(state => state.setFamilyGroup);
  const clearError = useAppStore(state => state.clearAuthError);
  const isLoadingAuth = useAppStore(state => state.authentication_state.authentication_status.isLoading);
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Form state
  const [familyName, setFamilyName] = useState('');
  const [members, setMembers] = useState<string[]>([currentUser?.id || '']);
  const [goals, setGoals] = useState({
    plasticReduction: 0,
    energySavings: 0,
    transportationEmissions: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mutation to create family group
  const createFamilyGroupMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/family/setup`,
        {
          name: familyName,
          members,
          goals: {
            plastic_reduction: goals.plasticReduction,
            energy_savings: goals.energySavings,
            transportation_emissions: goals.transportationEmissions,
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setFamilyGroup(data);
      setFamilyName('');
      setMembers([currentUser?.id || '']);
      setGoals({
        plasticReduction: 0,
        energySavings: 0,
        transportationEmissions: 0,
      });
    },
    onError: (error) => {
      setError('Failed to create family group. Please try again.');
    },
    onMutate: () => {
      clearError();
      setIsSubmitting(true);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  // Check for existing family group on mount
  useEffect(() => {
    if (isLoadingAuth ||!currentUser) return;

    // If family group exists in store, do nothing
    if (familyGroup) return;

    // Optionally fetch from API if needed (not implemented here)
  }, [isLoadingAuth, currentUser, familyGroup]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!familyName.trim()) {
      setError('Please enter a family name.');
      return;
    }

    createFamilyGroupMutation.mutate();
  };

  // Render existing family group or setup form
  if (familyGroup) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Family Group: {familyGroup.name}</h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Members</h3>
              <ul className="list-none">
                {familyGroup.members.map((memberId, index) => (
                  <li key={index} className="px-4 py-2 border-b border-gray-200 last:border-0">
                    {/* Member details would be fetched from API */}
                    User {index + 1}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Goals</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <p>Plastic Reduction:</p>
                  <p>{familyGroup.goals.plastic_reduction}%</p>
                </div>
                <div className="flex justify-between">
                  <p>Energy Savings:</p>
                  <p>{familyGroup.goals.energy_savings}%</p>
                </div>
                <div className="flex justify-between">
                  <p>Transportation Emissions:</p>
                  <p>{familyGroup.goals.transportation_emissions}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Kids' Content</h3>
              <p className="text-gray-700">
                Explore educational content for children in the 
                <Link 
                  to="/education" 
                  className="text-blue-600 hover:text-blue-500 underline"
                >
                  Education Hub
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Create Family Group</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-md mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="familyName" className="block text-lg font-semibold text-gray-700 mb-2">
              Family Name
            </label>
            <input
              id="familyName"
              name="familyName"
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="Enter your family name"
              className="relative block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              required
            />
          </div>
          
          <div>
            <label htmlFor="members" className="block text-lg font-semibold text-gray-700 mb-2">
              Members
            </label>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 mb-2">Current Members:</p>
              <ul className="list-disc list-inside space-y-1">
                {members.map((memberId, index) => (
                  <li key={index}>
                    User {index + 1} (ID: {memberId})
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setMembers([...members, uuidv4()])}
                className="mt-2 inline-flex items-center px-3 py-1 border border-blue-500 text-blue-600 rounded-md hover:bg-blue-50 transition-all duration-200"
              >
                Add Member
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Set Goals</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="plasticReduction" className="block text-lg font-medium text-gray-700 mb-2">
                  Plastic Reduction (%)
                </label>
                <input
                  id="plasticReduction"
                  name="plasticReduction"
                  type="number"
                  min="0"
                  max="100"
                  value={goals.plasticReduction}
                  onChange={(e) => setGoals(prev => ({...prev, plasticReduction: Number(e.target.value) }))}
                  className="relative block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                />
              </div>
              
              <div>
                <label htmlFor="energySavings" className="block text-lg font-medium text-gray-700 mb-2">
                  Energy Savings (%)
                </label>
                <input
                  id="energySavings"
                  name="energySavings"
                  type="number"
                  min="0"
                  max="100"
                  value={goals.energySavings}
                  onChange={(e) => setGoals(prev => ({...prev, energySavings: Number(e.target.value) }))}
                  className="relative block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                />
              </div>
              
              <div>
                <label htmlFor="transportationEmissions" className="block text-lg font-medium text-gray-700 mb-2">
                  Transportation Emissions (%)
                </label>
                <input
                  id="transportationEmissions"
                  name="transportationEmissions"
                  type="number"
                  min="0"
                  max="100"
                  value={goals.transportationEmissions}
                  onChange={(e) => setGoals(prev => ({...prev, transportationEmissions: Number(e.target.value) }))}
                  className="relative block w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 sm:px-6 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isSubmitting? (
                <span className="flex items-center">
                  <svg className="animate-spin -mr-1 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating family group...
                </span>
              ) : (
                'Create Family Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UV_FamilySetup;