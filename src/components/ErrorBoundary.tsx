import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import EmptyState from './EmptyState';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[rgb(var(--wt-surface))] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <EmptyState
              title="Something went wrong"
              description={
                this.state.error?.message || 
                "We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists."
              }
              action={
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="primary"
                  >
                    Refresh Page
                  </Button>
                  <Button
                    onClick={() => window.history.back()}
                    variant="ghost"
                  >
                    Go Back
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}