import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('App render failed', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-boundary">
          <section className="app-error-card">
            <h1>页面刚刚卡住了</h1>
            <p>请刷新一次。如果仍然出现这个提示，后台错误已经被记录到浏览器控制台，方便继续定位。</p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);

