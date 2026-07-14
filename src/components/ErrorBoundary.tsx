"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches rendering errors
 * and shows a friendly fallback UI instead of crashing the page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex-1 flex items-center justify-center bg-[#F2EDE1] py-20 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h1
              className="text-2xl font-bold text-[#2C2C2C] mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Something went wrong
            </h1>
            <p className="text-[#8A9283] text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#4A6B6D] text-white text-sm font-medium hover:bg-[#3A5557] transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[#4A6B6D] text-[#4A6B6D] text-sm font-medium hover:bg-[#4A6B6D] hover:text-white transition-all"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
