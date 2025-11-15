import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send error to monitoring service (e.g., Sentry, LogRocket)
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[500px] p-4">
          <Card className="w-full max-w-lg shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="bg-amber-100 p-3 rounded-full">
                  <AlertTriangle className="h-10 w-10 text-amber-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-gray-900">
                {this.props.routeName ? `Error in ${this.props.routeName}` : 'Page Error'}
              </CardTitle>
              <CardDescription>
                Something went wrong while loading this page. Please try again.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 p-3 rounded-lg max-h-32 overflow-auto">
                  <p className="text-xs text-gray-700 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
