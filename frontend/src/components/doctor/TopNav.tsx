import React from 'react';
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  LanguageIcon, 
  SparklesIcon
} from '@heroicons/react/24/outline';

interface TopNavProps {
  isCollapsed: boolean;
}

export default function TopNav({ isCollapsed }: TopNavProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header 
      className={`fixed top-0 right-0 h-20 bg-white/80 backdrop-blur-md border-b border-accent/20 shadow-sm z-30 transition-all duration-300 flex items-center justify-between px-6 ${isCollapsed ? 'left-20' : 'left-64'}`}
    >
      {/* Left side: Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary/50 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search patients, records, medicines..." 
            className="w-full bg-accent/5 border border-accent/20 rounded-full py-2.5 pl-11 pr-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Right side: Actions & Profile */}
      <div className="flex items-center space-x-6">
        
        {/* Date & Time */}
        <div className="hidden md:block text-right">
          <p className="text-xs font-bold text-dark">{currentTime}</p>
          <p className="text-[10px] text-secondary/60">{currentDate}</p>
        </div>

        <div className="h-8 w-px bg-accent/20 hidden md:block"></div>

        {/* Action Icons */}
        <div className="flex items-center space-x-3">
          {/* AI Status Indicator */}
          <button className="p-2 rounded-full hover:bg-accent/10 transition-colors relative group" title="AI Status: Online">
            <SparklesIcon className="w-5 h-5 text-primary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-green-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>
          
          <button className="p-2 rounded-full hover:bg-accent/10 transition-colors text-secondary" title="Language Switcher">
            <LanguageIcon className="w-5 h-5" />
          </button>
          
          <button className="p-2 rounded-full hover:bg-accent/10 transition-colors text-secondary relative" title="Notifications">
            <BellIcon className="w-5 h-5" />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        <div className="h-8 w-px bg-accent/20"></div>

        {/* Doctor Profile & Online Status */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-dark group-hover:text-primary transition-colors">Dr. Smith</p>
            <div className="flex items-center justify-end space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span className="text-[10px] text-secondary/60">Online</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
            DR
          </div>
        </div>
      </div>
    </header>
  );
}
