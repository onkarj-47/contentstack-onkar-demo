"use client";

import React, { useState, useEffect } from 'react';
import { 
  getUserInterestProfile, 
  clearUserInterests, 
  getInterestStats,
  getUserTopInterests 
} from '@/lib/user-interests';

interface InterestManagerProps {
  onClose?: () => void;
}

export default function InterestManager({ onClose }: InterestManagerProps) {
  const [interestStats, setInterestStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterestData();
  }, []);

  const loadInterestData = () => {
    const stats = getInterestStats();
    setInterestStats(stats);
    setLoading(false);
  };

  const handleClearInterests = () => {
    if (confirm('Are you sure you want to clear all your reading interests? This will reset your personalized recommendations.')) {
      clearUserInterests();
      loadInterestData(); // Reload data
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
            <h3 className="text-2xl font-bold mb-2">Your Reading Interests</h3>
            <p className="text-blue-100">
              Manage your personalized content preferences
            </p>
          </div>
          
          <div className="p-6">
            {interestStats?.hasInterests ? (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{interestStats.totalBlogViews}</div>
                    <div className="text-sm text-gray-600">Articles Read</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{interestStats.totalInterests}</div>
                    <div className="text-sm text-gray-600">Interests Tracked</div>
                  </div>
                </div>

                {/* Top Interests */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Your Top Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {interestStats.topInterests.map((interest: string, index: number) => (
                      <span
                        key={interest}
                        className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize"
                      >
                        #{index + 1} {interest}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Personalization Info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• We track which topics you read about</li>
                    <li>• Your homepage shows content you're interested in</li>
                    <li>• Recommendations get better over time</li>
                    <li>• All data stays in your browser</li>
                  </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleClearInterests}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                  >
                    Clear All Interests
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-6xl text-gray-300 mb-4">📚</div>
                <h4 className="font-semibold text-gray-900">No Interests Yet</h4>
                <p className="text-gray-600 text-sm">
                  Start reading articles to build your personalized experience. We'll track your interests based on the topics you explore.
                </p>
                <button
                  onClick={onClose}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                >
                  Start Reading
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
