import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clearAllAuthDataWithRecovery } from '@/lib/utils';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is an authentication-related error
    const isAuthError = error.message?.includes('404') || 
                       error.message?.includes('NOT_FOUND') ||
                       error.message?.includes('session') ||
                       error.message?.includes('auth');
    
    if (isAuthError) {
      return { hasError: true, error };
    }
    
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
    
    // If it's an auth error, clear the session
    if (error.message?.includes('404') || 
        error.message?.includes('NOT_FOUND') ||
        error.message?.includes('session') ||
        error.message?.includes('auth')) {
      clearAllAuthDataWithRecovery();
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/hr';
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Error</h2>
            <p className="text-gray-600 mb-4">
              Your session has expired or become invalid. You will be redirected to the login page.
            </p>
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary; 