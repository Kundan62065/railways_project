import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log the error to an error reporting service here
    // console.error('ErrorBoundary caught error:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-bold mb-2 text-red-600">Something went wrong</h2>
            <p className="text-sm text-gray-700 mb-4">An unexpected error occurred while rendering this page.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleRetry} className="px-4 py-2 bg-[#003d82] text-white rounded">Retry</button>
              <button onClick={() => window.location.reload()} className="px-4 py-2 border rounded">Reload page</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
