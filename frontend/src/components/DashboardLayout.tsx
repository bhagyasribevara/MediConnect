import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import AICopilotWidget from './AICopilotWidget';

interface DashboardLayoutProps {
  title: string;
  role: string;
  children: ReactNode;
}

export default function DashboardLayout({ title, role, children }: DashboardLayoutProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-clay text-dark">
      {/* Top Navbar */}
      <header className="w-full h-16 bg-primary shadow-sm flex items-center justify-between px-8 z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-secondary">MediConnect</h1>
          <span className="px-3 py-1 bg-accent text-secondary text-xs rounded-full font-semibold">
            {role}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-gray-500 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          
          <div className="bg-primary p-6 rounded-3xl shadow-clay">
            {children}
          </div>
        </div>
      </main>
      <AICopilotWidget />
    </div>
  );
}
