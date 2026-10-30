import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected application error occurred.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Royal Bites Runtime Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let friendlyDetails = this.state.errorMessage;
      try {
        const parsed = JSON.parse(this.state.errorMessage);
        if (parsed && parsed.operationType && parsed.error) {
          friendlyDetails = `Cloud Database (${parsed.operationType} on ${
            parsed.path || 'collection'
          }): ${parsed.error}`;
        }
      } catch {
        // Keep plain message
      }

      return (
        <div className="min-h-screen rb-bg rb-text flex items-center justify-center p-6">
          <div className="max-w-lg w-full rb-surface border rb-border rounded-lg p-8 space-y-5 shadow-2xl">
            <p className="text-xs font-mono rb-accent tracking-wider uppercase">
              Service Interruption
            </p>
            <h1 className="font-serif text-3xl font-semibold rb-text">
              We encountered an unexpected issue
            </h1>
            <p className="text-sm rb-text-muted leading-relaxed">{friendlyDetails}</p>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, errorMessage: '' });
                  window.location.reload();
                }}
                className="px-5 py-2.5 rounded-md bg-[#D4AF37] text-[#0A0A0C] text-xs font-semibold hover:bg-[#DFBE52] transition-colors"
              >
                Reload Dining Platform
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
