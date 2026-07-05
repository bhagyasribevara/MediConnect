import React from 'react';
import {
  HomeIcon,
  QueueListIcon,
  DocumentMagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  DocumentTextIcon,
  BeakerIcon,
  PencilSquareIcon,
  CalendarDaysIcon,
  ArrowPathRoundedSquareIcon,
  ClockIcon,
  VideoCameraIcon,
  BellIcon,
  ChartBarSquareIcon,
  Cog8ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const MENU_ITEMS = [
  { id: 'overview', label: 'Dashboard Overview', icon: HomeIcon },
  { id: 'queue', label: "Today's Queue", icon: QueueListIcon },
  { id: 'emr', label: 'Patient EMR', icon: DocumentMagnifyingGlassIcon },
  { id: 'consultation', label: 'Consultation', icon: ChatBubbleLeftRightIcon },
  { id: 'ai_support', label: 'AI Clinical Support', icon: SparklesIcon },
  { id: 'medlens', label: 'MedLens Reports', icon: DocumentTextIcon },
  { id: 'lab', label: 'Lab Reports', icon: BeakerIcon },
  { id: 'prescriptions', label: 'Prescriptions', icon: PencilSquareIcon },
  { id: 'appointments', label: 'Appointments', icon: CalendarDaysIcon },
  { id: 'followups', label: 'Follow-ups', icon: ArrowPathRoundedSquareIcon },
  { id: 'schedule', label: 'Duty Schedule', icon: ClockIcon },
  { id: 'telemedicine', label: 'Telemedicine', icon: VideoCameraIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'analytics', label: 'Analytics', icon: ChartBarSquareIcon },
  { id: 'settings', label: 'Settings', icon: Cog8ToothIcon },
];

interface SidebarProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }: SidebarProps) {
  return (
    <aside 
      className={`bg-white h-screen fixed left-0 top-0 border-r border-accent/20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 z-40 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand & Collapse Button */}
      <div className="flex items-center justify-between p-4 border-b border-accent/10">
        {!isCollapsed && (
          <div className="flex items-center space-x-2 overflow-hidden">
            <SparklesIcon className="w-8 h-8 text-primary shrink-0" />
            <h1 className="text-xl font-black text-dark tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary truncate">
              MediConnect
            </h1>
          </div>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center">
            <SparklesIcon className="w-8 h-8 text-primary" />
          </div>
        )}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 rounded-lg hover:bg-accent/10 text-secondary transition-colors ${isCollapsed ? 'hidden' : 'block'}`}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
      </div>

      {isCollapsed && (
         <button 
         onClick={() => setIsCollapsed(!isCollapsed)}
         className="absolute -right-3 top-6 p-1 bg-white border border-accent/20 shadow-sm rounded-full text-secondary hover:text-primary transition-colors"
       >
         <ChevronRightIcon className="w-3 h-3" />
       </button>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 no-scrollbar">
        <ul className="space-y-1 px-3">
          {MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary font-bold shadow-[inset_2px_0_0_var(--color-primary)]'
                      : 'text-secondary/70 hover:bg-accent/10 hover:text-dark'
                  } ${isCollapsed ? 'justify-center' : 'justify-start space-x-3'}`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary' : 'text-secondary/50 group-hover:text-primary/70'}`} />
                  {!isCollapsed && (
                    <span className="truncate text-[13px]">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User Mini Profile / Footer */}
      <div className="p-4 border-t border-accent/10 flex items-center justify-center">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 w-full">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm shrink-0">
              DR
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-dark truncate">Dr. Smith</p>
              <p className="text-[10px] text-secondary/60 truncate">Cardiology</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-sm cursor-pointer" title="Dr. Smith - Cardiology">
            DR
          </div>
        )}
      </div>
    </aside>
  );
}
