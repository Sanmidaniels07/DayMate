'use client';
import { Component, type ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err: unknown) { console.error('UI error:', err); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="card m-4 p-8 text-center">
          <p className="text-[15px] text-ink-soft">Something broke on this screen.</p>
          <button onClick={() => this.setState({ hasError: false })}
            className="mt-3 text-[14px] font-semibold text-accent">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}