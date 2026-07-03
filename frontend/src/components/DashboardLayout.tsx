import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { io } from 'socket.io-client';

interface Tab {
  id: string;
  label: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  title: string;
  role: string;
  tabs: Tab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  children: ReactNode;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export default function DashboardLayout({ title, role, tabs, activeTab, setActiveTab, children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeLang, setActiveLang] = useState('English');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  // Notification States
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: number; text: string; time: string; type: string }>>([
    { id: 1, text: 'System backup completed successfully.', time: '1h ago', type: 'info' },
    { id: 2, text: 'Emergency warning: Dengue outbreak surge risk in Sector 3.', time: '2h ago', type: 'warning' },
    { id: 3, text: 'New appointment request pending approval.', time: '3h ago', type: 'action' },
  ]);

  // AI Copilot States
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Message[]>([
    { id: 1, text: `Hello! I am your MediConnect AI Assistant. How can I assist you as a ${role} today?`, sender: 'bot' }
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const copilotMessagesEndRef = useRef<HTMLDivElement>(null);

  // Sync real-time socket alerts for notifications
  useEffect(() => {
    const socket = io('http://127.0.0.1:5000');
    socket.on('new_inventory_request', (data) => {
      setNotifications(prev => [
        { id: Date.now(), text: `New Request from ${data.hospital}: ${data.quantity}x ${data.medicine}`, time: 'Just now', type: 'action' },
        ...prev
      ]);
    });
    socket.on('inventory_approved', (data) => {
      setNotifications(prev => [
        { id: Date.now(), text: `Procurement request approved: ${data.medicine}`, time: 'Just now', type: 'info' },
        ...prev
      ]);
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (isCopilotOpen) {
      copilotMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [copilotMessages, isCopilotOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const handleSendCopilot = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now(), text, sender: 'user' };
    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput('');
    setIsCopilotLoading(true);

    try {
      const response = await api.post('/copilot/chat', { message: text });
      const botMsg: Message = { id: Date.now() + 1, text: response.data.reply, sender: 'bot' };
      setCopilotMessages(prev => [...prev, botMsg]);
    } catch (e) {
      const errMsg: Message = { id: Date.now() + 1, text: "I'm having trouble connecting to the AI models. Please try again shortly.", sender: 'bot' };
      setCopilotMessages(prev => [...prev, errMsg]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const getQuickCommands = () => {
    switch (role) {
      case 'Patient':
        return ['Book an appointment for tomorrow', 'Check my medication list', 'Find nearby ICU beds'];
      case 'Doctor':
        return ['Summarize recent reports', 'Suggest diagnosis for elevated blood pressure', 'View my schedule'];
      case 'HospitalAdmin':
        return ['Show medicines expiring this month', 'Add 5 General Ward beds', 'Show revenue report'];
      case 'DistrictAdmin':
        return ['Compare hospital bed availability', 'Redistribute ORS stock', 'Show Dengue disease map'];
      case 'SuperAdmin':
        return ['Perform system database backup', 'List active AI Models', 'Show system load logs'];
      default:
        return ['Help me find data', 'Check system status'];
    }
  };

  const handleClearNotif = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen flex bg-clay text-dark transition-colors duration-200">
      
      {/* SIDEBAR */}
      <aside className={`bg-white border-r border-accent/35 flex flex-col justify-between transition-all duration-300 z-20 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <div>
          {/* Logo / Brand */}
          <div className="h-16 flex items-center px-4 justify-between border-b border-accent/25">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md shadow-secondary/30">M</div>
                <span className="font-extrabold text-lg text-dark tracking-wide">Medi<span className="text-secondary">Connect</span></span>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto shadow-md">M</div>
            )}
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 hover:bg-accent/40 rounded-lg text-secondary hover:text-[#00a892] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? 'bg-accent text-secondary shadow-sm shadow-secondary/10' 
                      : 'text-secondary/70 hover:text-secondary hover:bg-accent/35'
                  }`}
                >
                  <div className={`w-5 h-5 flex items-center justify-center ${isActive ? 'text-secondary' : 'text-secondary/40'}`}>
                    {tab.icon}
                  </div>
                  {!isSidebarCollapsed && <span>{tab.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Role/User & Logout */}
        <div className="p-4 border-t border-accent/25 space-y-3">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3 bg-accent/25 p-2 rounded-xl">
              <div className="w-9 h-9 bg-secondary text-white font-bold rounded-lg flex items-center justify-center shadow-md">
                {role.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-dark truncate">{role} User</p>
                <p className="text-[10px] text-dark/60 font-medium truncate">demo_{role.toLowerCase()}</p>
              </div>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-accent/20 flex items-center justify-between px-6 z-10">
          
          {/* Search bar & Role Badge */}
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-secondary/60">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </span>
              <input 
                type="text" 
                placeholder="Search resources, records..." 
                className="w-full pl-9 pr-4 py-1.5 bg-accent/30 border-none rounded-xl text-xs focus:ring-2 focus:ring-secondary outline-none transition-all shadow-inner"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-dark">{title}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-accent text-secondary rounded">
                {role}
              </span>
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-4">
            
            {/* Language Switcher */}
            <div className="relative">
              <button 
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="px-2.5 py-1.5 bg-accent/35 text-xs font-semibold rounded-lg hover:bg-accent/60 transition-colors flex items-center gap-1.5 text-secondary"
              >
                <span>🌐 {activeLang.substring(0, 3).toUpperCase()}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-1 w-32 bg-white border border-accent/25 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  {['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setActiveLang(lang);
                        setIsLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-dark hover:bg-accent/30 font-semibold"
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 hover:bg-accent/35 rounded-xl text-secondary transition-colors relative"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-accent/25 rounded-2xl shadow-xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-accent/25 flex justify-between items-center bg-accent/20">
                    <span className="text-xs font-bold text-dark">Alerts & Notifications ({notifications.length})</span>
                    {notifications.length > 0 && (
                      <button onClick={() => setNotifications([])} className="text-[10px] text-secondary hover:underline font-bold">Clear All</button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-accent/10">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-dark/50">No new notifications.</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-3 text-xs flex justify-between gap-3 hover:bg-accent/25 transition-colors">
                          <div className="space-y-1">
                            <p className="text-dark">{n.text}</p>
                            <span className="text-[10px] text-dark/50 font-medium">{n.time}</span>
                          </div>
                          <button onClick={() => handleClearNotif(n.id)} className="text-secondary/40 hover:text-red-500 font-bold self-start text-sm">&times;</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <div className="w-8 h-8 rounded-xl bg-secondary text-white font-bold flex items-center justify-center shadow-md">
                  {role.charAt(0)}
                </div>
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-accent/25 rounded-2xl shadow-xl z-50 overflow-hidden py-1 text-xs">
                  <div className="px-4 py-2 border-b border-accent/15 bg-accent/20">
                    <p className="font-bold text-dark">demo_{role.toLowerCase()}</p>
                    <p className="text-[10px] text-dark/60">{role}</p>
                  </div>
                  <button className="w-full text-left px-4 py-2 hover:bg-accent/25 text-dark font-medium">My Profile</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-accent/25 text-dark font-medium">Account Settings</button>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 hover:text-red-500 text-red-500 font-bold border-t border-accent/15"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* CONTENT AREA */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* FLOATING AI COPILOT CIRCULAR BUTTON */}
      <button 
        onClick={() => setIsCopilotOpen(!isCopilotOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-secondary text-white rounded-full shadow-[inset_3px_3px_6px_#00e6c8,inset_-3px_-3px_6px_#009c87,0_10px_20px_rgba(0,191,166,0.3)] hover:shadow-[inset_1px_1px_3px_#00e6c8,inset_-1px_-1px_3px_#009c87,0_14px_28px_rgba(0,191,166,0.45)] flex items-center justify-center border border-secondary/25 z-40 transition-all hover:scale-105 active:scale-95 text-xl font-bold"
        title="Open AI Copilot"
      >
        ✨
      </button>

      {/* FLOATING GLASS COPILOT CARD */}
      <AnimatePresence>
        {isCopilotOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 25 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-white/90 backdrop-blur-lg border border-accent/60 rounded-3xl shadow-[0_15px_40px_rgba(0,191,166,0.18)] z-30 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-secondary text-white flex justify-between items-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.35)]">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <h3 className="font-extrabold text-sm leading-none">MediConnect AI</h3>
                  <span className="text-[10px] text-teal-100 font-medium">Active Copilot Session</span>
                </div>
              </div>
              <button onClick={() => setIsCopilotOpen(false)} className="text-white hover:text-teal-200 transition-colors p-1">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Chat history */}
            <div className="flex-1 p-4 overflow-y-auto bg-accent/20 flex flex-col gap-3">
              {copilotMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-xs shadow-sm font-semibold leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-secondary text-white rounded-tr-none' 
                        : 'bg-white border border-accent/40 text-dark rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isCopilotLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-accent/40 text-dark p-3 rounded-2xl rounded-tl-none text-xs shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={copilotMessagesEndRef} />
            </div>

            {/* Quick Prompt Suggester */}
            <div className="p-3 bg-white/80 border-t border-accent/30 backdrop-blur-sm">
              <p className="text-[10px] font-bold text-dark/65 mb-1.5 tracking-wider uppercase">💡 Quick Commands</p>
              <div className="flex flex-wrap gap-1.5">
                {getQuickCommands().map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendCopilot(cmd)}
                    className="text-[10px] text-secondary hover:text-white border border-secondary/35 hover:bg-secondary px-2 py-1 rounded-lg text-left transition-colors font-semibold"
                  >
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input form */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendCopilot(copilotInput); }}
              className="p-3 bg-white border-t border-accent/30 flex items-center gap-2"
            >
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Tell Copilot to search, trigger workflows..."
                className="flex-1 bg-accent/30 border-none px-3.5 py-2 rounded-xl text-xs focus:ring-2 focus:ring-secondary outline-none shadow-inner"
              />
              <button
                type="submit"
                disabled={!copilotInput.trim() || isCopilotLoading}
                className="p-2 bg-secondary text-white rounded-xl shadow-md hover:bg-[#00a892] disabled:opacity-50 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5 -rotate-45 ml-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
