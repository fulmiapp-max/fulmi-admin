import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Plans from './pages/Plans';
import Banners from './pages/Banners';
import Announcements from './pages/Announcements';
import PushNotifications from './pages/PushNotifications';
import Support from './pages/Support';
import PromptManager from './pages/PromptManager';
import SystemSettings from './pages/SystemSettings';
import Login from './pages/Login';

// Wrapper component to guard pages based on token existence
function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = sessionStorage.getItem('adminToken');
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!token && !isLocal) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route
          path="/*"
          element={
            <AuthGuard>
              <div className="flex h-screen bg-slate-50 overflow-hidden">
                {/* Responsive Sidebar */}
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

                {/* Main Content Area */}
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Responsive Header */}
                  <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

                  {/* Scrollable Page Router Viewport */}
                  <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/plans" element={<Plans />} />
                      <Route path="/banners" element={<Banners />} />
                      <Route path="/announcements" element={<Announcements />} />
                      <Route path="/push" element={<PushNotifications />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/prompts" element={<PromptManager />} />
                      <Route path="/system" element={<SystemSettings />} />
                      {/* Fallback to Dashboard */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </AuthGuard>
          }
        />
      </Routes>
    </Router>
  );
}
