import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';

// Import des contextes et providers
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';

// Import des composants
import NavigationPanel from './components/layout/NavigationPanel';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/pages/Dashboard';
import PrivateMessagesPage from './components/pages/PrivateMessagesPage';
import ProfilePage from './components/pages/ProfilePage';
import AdminPage from './components/pages/AdminPage';
import SettingsPage from './components/pages/SettingsPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ErrorBoundary>
      <AppProvider value={{ theme, toggleTheme }}>
        <AuthProvider>
          <div className="app">
            <BrowserRouter>
              <NavigationPanel />
              <main className="container">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><PrivateMessagesPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute isAdmin={true}><AdminPage /></ProtectedRoute>} />
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
            </BrowserRouter>
          </div>
        </AuthProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
