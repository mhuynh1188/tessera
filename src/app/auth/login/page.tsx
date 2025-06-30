'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hexagon, Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { AuthFormData } from '@/types';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      const { authService } = await import('@/lib/auth');
      await authService.signIn(formData.email, formData.password!);
      
      toast.success('Welcome back! 🎉', {
        icon: '🚀',
        style: {
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          color: 'white',
        },
      });
      
      // Small delay for better UX, then redirect
      setTimeout(() => {
        window.location.href = '/workspace';
      }, 1000);
    } catch (error: any) {
      toast.error(error?.message || 'Invalid email or password', {
        style: {
          background: 'linear-gradient(90deg, #ef4444, #f97316)',
          color: 'white',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            <div className={`w-1 h-1 bg-blue-400/20 rounded-full`}></div>
          </div>
        ))}
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Enhanced Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="group flex items-center space-x-3 hover:scale-105 transition-transform duration-300">
            <div className="relative">
              <Hexagon className="h-10 w-10 text-blue-400 group-hover:text-purple-400 transition-colors duration-300" />
              <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl group-hover:bg-purple-400/30 transition-all duration-300"></div>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent group-hover:from-blue-200 group-hover:to-purple-200 transition-all duration-300">
              Hexies
            </span>
          </Link>
        </div>

        <Card className="border-2 border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="text-gray-300 text-lg">
              Enter your credentials to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="your@email.com"
                    className={`w-full rounded-xl border-2 bg-white/5 backdrop-blur-sm px-4 py-3 text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none ${
                      focusedField === 'email' ? 'border-blue-400 shadow-lg shadow-blue-500/25' : 'border-white/20'
                    } ${errors.email ? 'border-red-400' : ''}`}
                    disabled={isLoading}
                  />
                  {formData.email && !errors.email && (
                    <CheckCircle2 className="absolute right-3 top-3.5 h-5 w-5 text-green-400" />
                  )}
                  {errors.email && (
                    <AlertCircle className="absolute right-3 top-3.5 h-5 w-5 text-red-400" />
                  )}
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-200">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    className={`w-full rounded-xl border-2 bg-white/5 backdrop-blur-sm px-4 py-3 pr-12 text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none ${
                      focusedField === 'password' ? 'border-blue-400 shadow-lg shadow-blue-500/25' : 'border-white/20'
                    } ${errors.password ? 'border-red-400' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 h-5 w-5 text-gray-400 hover:text-white transition-colors duration-200"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm mt-1">{errors.password}</p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-400 focus:ring-2 focus:ring-blue-400 focus:ring-offset-0"
                    disabled={isLoading}
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-300">
                    Remember me for 30 days
                  </label>
                </div>
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl shadow-blue-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign in to Hexies'
                )}
              </Button>
            </form>
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 py-3 rounded-xl"
                  disabled={isLoading}
                  onClick={async () => {
                    try {
                      const { authService } = await import('@/lib/auth');
                      await authService.signInWithProvider('google');
                    } catch (error: any) {
                      toast.error(error?.message || 'Google sign in failed');
                    }
                  }}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </Button>
                <Button 
                  variant="outline"
                  className="bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 py-3 rounded-xl"
                  disabled={isLoading}
                  onClick={async () => {
                    try {
                      const { authService } = await import('@/lib/auth');
                      await authService.signInWithProvider('github');
                    } catch (error: any) {
                      toast.error(error?.message || 'GitHub sign in failed');
                    }
                  }}
                >
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GitHub
                </Button>
              </div>
            </div>
            
            <div className="mt-6 text-center text-sm">
              <span className="text-gray-400">Don't have an account?</span>{' '}
              <Link href="/auth/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
                Create one free
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors duration-200 group">
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}