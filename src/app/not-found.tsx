'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn, Floating, Magnetic } from '@/components/ui/animations';
import { Home, Search, ArrowLeft, Hexagon, Sparkles } from 'lucide-react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-400"></div>
      </div>
    );
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <Floating key={i} intensity="subtle" speed="slow">
            <div
              className="absolute opacity-10"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              <Hexagon className="h-6 w-6 text-blue-400" />
            </div>
          </Floating>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Animation */}
          <FadeIn delay={0} className="mb-8">
            <div className="relative">
              <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                404
              </h1>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
            </div>
          </FadeIn>

          {/* Hexagon Logo */}
          <FadeIn delay={200}>
            <Floating intensity="medium" speed="medium">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <Hexagon className="h-20 w-20 text-blue-400" />
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                  <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-bounce" />
                </div>
              </div>
            </Floating>
          </FadeIn>

          {/* Error Message */}
          <FadeIn delay={400}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Page Not Found
            </h2>
          </FadeIn>

          <FadeIn delay={600}>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Looks like this hexagon broke away from the tessellation! The page you're looking for 
              doesn't exist or may have been moved.
            </p>
          </FadeIn>

          {/* Search Box */}
          <FadeIn delay={800}>
            <form onSubmit={handleSearch} className="mb-8 max-w-md mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for what you need..."
                  className="w-full px-4 py-3 pl-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-300"
                />
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </form>
          </FadeIn>

          {/* Action Buttons */}
          <FadeIn delay={1000}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Magnetic strength={15}>
                <Link href="/">
                  <Button 
                    variant="primary" 
                    size="lg"
                    className="group"
                  >
                    <Home className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Back to Home
                  </Button>
                </Link>
              </Magnetic>

              <Magnetic strength={15}>
                <Link href="/demo">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 group"
                  >
                    <Sparkles className="h-5 w-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Try Demo
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </FadeIn>

          {/* Help Links */}
          <FadeIn delay={1200}>
            <div className="mt-12 pt-8 border-t border-white/10">
              <p className="text-gray-400 mb-4">Need help finding something?</p>
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <Link href="/contact" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Contact Support
                </Link>
                <Link href="/#features" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Features
                </Link>
                <Link href="/#faq" className="text-blue-400 hover:text-blue-300 transition-colors">
                  FAQ
                </Link>
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Sign In
                </Link>
              </div>
            </div>
          </FadeIn>

          {/* Go Back Button */}
          <FadeIn delay={1400}>
            <div className="mt-8">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors group"
              >
                <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Go back to previous page
              </button>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-8 left-8 opacity-20">
        <Floating intensity="subtle" speed="slow">
          <div className="grid grid-cols-3 gap-2">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}></div>
            ))}
          </div>
        </Floating>
      </div>

      <div className="absolute top-8 right-8 opacity-20">
        <Floating intensity="medium" speed="medium">
          <Hexagon className="h-12 w-12 text-purple-400" />
        </Floating>
      </div>
    </div>
  );
}