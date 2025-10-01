import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary yakaladı:', error, errorInfo);
    
    // Handle specific DOM manipulation errors
    if (error.name === 'NotFoundError' && error.message.includes('insertBefore')) {
      console.warn('DOM manipulation error caught - likely due to React StrictMode or async operations');
      // Clear any pending DOM operations
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 1000);
    }
    
    // Handle date format errors
    if (error instanceof RangeError && error.message.includes('Invalid time value')) {
      console.warn('Date format error caught:', error);
      // Clear the error state to allow recovery
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 1500);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Geçici Bir Hata Oluştu
              </h2>
              <p className="text-gray-600 mb-6">
                Uygulama geçici bir sorunla karşılaştı. Lütfen birkaç saniye bekleyin veya sayfayı yenileyin.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Sayfayı Yenile
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium">Hata Detayları</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;