import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || '未知错误' };
  }

  componentDidCatch(error) {
    console.error('App render failed', error);
  }

  recoverHome() {
    try {
      localStorage.setItem('felix_blog_active_view', 'overview');
      localStorage.setItem('felix_blog_admin_page', 'overview');
    } catch {
      // Ignore storage recovery failures and still reload the page.
    }
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-error-boundary">
          <section className="app-error-card">
            <h1>页面刚刚卡住了</h1>
            <p>可以先回到首页继续浏览。错误已经记录到浏览器控制台，方便继续定位。</p>
            <p className="app-error-detail">{this.state.message}</p>
            <button className="primary-action" type="button" onClick={() => this.recoverHome()}>
              回到首页
            </button>
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

