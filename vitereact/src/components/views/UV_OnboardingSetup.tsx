import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '@/store/main';

const services = [
  { id: 'google_maps', name: 'Google Maps', description: 'Enable location tracking for commute logging' },
  { id: 'utility_providers', name: 'Utility Providers', description: 'Automatically track energy and water usage' },
  { id: 'wearables', name: 'Wearables', description: 'Sync fitness data for activity tracking' }
];

const UV_OnboardingSetup: React.FC = () => {
  // Access current user from global store
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  
  // Local state for connected services and progress
  const [connectedServices, setConnectedServices] = useState<string[]>([]);
  const [setupProgress, setSetupProgress] = useState<number>(0);

  // Calculate progress based on connected services
  const totalServices = services.length;
  const progressPercentage = Math.round((connectedServices.length / totalServices) * 100);

  // Handle service connection (mock implementation)
  const handleConnectService = (serviceId: string) => {
    if (!connectedServices.includes(serviceId)) {
      setConnectedServices(prev => [...prev, serviceId]);
      setSetupProgress(Math.round(((prev.length + 1) / totalServices) * 100));
    }
  };

  // Skip setup and navigate to dashboard
  const handleSkipSetup = () => {
    // In a real app, this would update user onboarding status
    window.location.href = '/dashboard';
  };

  if (!currentUser) {
    // Redirect if not authenticated (shouldn't happen in onboarding flow)
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-12 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Connect Services for Auto-Tracking
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Enable integrations to automatically track your environmental impact and reduce manual logging.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="relative w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className={`absolute left-0 top-0 h-full bg-blue-600 rounded-full transition-all duration-200 ease-in-out`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
          <span className="absolute right-0 -bottom-4 text-sm text-gray-500">
            {progressPercentage}% Complete
          </span>
        </div>

        {/* Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map(service => (
            <div 
              key={service.id} 
              className={`group border-2 border-gray-200 rounded-xl p-6 transition-all duration-200 
                ${connectedServices.includes(service.id) 
                 ? 'border-blue-500 bg-blue-50' 
                  : 'hover:shadow-lg hover:shadow-gray-200/50 hover:border-blue-300'}
              `}
            >
              <div className="flex items-center mb-4">
                {/* Service Icon (mocked with text) */}
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 text-2xl font-bold mr-4">
                  {service.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{service.description}</p>
                </div>
              </div>
              
              {/* Connection Status */}
              {connectedServices.includes(service.id)? (
                <div className="mt-4 text-sm text-green-600">
                  ✅ Connected
                </div>
              ) : (
                <button
                  onClick={() => handleConnectService(service.id)}
                  className="mt-4 w-full text-left text-sm text-blue-600 hover:text-blue-700 group-hover:text-blue-800 
                    focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                >
                  Connect Service
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleSkipSetup}
            className="px-6 py-3 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
          >
            Skip Setup
          </button>
          
          <button
            disabled={progressPercentage < 100}
            className={`px-6 py-3 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all 
              ${progressPercentage < 100? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => window.location.href = '/dashboard'}
          >
            Complete Setup
          </button>
        </div>
      </div>
    </div>
  );
};

export default UV_OnboardingSetup;