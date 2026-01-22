import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const navigate = useNavigate();

  // Redirect to dashboard immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 2000); // Redirect after 2 seconds to show message

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]
          from-green-500/10 via-transparent to-transparent"></div>
      </div>
      
      <div className="relative w-full max-w-md z-10">
        {/* Glass card container */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">WILDGUARD AI</h1>
            <p className="text-gray-400 mb-2">Secure AI Surveillance System</p>
            
            <div className="mt-8">
              <div className="animate-pulse">
                <svg className="w-16 h-16 mx-auto text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mt-4">Access Granted</h2>
              <p className="text-gray-400 mt-2">Authentication is disabled for demo purposes</p>
              <p className="text-green-400 mt-4">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
