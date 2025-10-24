import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Define types
interface BusinessProfile {
  id: string;
  business_name: string;
  industry: string;
  employee_count: number;
  sustainability_certifications: Array<{
    id: string;
    name: string;
    file_url: string;
  }>;
}

interface TeamChallenge {
  id: string;
  title: string;
  description: string;
  progress: number;
  participants: number;
}

const UV_BusinessProfile: React.FC = () => {
  // Auth state
  const currentUser = useAppStore(state => state.business_profile);
  const clearError = useAppStore(state => state.clear_error);
  const setBusinessProfile = useAppStore(state => state.set_business_profile);

  // Data fetching
  const { data: profile, isLoading, error, refetch } = useQuery(
    ['business-profile'],
    async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/business/profile`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`
          }
        }
      );
      return response.data;
    }
  );

  // Update profile mutation
  const [updateProfile] = useMutation({
    mutationFn: (newData) => axios.patch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/business/profile`,
      newData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    )
  });

  // File upload mutation
  const [uploadFile] = useMutation({
    mutationFn: (file) => axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/upload`,
      { file },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    )
  });

  // Create challenge mutation
  const [createChallenge] = useMutation({
    mutationFn: (challengeData) => axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/challenges`,
      challengeData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        }
      }
    )
  });

  // Form state
  const [formData, setFormData] = useState({
    business_name: profile?.business_name || '',
    industry: profile?.industry || '',
    employee_count: profile?.employee_count || 0,
  });
  
  const [certifications, setCertifications] = useState(profile?.sustainability_certifications || []);
  const [newCertification, setNewCertification] = useState('');
  const [challengeForm, setChallengeForm] = useState({
    title: '',
    description: '',
  });

  // Side effects
  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name,
        industry: profile.industry,
        employee_count: profile.employee_count,
      });
      setCertifications(profile.sustainability_certifications);
    }
  }, [profile]);

  // Error handling
  useEffect(() => {
    if (error) {
      console.error('Error fetching business profile:', error);
    }
  }, [error]);

  // Form handlers
  const handleUpdateProfile = async () => {
    try {
      const updatedProfile = await updateProfile(formData);
      setBusinessProfile(updatedProfile);
      clearError();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await uploadFile(formData);
      const newCert = {
        id: uuidv4(),
        name: file.name,
        file_url: response.data.file_url,
      };
      setCertifications([...certifications, newCert]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleCreateChallenge = async () => {
    try {
      const challengeData = {
        title: challengeForm.title,
        description: challengeForm.description,
        business_id: currentUser?.id
      };
      
      await createChallenge(challengeData);
      setChallengeForm({ title: '', description: '' });
    } catch (error) {
      console.error('Error creating challenge:', error);
    }
  };

  // Render
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Business Profile</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Profile Section */}
        <section className="space-y-6 mb-12">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleUpdateProfile();
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name
                  </label>
                  <input
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="relative w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="relative w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="employee_count" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Employees
                  </label>
                  <input
                    id="employee_count"
                    name="employee_count"
                    type="number"
                    value={formData.employee_count}
                    onChange={(e) => setFormData({...formData, employee_count: Number(e.target.value)})}
                    className="relative w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={updateProfile.isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateProfile.isLoading? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : (
                  'Save Profile'
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Certifications Section */}
        <section className="mb-12">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Sustainability Certifications</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {certifications.map((cert, index) => (
                <div key={cert.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-md"></div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{cert.name}</h3>
                    <p className="text-sm text-gray-600">{cert.file_url? 'Uploaded' : 'Pending upload'}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="block w-full text-sm text-gray-700"
              />
              <button
                type="button"
                disabled={!newCertification}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Certification
              </button>
            </div>
          </div>
        </section>

        {/* Team Challenges Section */}
        <section>
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Challenges</h2>
            
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Create New Challenge</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleCreateChallenge();
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Challenge Title
                    </label>
                    <input
                      id="title"
                      name="title"
                      value={challengeForm.title}
                      onChange={(e) => setChallengeForm({...challengeForm, title: e.target.value})}
                      className="relative w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={challengeForm.description}
                      onChange={(e) => setChallengeForm({...challengeForm, description: e.target.value})}
                      className="relative w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    ></textarea>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={createChallenge.isLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createChallenge.isLoading? 'Creating...' : 'Create Challenge'}
                </button>
              </form>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Active Challenges</h3>
              {/* Placeholder for challenge list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(3).fill().map((_, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900">Challenge Title</h4>
                    <p className="text-sm text-gray-600">Description text here</p>
                    <div className="mt-2">
                      <progress className="progress progress-primary" value="50" max="100"></progress>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UV_BusinessProfile;