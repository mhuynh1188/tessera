'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log to error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-6 text-white text-center">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Oops! Something went wrong</h1>
              <p className="text-red-100">
                We encountered an unexpected error. Don't worry, our team has been notified.
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Bug className="h-4 w-4 mr-2 text-gray-500" />
                    Error Details
                  </h3>
                  <p className="text-sm text-gray-600 font-mono">
                    {this.state.error?.message || 'Unknown error occurred'}
                  </p>
                </div>

                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="bg-gray-50 rounded-lg p-4">
                    <summary className="font-semibold text-gray-900 cursor-pointer">
                      Stack Trace (Development Only)
                    </summary>
                    <pre className="text-xs text-gray-600 mt-2 overflow-auto">
                      {this.state.error?.stack}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

                <div className="flex flex-col space-y-3 pt-4">
                  <Button
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="primary"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="w-full"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Homepage
                  </Button>
                </div>

                <div className="text-center pt-4">
                  <p className="text-xs text-gray-500">
                    If this problem persists, please{' '}
                    <a 
                      href="/contact" 
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      contact our support team
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    // This could be enhanced to work with state management
    // or error reporting services
    console.error('Error caught by useErrorHandler:', error, errorInfo);
    throw error; // Re-throw to be caught by ErrorBoundary
  };
}

// Simple error fallback component
export function ErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <Button onClick={resetErrorBoundary} variant="primary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try again
        </Button>
      </div>
    </div>
  );
}