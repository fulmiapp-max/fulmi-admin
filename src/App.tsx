import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
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
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
