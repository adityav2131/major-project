'use client';

import Image from 'next/image';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="mb-8">
                    <Image
            src="/university-logo.jpeg"
            alt="University Logo"
            width={80}
            height={80}
            className="animate-pulse"
            style={{ width: 'auto', height: 'auto' }}
          />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Final Year Project Portal
          </h1>
          <p className="text-gray-600">
            Graphic Era Hill University
          </p>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
          <p className="text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
