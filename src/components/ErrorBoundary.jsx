import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 ErrorBoundary caught an error:', error);
    console.error('🔴 Error info:', errorInfo);
    console.error('🔴 Component stack:', errorInfo.componentStack);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red' }}>⚠️ Something went wrong on the About page</h1>
          <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer' }}>Error details (click to expand)</summary>
            <p><strong>Error:</strong> {this.state.error?.toString()}</p>
            <p><strong>Stack:</strong></p>
            <pre style={{ background: '#f0f0f0', padding: '1rem', overflow: 'auto' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
