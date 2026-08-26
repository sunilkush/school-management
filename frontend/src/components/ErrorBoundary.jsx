import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (!import.meta.env.PROD) {
      console.error("ErrorBoundary caught:", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--background)",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 480,
            textAlign: "center",
            background: "var(--surface)",
            borderRadius: 16,
            padding: "48px 32px",
            boxShadow: "var(--shadow-strong)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 8,
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            An unexpected error occurred. Please refresh the page or contact
            support if the problem persists.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "var(--purple)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "10px 28px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
