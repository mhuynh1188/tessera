'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Simplified types for now
interface UserType {
  id: string;
  email: string;
}

// Simple components to avoid import errors
function Button({ children, className, onClick, variant = "default", size = "default", ...props }: any) {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors";
  const variantClasses = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "bg-transparent text-gray-300 hover:bg-gray-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };
  const sizeClasses = {
    default: "px-4 py-2",
    sm: "px-3 py-1 text-sm"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}

export default function GameifiedWorkspacePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
      setUser({ id: '1', email: 'user@example.com' });
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">Loading Workspace...</h3>
          <p className="text-gray-500">Preparing your workspace experience</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/workspace">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <span className="mr-2">←</span>
                  Back to Library
                </Button>
              </Link>
            </div>
            <h1 className="text-xl font-semibold text-white">Workspace Board</h1>
            <div className="flex items-center space-x-4">
              <Button size="sm">
                <span className="mr-2">💾</span>
                Save
              </Button>
              <Button variant="outline" size="sm">
                <span className="mr-2">📤</span>
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Workspace Board</h2>
          <p className="text-gray-300 mb-6">
            This is a simplified workspace board. The full featured board with all components 
            will be restored once all dependencies are properly configured.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎯 Scenarios</h3>
              <p className="text-sm text-gray-400">Interactive scenario library coming soon</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎮 Gameplay</h3>
              <p className="text-sm text-gray-400">Gamified workspace mechanics coming soon</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🛡️ Safety</h3>
              <p className="text-sm text-gray-400">Psychological safety dashboard coming soon</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2">👥 Collaboration</h3>
              <p className="text-sm text-gray-400">Real-time collaboration tools coming soon</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2">🔧 Custom Cards</h3>
              <p className="text-sm text-gray-400">Custom hexie creator coming soon</p>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="font-semibold mb-2">📊 Analytics</h3>
              <p className="text-sm text-gray-400">Workspace analytics coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}