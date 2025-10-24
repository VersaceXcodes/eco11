import React, { useState } from 'react';
import { useAppStore } from '@/store/main';
import { Link } from 'react-router-dom';
import axios from 'axios';

const UV_OnboardingQuiz: React.FC = () => {
  // Global state access
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const clearError = useAppStore(state => state.clear_error);

  // Local state management
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skipQuiz, setSkipQuiz] = useState(false);

  // Mock questions based on FRD requirements
  const questions = [
    {
      id: 1,
      text: 'What are your main sustainability challenges?',
      options: ['Transportation', 'Home Energy', 'Diet', 'Shopping', 'Waste', 'Water'],
    },
    {
      id: 2,
      text: 'Which eco-actions do you already practice?',
      options: ['Recycling', 'Using reusable bags', 'Reducing meat consumption', 'Using public transport'],
    },
    {
      id: 3,
      text: 'What are your primary goals for using eco11?',
      options: ['Reduce carbon footprint', 'Learn more about sustainability', 'Join a community', 'Track progress'],
    },
    {
      id: 4,
      text: 'How would you rate your current sustainability knowledge?',
      options: ['Beginner', 'Intermediate', 'Advanced'],
    },
    {
      id: 5,
      text: 'Which areas would you like to focus on?',
      options: ['Transportation', 'Home Energy', 'Diet', 'Shopping', 'Waste', 'Water'],
    },
  ];

  // Handle answer selection
  const handleAnswerChange = (stepId: number, value: string[]) => {
    setAnswers(prev => ({...prev, [stepId]: value }));
  };

  // Progress through steps
  const handleNext = () => {
    if (currentStep < questions.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Skip quiz functionality
  const handleSkip = () => {
    setSkipQuiz(true);
    window.location.href = '/onboarding/setup';
  };

  // Submit quiz answers
  const handleSubmitQuiz = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    clearError();

    try {
      if (!currentUser?.id) {
        throw new Error('User ID not available');
      }

      // Submit answers to backend
      await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}api/users/${currentUser.id}`,
        { preferences: answers }
      );

      // Redirect after successful submission
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Quiz submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render current question or submission UI
  const currentQuestion = questions.find(q => q.id === currentStep);

  if (!currentQuestion) {
    // Final submission step
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quiz Completed!</h2>
          <p className="text-gray-600 mb-8">Your preferences have been collected.</p>
          <button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
          >
            {isSubmitting? 'Submitting...' : 'Submit Preferences'}
          </button>
        </div>
      </div>
    );
  }

  // Calculate if current step has valid answers
  const hasValidAnswer = Array.isArray(answers[currentStep]) && answers[currentStep].length > 0;

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        {/* Progress Indicator */}
        <div className="flex justify-between mb-6">
          <div className="flex items-center">
            <span className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
              {currentStep}
            </span>
          </div>
          <button
            onClick={handleSkip}
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            Skip
          </button>
        </div>

        {/* Question Section */}
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          {currentQuestion.text}
        </h3>

        <div className="space-y-3">
          {currentQuestion.options.map(option => (
            <label 
              key={option} 
              className="block text-gray-800 cursor-pointer"
            >
              <input
                type="checkbox"
                className="mr-2 appearance-checkbox bg-white border border-gray-300 rounded-lg text-blue-600 shadow-sm focus:ring-blue-500 focus:ring-offset-2 focus:ring-2"
                value={option}
                onChange={(e) => {
                  const values = (answers[currentStep] || []).filter(v => v!== option);
                  if (e.target.checked) {
                    values.push(option);
                  }
                  handleAnswerChange(currentStep, values);
                }}
              />
              {option}
            </label>
          ))}
        </div>

        {/* Navigation Controls */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!hasValidAnswer}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UV_OnboardingQuiz;