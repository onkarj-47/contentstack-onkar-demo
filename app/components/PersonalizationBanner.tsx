"use client";

import { useState, useEffect } from "react";

interface PersonalizationBannerProps {
  onEmailSubmit: (email: string) => void;
  onDismiss: () => void;
}

export default function PersonalizationBanner({ onEmailSubmit, onDismiss }: PersonalizationBannerProps) {
  const [email, setEmail] = useState("");
  const [isConsentChecked, setIsConsentChecked] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log("🎯 PersonalizationBanner: Component mounted");
    
    // Check if user has already provided email or dismissed banner
    const hasPersonalizationEmail = localStorage.getItem('personalization_email');
    const hasDismissedBanner = localStorage.getItem('personalization_banner_dismissed');
    const maybeLaterDate = localStorage.getItem('personalization_maybe_later');
    
    console.log("🎯 PersonalizationBanner: Storage check", {
      hasPersonalizationEmail: !!hasPersonalizationEmail,
      hasDismissedBanner: !!hasDismissedBanner,
      maybeLaterDate,
      shouldShow: !hasPersonalizationEmail && !hasDismissedBanner
    });
    
    if (!hasPersonalizationEmail && !hasDismissedBanner) {
      console.log("🎯 PersonalizationBanner: Setting timer to show banner in 2 seconds");
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        console.log("🎯 PersonalizationBanner: Timer fired, showing banner");
        setIsVisible(true);
      }, 2000);
      return () => {
        console.log("🎯 PersonalizationBanner: Timer cleared");
        clearTimeout(timer);
      };
    } else {
      console.log("🎯 PersonalizationBanner: Not showing banner - user already has email or dismissed");
    }
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🎯 PersonalizationBanner: Form submitted", { email, isConsentChecked });
    setEmailError("");

    if (!email.trim()) {
      console.log("🎯 PersonalizationBanner: Email validation failed - empty");
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      console.log("🎯 PersonalizationBanner: Email validation failed - invalid format");
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!isConsentChecked) {
      console.log("🎯 PersonalizationBanner: Consent validation failed");
      setEmailError("Please confirm your consent to personalize content");
      return;
    }

    console.log("🎯 PersonalizationBanner: Storing personalization data", email);
    
    // Store email and consent
    localStorage.setItem('personalization_email', email);
    localStorage.setItem('personalization_consent', 'true');
    localStorage.setItem('personalization_timestamp', new Date().toISOString());
    
    console.log("🎯 PersonalizationBanner: Data stored, calling onEmailSubmit");
    onEmailSubmit(email);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    console.log("🎯 PersonalizationBanner: User dismissed banner permanently");
    localStorage.setItem('personalization_banner_dismissed', 'true');
    localStorage.setItem('personalization_dismissed_timestamp', new Date().toISOString());
    onDismiss();
    setIsVisible(false);
  };

  const handleMaybeLater = () => {
    console.log("🎯 PersonalizationBanner: User selected 'Maybe Later'");
    // Set a temporary dismissal (will show again after 7 days)
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + 7);
    console.log("🎯 PersonalizationBanner: Will show again after", dismissUntil.toISOString());
    localStorage.setItem('personalization_maybe_later', dismissUntil.toISOString());
    setIsVisible(false);
  };

  if (!isVisible) {
    console.log("🎯 PersonalizationBanner: Not visible, returning null");
    return null;
  }

  console.log("🎯 PersonalizationBanner: Rendering banner");

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleMaybeLater} />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 relative overflow-hidden">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 pt-6 pb-4">
            <div className="text-white text-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Get Personalized Content</h3>
              <p className="text-blue-100 text-sm">
                We'll curate articles based on your interests to give you the best reading experience
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="personalization-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email Address
                </label>
                <input
                  id="personalization-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start space-x-3">
                <input
                  id="personalization-consent"
                  type="checkbox"
                  checked={isConsentChecked}
                  onChange={(e) => setIsConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="personalization-consent" className="text-sm text-gray-600 leading-relaxed">
                  Yes, personalize my content experience based on my reading preferences. 
                  You can change this anytime in settings.
                </label>
              </div>

              {/* Error Message */}
              {emailError && (
                <div className="text-red-600 text-sm flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{emailError}</span>
                </div>
              )}

              {/* Benefits List */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">What you'll get:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Articles tailored to your interests</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Smart recommendations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Curated newsletter content</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 mt-6">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Start Personalizing
              </button>
              <button
                type="button"
                onClick={handleMaybeLater}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                Maybe Later
              </button>
            </div>

            {/* Privacy Note */}
            <p className="text-xs text-gray-500 text-center mt-4">
              We respect your privacy. Your email is used only for personalization and our newsletter.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}