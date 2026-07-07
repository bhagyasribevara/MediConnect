import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';

// ==========================================
// 12 Navigation Sidebar Icons (Inline SVGs)
// ==========================================

const OverviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
);

const HospitalsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12h-15" />
  </svg>
);

const FacilitiesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-6 2.182m0 0L5.25 9m7.5-3.818V21" />
  </svg>
);

const TransferIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
  </svg>
);

const OutbreakIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const SurveillanceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.125a3.375 3.375 0 01-3.375 3.375H7.75a3.375 3.375 0 01-3.375-3.375L3.75 7.5m16.5 0h-16.5m16.5 0V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v1.5M12 12v3.75" />
  </svg>
);

const MedicineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StaffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m0 0a8.967 8.967 0 01-2.299-2.299m0 0A3.078 3.078 0 014.28 15a3 3 0 014.502.502m.94 3.197L9.75 19.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4.5 4.5 0 100-9 4.5 4.5 0 000 9z" />
  </svg>
);

const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
);

const WorkflowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.99l1.005.831a1.125 1.125 0 01.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.37.491l-1.216-.456c-.356-.133-.751-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.831a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const districtTabs = [
  { id: 'overview', label: 'Dashboard Overview', icon: <OverviewIcon /> },
  { id: 'hospitals', label: 'Hospitals & Clinics', icon: <HospitalsIcon /> },
  { id: 'facilities', label: 'Registered Facilities', icon: <FacilitiesIcon /> },
  { id: 'redistribution', label: 'Resource Redistribution', icon: <TransferIcon /> },
  { id: 'outbreaks', label: 'Outbreak Monitoring', icon: <OutbreakIcon /> },
  { id: 'surveillance', label: 'Disease Surveillance', icon: <SurveillanceIcon /> },
  { id: 'beds', label: 'Bed Management', icon: <BedIcon /> },
  { id: 'medicine', label: 'Medicine Monitoring', icon: <MedicineIcon /> },
  { id: 'staff', label: 'Staff & Workforce', icon: <StaffIcon /> },
  { id: 'alerts', label: 'Alerts & Notifications', icon: <AlertIcon /> },
  { id: 'workflows', label: 'Workflow Approvals', icon: <WorkflowIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

// Sparkline SVG renderer
const Sparkline = ({ data, color }: { data: number[], color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((val, idx) => `${(idx / (data.length - 1)) * 80},${25 - ((val - min) / range) * 20}`)
    .join(' ');
  return (
    <svg className="w-20 h-7" viewBox="0 0 80 25">
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};

export default function DistrictAdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState('09:42 AM');
  const [currentDate, setCurrentDate] = useState('May 24, 2025');

  // Format real-time clock mapping
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      setCurrentDate(d.toLocaleDateString('en-US', options));
      setCurrentTime(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Resource suggestions (mandal localized)
  const [redistributions, setRedistributions] = useState<any[]>([]);

  // Registered facilities roster
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [facilityForm, setFacilityForm] = useState({ name: '', type: 'Hospital', beds: 10, compliance: 95 });
  const [facilitiesList, setFacilitiesList] = useState<any[]>([]);

  // Real-time alerts list
  const [criticalAlerts] = useState<any[]>([]);

  // Map Hover Interactive State
  const [hoveredRegion, setHoveredRegion] = useState<{ name: string; cases: number; risk: string } | null>(null);

  // Sync real-time socket events
  useEffect(() => {
    const socket = io('http://127.0.0.1:5000', { transports: ['polling'] });
    socket.on('new_inventory_request', (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      setRedistributions(prev => [
        { id: Date.now(), item: data.medicine, qty: data.quantity, from: 'District Central Stock', to: data.hospital, status: 'Pending Approval', reason: 'Emergency requisition' },
        ...prev
      ]);
    });
    return () => { socket.disconnect(); };
  }, [queryClient]);

  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['districtAdminMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/districtadmin');
      return res.data.metrics;
    }
  });

  const handleRegisterFacility = (e: React.FormEvent) => {
    e.preventDefault();
    setFacilitiesList(prev => [
      ...prev,
      { id: Date.now(), name: facilityForm.name, type: facilityForm.type, beds: facilityForm.beds, compliance: facilityForm.compliance, load: 'Low' }
    ]);
    setIsFacilityModalOpen(false);
    setFacilityForm({ name: '', type: 'Hospital', beds: 10, compliance: 95 });
  };

  const handleApproveRedistribute = (id: number) => {
    setRedistributions(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved' } : r));
    alert("Resource redistribution workflow approved. Dispatched to hospital stocks.");
  };

  const handleRejectRedistribute = (id: number) => {
    setRedistributions(prev => prev.filter(r => r.id !== id));
    alert("Resource redistribution suggestion rejected.");
  };

  return (
    <DashboardLayout 
      title="District Healthcare Administration" 
      role="DistrictAdmin" 
      tabs={districtTabs} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="space-y-6">

        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD OVERVIEW                                */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Header Title Greeting Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-dark tracking-tight flex items-center gap-2">
                  Good Morning, {metrics?.district_name ? `${metrics.district_name} Admin` : 'District Administrator'} <span className="animate-bounce">👋</span>
                </h1>
                <p className="text-xs text-secondary/70 font-semibold mt-1">Here's the comprehensive overview of {metrics?.district_name || 'your district'}'s healthcare system.</p>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-xl shadow-clay border border-accent/30 text-xs font-bold text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-secondary">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                <span>{currentDate}</span>
                <span className="text-secondary/40 font-normal">|</span>
                <span>{currentTime}</span>
              </div>
            </div>

            {/* Top Metric Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Hospitals & Clinics</h3>
                  <p className="text-2xl font-extrabold text-dark mt-1">{isMetricsLoading ? '...' : metrics?.total_hospitals || 24}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[9px] text-secondary/60 font-semibold">Active units</span>
                  <Sparkline data={[12, 15, 18, 20, 22, 24]} color="#00BFA6" />
                </div>
              </div>
              
              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Total Beds</h3>
                  <p className="text-2xl font-extrabold text-dark mt-1">{isMetricsLoading ? '...' : metrics?.total_district_beds || 540}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[9px] text-secondary/60 font-semibold">Registered</span>
                  <Sparkline data={[500, 510, 525, 530, 535, 540]} color="#00BFA6" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Available Beds</h3>
                  <p className="text-2xl font-extrabold text-secondary mt-1">{isMetricsLoading ? '...' : metrics?.available_beds || 86}</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[9px] text-secondary font-bold">16% availability</span>
                  <Sparkline data={[90, 88, 85, 89, 87, 86]} color="#00BFA6" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Active Staff</h3>
                  <p className="text-2xl font-extrabold text-dark mt-1">1,248</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[9px] text-secondary/60 font-semibold">Across district</span>
                  <Sparkline data={[1200, 1220, 1235, 1240, 1245, 1248]} color="#00BFA6" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div>
                  <h3 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Today's OPD</h3>
                  <p className="text-2xl font-extrabold text-dark mt-1">2,156</p>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[9px] text-green-600 font-bold">+12% vs yesterday</span>
                  <Sparkline data={[1800, 1950, 2050, 1900, 2100, 2156]} color="#4CD964" />
                </div>
              </div>

              {/* AI Forecast highlight card */}
              <div className="p-4 bg-[#00BFA6]/10 text-secondary rounded-2xl shadow-clay border border-[#00BFA6]/20 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <span className="animate-ping w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#00a892]">AI Outbreak Forecast</h3>
                  </div>
                  <p className="text-sm font-extrabold mt-1.5 text-dark">High Risk - Dengue</p>
                  <p className="text-[9px] opacity-80 leading-normal mt-1 font-medium">Surge alert expected in Vizianagaram HQ.</p>
                </div>
                <button 
                  onClick={() => setActiveTab('outbreaks')}
                  className="w-full mt-2 py-1 bg-secondary text-white text-[9px] font-bold rounded-lg hover:bg-[#00a892] transition-colors shadow-sm"
                >
                  View Details →
                </button>
              </div>
            </div>

            {/* Middle Graphs, Heatmap, and Alerts row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Outbreak Area Chart */}
              <div className="p-5 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-5 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase text-dark tracking-wider">Outbreak Case Incidence Rate</h3>
                  <select className="text-[10px] bg-accent/20 border-none outline-none font-bold text-secondary rounded-lg px-2 py-1 shadow-inner cursor-pointer">
                    <option>Last 6 Months</option>
                    <option>Last 30 Days</option>
                  </select>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[]} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00BFA6" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#00BFA6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBF8F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#00BFA6', fontSize: 10, fontWeight: 'bold'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#00BFA6', fontSize: 10, fontWeight: 'bold'}} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="cases" stroke="#00BFA6" strokeWidth={3.5} fillOpacity={1} fill="url(#colorCases)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Center Column: Vizianagaram District SVG Map */}
              <div className="p-5 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-4 flex flex-col justify-between relative">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase text-dark tracking-wider">Disease Heatmap (Live)</h3>
                  <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[9px] font-bold rounded-lg">Vizianagaram</span>
                </div>
                
                {/* SVG Map Layout */}
                <div className="w-full flex items-center justify-center py-2 relative">
                  <svg className="w-60 h-60 drop-shadow-md" viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">
                    {/* Etcherla Region */}
                    <path
                      d="M208.1,105.1L208.1,106.7L206.8,107.0L205.6,110.2L199.7,111.7L196.4,110.5L196.6,109.5L195.9,109.8L196.1,112.5L192.6,113.5L192.2,115.6L192.8,116.9L195.8,117.4L196.3,119.0L198.4,118.5L200.3,119.9L199.7,123.3L201.0,125.5L208.5,125.5L210.0,127.7L209.6,130.0L211.3,129.4L210.9,131.8L217.0,131.5L216.7,128.0L219.5,124.7L220.1,121.4L227.6,123.4L229.7,122.4L232.2,122.8L232.0,120.3L235.2,115.8L239.7,117.6L238.4,121.8L236.5,121.1L235.0,123.1L236.9,124.3L237.6,127.1L239.1,126.5L239.6,127.1L240.0,129.8L241.5,131.9L248.6,137.8L250.5,144.0L254.6,148.4L240.8,152.7L233.1,158.5L218.5,163.8L203.8,170.6L180.6,184.2L180.8,182.6L177.9,180.7L175.5,177.3L174.5,176.6L172.9,177.2L168.9,174.3L169.8,170.1L166.1,166.9L164.3,163.1L164.3,161.1L167.2,160.2L167.5,157.5L166.4,153.9L164.7,153.5L164.8,151.7L164.4,149.4L167.8,149.5L170.1,147.0L172.1,147.0L174.8,148.9L176.8,148.7L178.3,145.1L180.5,143.3L180.7,132.9L183.2,129.6L191.1,126.8L189.2,123.4L187.5,124.0L185.1,121.8L183.1,121.8L181.8,120.4L169.3,119.1L169.8,116.0L166.7,117.4L163.6,117.2L166.2,114.4L163.4,113.7L159.5,110.1L160.9,107.5L163.5,106.6L162.6,105.6L163.3,103.5L164.5,102.8L172.4,104.6L176.9,102.1L180.3,102.4L187.0,101.2L190.9,102.0L191.8,97.6L190.2,95.8L190.5,92.5L189.1,91.8L189.2,88.3L193.2,86.5L192.7,88.2L193.6,88.7L195.1,89.2L196.2,87.9L196.6,88.5L196.3,90.6L194.3,91.2L195.1,91.8L198.0,90.9L198.0,92.9L200.6,95.6L200.6,96.7L204.9,99.5L205.3,100.8L206.6,100.9L206.2,102.0L208.3,103.9L208.1,105.1Z"
                      fill="#00BFA6"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-200 cursor-pointer hover:fill-[#00BFA6]/80"
                      onMouseEnter={() => setHoveredRegion({ name: 'Etcherla', cases: 126, risk: 'Very Low Risk' })}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    {/* Rajam Region */}
                    <path
                      d="M208.4,53.8L210.6,55.1L212.8,60.7L216.1,58.6L217.5,59.4L217.3,61.5L215.3,63.7L213.8,69.8L215.2,72.9L217.2,73.7L222.0,78.4L219.6,87.0L219.8,89.8L224.7,92.0L226.1,94.4L223.1,97.4L223.1,98.7L224.9,100.5L224.8,102.3L218.3,99.6L216.3,101.2L216.0,103.2L217.7,104.4L216.6,106.7L210.4,104.2L208.1,105.1L208.3,103.9L206.2,102.0L206.6,100.9L205.3,100.8L204.9,99.5L200.6,96.7L200.6,95.6L198.0,92.9L198.0,90.9L195.1,91.8L194.3,91.2L196.3,90.6L196.6,88.5L196.2,87.9L195.1,89.2L193.6,88.7L192.7,88.2L193.2,86.5L189.2,88.3L189.1,91.8L190.5,92.5L190.2,95.8L191.8,97.6L190.9,102.0L187.0,101.2L180.3,102.4L176.9,102.1L172.4,104.6L164.5,102.8L164.5,99.7L162.7,96.0L159.3,95.1L157.6,96.1L156.9,93.9L158.5,91.0L161.4,91.3L162.5,90.6L161.9,87.3L159.4,85.9L161.0,82.8L165.9,82.4L166.6,84.0L167.8,83.0L162.7,77.5L162.6,74.5L158.2,73.7L158.6,70.9L161.7,68.7L169.9,69.7L171.1,68.5L171.7,64.8L171.4,61.9L172.6,59.2L171.5,55.7L169.3,55.0L163.0,55.5L156.7,53.8L153.9,54.8L152.5,56.9L152.4,61.2L149.6,61.3L147.3,60.8L146.7,58.3L143.9,58.0L143.9,57.1L147.7,53.4L148.2,50.2L150.3,50.5L155.6,47.2L155.0,46.2L150.3,46.0L150.9,40.5L149.7,37.8L151.9,36.1L150.2,32.2L153.1,26.7L151.2,22.8L149.5,22.1L148.0,21.7L146.7,16.4L147.1,15.1L149.2,15.0L150.9,16.9L154.1,17.8L156.0,19.4L156.9,22.5L156.1,23.9L157.0,25.3L158.9,25.7L160.7,28.4L164.7,29.3L164.8,32.0L167.1,32.2L169.0,34.2L169.4,37.2L171.4,38.3L172.7,40.3L173.0,43.5L176.5,47.6L181.3,50.0L186.3,49.6L190.5,52.8L195.7,52.6L196.2,55.6L197.9,55.1L201.8,49.4L205.1,49.8L204.9,52.9L208.4,53.8Z"
                      fill="#FF9500"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-200 cursor-pointer hover:fill-[#FF9500]/80"
                      onMouseEnter={() => setHoveredRegion({ name: 'Rajam', cases: 128, risk: 'Medium Risk' })}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    {/* Bobbili Region */}
                    <path
                      d="M91.7,29.1L96.3,33.8L95.3,41.2L98.1,43.8L102.2,45.0L104.2,41.8L111.7,43.6L112.5,42.1L112.1,40.1L113.9,39.0L114.7,41.6L116.1,41.1L116.3,42.3L117.5,42.3L117.3,43.7L118.6,43.6L118.8,40.8L120.7,38.4L123.2,37.7L126.8,38.6L128.0,40.4L130.3,40.2L133.5,42.8L135.4,45.8L135.1,49.2L133.6,52.0L129.7,50.7L129.5,54.1L131.9,55.5L136.1,55.8L136.8,59.9L141.3,61.5L141.5,66.8L142.2,65.5L144.6,64.8L145.2,63.1L147.6,64.5L149.6,61.3L152.4,61.2L156.6,64.1L160.0,63.1L171.7,64.8L171.1,68.5L169.9,69.7L161.7,68.7L158.6,70.9L158.2,73.7L162.6,74.5L162.7,77.5L167.8,83.0L166.6,84.0L165.9,82.4L161.0,82.8L159.4,85.9L161.9,87.3L162.5,90.6L161.4,91.3L158.5,91.0L156.9,93.9L156.5,93.3L153.3,94.4L152.8,92.5L150.4,90.9L150.3,88.4L149.1,88.6L147.5,87.2L145.2,86.5L144.2,88.9L141.5,88.7L139.2,86.6L136.9,86.4L137.2,85.1L133.7,83.5L134.3,79.6L129.7,80.2L122.6,78.8L120.2,79.7L121.4,79.6L124.1,81.9L125.2,84.3L121.6,85.1L119.3,83.0L119.9,85.5L117.7,86.1L119.0,86.8L117.3,87.5L112.8,93.4L110.0,90.0L112.4,86.3L110.2,85.1L109.9,81.1L108.3,82.5L103.3,82.7L99.0,85.0L96.1,84.0L95.0,81.9L92.2,81.0L90.4,83.2L92.3,86.3L91.0,89.9L87.9,90.5L85.2,93.8L80.3,93.7L79.2,93.2L79.3,92.0L77.4,91.9L74.5,90.1L72.1,92.5L67.5,94.3L64.5,93.2L59.8,95.1L57.3,93.6L58.4,87.9L57.3,87.2L61.8,87.9L65.0,84.7L65.9,86.5L67.4,85.9L68.2,83.4L69.2,82.4L70.8,82.8L70.5,81.3L73.8,79.2L73.0,77.6L71.1,77.2L67.8,80.9L67.2,78.2L65.3,75.7L64.1,75.0L62.7,77.1L61.6,75.1L62.7,71.1L64.7,69.3L65.6,66.5L69.2,63.6L70.1,61.1L76.2,60.1L76.9,58.1L75.8,56.9L70.4,55.8L70.7,54.0L73.0,52.4L72.0,50.6L73.1,49.2L69.2,48.1L72.2,45.9L78.1,37.9L80.4,37.6L81.1,39.6L86.1,36.5L87.9,33.8L89.0,29.5L91.7,29.1Z"
                      fill="#FF4D4D"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-200 cursor-pointer hover:fill-[#FF4D4D]/80"
                      onMouseEnter={() => setHoveredRegion({ name: 'Bobbili', cases: 133, risk: 'High Risk' })}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    {/* Cheepurupalle Region */}
                    <path
                      d="M156.9,93.9L157.6,96.1L159.3,95.1L162.7,96.0L164.5,99.7L164.5,102.8L163.3,103.5L162.6,105.6L163.5,106.6L160.9,107.5L159.5,110.1L163.4,113.7L166.2,114.4L163.6,117.2L166.7,117.4L169.8,116.0L169.3,119.1L181.8,120.4L183.1,121.8L185.1,121.8L187.5,124.0L189.2,123.4L191.1,126.8L183.2,129.6L180.7,132.9L180.5,143.3L178.3,145.1L176.8,148.7L174.8,148.9L172.1,147.0L170.1,147.0L167.8,149.5L164.4,149.4L164.8,151.7L158.2,152.3L156.8,149.4L152.2,149.1L150.8,145.7L150.1,146.9L148.4,147.3L148.3,149.8L145.7,149.1L144.1,157.1L146.4,158.7L146.8,162.6L145.0,163.0L143.6,159.6L136.8,156.9L132.9,155.8L127.2,156.8L125.9,156.3L124.9,150.3L122.8,148.9L122.4,151.7L119.4,149.6L112.7,149.5L115.5,148.1L117.1,146.0L115.4,144.0L112.5,144.3L112.1,136.9L115.4,136.8L116.0,130.0L117.8,130.4L119.2,127.0L118.4,124.3L119.3,121.0L116.8,117.3L117.2,115.9L118.5,115.9L118.5,113.0L118.0,111.7L116.1,111.5L115.9,109.3L117.3,105.4L115.0,104.1L115.4,103.1L120.4,101.9L120.0,97.9L119.0,97.8L119.6,96.4L116.8,97.5L115.9,96.2L114.4,96.0L112.8,93.4L117.3,87.5L119.0,86.8L117.7,86.1L119.9,85.5L119.3,83.0L121.6,85.1L125.2,84.3L124.1,81.9L121.4,79.6L120.2,79.7L122.6,78.8L129.7,80.2L134.3,79.6L133.7,83.5L137.2,85.1L136.9,86.4L139.2,86.6L141.5,88.7L144.2,88.9L145.2,86.5L147.5,87.2L149.1,88.6L150.3,88.4L150.4,90.9L152.8,92.5L153.3,94.4L156.5,93.3L156.9,93.9Z"
                      fill="#FF9500"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-200 cursor-pointer hover:fill-[#FF9500]/80"
                      onMouseEnter={() => setHoveredRegion({ name: 'Cheepurupalle', cases: 134, risk: 'Medium Risk' })}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    {/* Gajapathinagaram Region */}
                    <path
                      d="M112.8,93.4L114.4,96.0L115.9,96.2L116.8,97.5L119.6,96.4L119.0,97.8L120.0,97.9L120.4,101.9L115.4,103.1L115.0,104.1L117.3,105.4L115.9,109.3L116.1,111.5L118.0,111.7L118.5,113.0L118.5,115.9L117.2,115.9L116.8,117.3L119.3,121.0L118.4,124.3L119.2,127.0L117.8,130.4L116.0,130.0L115.4,136.8L112.1,136.9L108.7,135.8L107.1,140.6L107.4,142.1L110.6,144.6L111.3,148.4L108.8,149.8L108.0,154.8L110.5,154.9L110.5,157.4L107.9,159.5L108.2,160.8L107.0,165.1L101.9,165.2L101.0,164.6L101.9,158.3L98.1,158.4L95.8,168.3L97.9,170.2L103.1,171.9L101.4,174.2L101.7,176.6L99.7,175.9L96.8,178.6L92.4,177.5L89.7,180.4L89.8,186.3L87.8,186.2L88.3,191.9L91.1,190.9L92.6,193.0L89.0,195.7L88.2,198.3L85.1,196.7L86.8,199.1L85.5,200.0L86.9,200.9L87.0,203.7L81.5,203.2L82.1,206.3L77.9,203.5L76.2,203.7L76.1,202.7L73.8,202.4L72.9,201.0L70.4,200.7L69.0,196.0L65.6,195.8L65.4,191.0L66.3,190.7L64.8,186.9L65.3,181.7L67.0,177.5L70.3,174.9L68.6,174.8L68.7,173.4L64.7,171.7L64.5,169.2L59.1,168.5L57.9,166.0L56.6,168.5L54.5,167.7L53.3,168.8L51.3,168.7L47.7,164.7L49.0,163.8L49.2,161.8L52.5,162.4L54.8,159.4L53.9,157.4L48.7,156.5L48.8,154.6L46.7,154.4L47.1,151.0L45.4,147.9L48.9,146.9L50.1,145.0L52.5,150.7L54.4,152.6L60.7,154.7L63.1,153.6L63.0,152.6L60.7,151.2L62.5,148.9L61.5,145.0L63.5,146.4L63.7,149.9L67.4,150.9L67.6,145.5L69.5,143.6L74.4,147.4L72.8,141.0L74.2,133.5L67.1,129.3L67.8,127.1L69.1,127.9L71.7,126.3L73.3,122.0L75.0,122.4L75.4,120.4L76.8,120.4L75.4,115.4L79.0,115.4L81.0,113.6L82.5,114.5L86.9,113.6L88.8,114.6L90.1,113.1L90.2,111.5L87.3,110.9L87.6,109.7L85.6,107.9L86.4,104.0L85.5,101.9L87.7,99.0L87.9,90.5L91.0,89.9L92.3,86.3L90.4,83.2L92.2,81.0L95.0,81.9L96.1,84.0L99.0,85.0L103.3,82.7L108.3,82.5L109.9,81.1L110.2,85.1L112.4,86.3L110.0,90.0L112.8,93.4Z"
                      fill="#FF4D4D"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-200 cursor-pointer hover:fill-[#FF4D4D]/80"
                      onMouseEnter={() => setHoveredRegion({ name: 'Gajapathinagaram', cases: 135, risk: 'High Risk' })}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    {/* Nellimarla Region */}
                    <path
                      d="M112.1,136.9L112.5,144.3L115.4,144.0L117.1,146.0L115.5,148.1L112.7,149.5L119.4,149.6L122.4,151.7L122.8,148.9L124.9,150.3L125.9,156.3L127.2,156.8L132.9,155.8L136.8,156.9L143.6,159.6L145.0,163.0L146.8,162.6L146.4,158.7L144.1,157.1L145.7,149.1L148.3,149.8L148.4,147.3L150.1,146.9L150.8,145.7L152.2,149.1L156.8,149.4L158.2,152.3L164.8,151.7L164.7,153.5L166.4,153.9L167.5,157.5L167.2,160.2L164.3,161.1L164.3,163.1L166.1,166.9L169.8,170.1L168.9,174.3L172.9,177.2L174.5,176.6L175.5,177.3L177.9,180.7L180.8,182.6L180.6,184.2L155.2,202.2L152.5,206.0L153.1,208.2L152.3,209.9L148.0,215.4L143.5,219.1L135.6,219.9L132.3,215.3L127.7,213.8L123.8,215.8L123.6,219.6L120.0,219.7L121.9,221.0L123.1,224.6L121.9,225.0L118.8,222.0L116.5,221.1L112.0,214.2L113.5,212.7L113.5,209.0L117.9,205.5L118.0,203.1L116.8,201.7L111.0,201.1L110.0,199.3L110.1,193.5L112.9,193.6L112.6,187.8L114.0,185.5L116.5,185.4L116.8,184.0L119.0,183.5L120.8,181.7L121.1,179.5L122.1,179.6L120.0,175.6L121.9,172.8L118.7,170.3L121.6,168.3L122.9,169.1L123.4,168.0L123.1,166.9L120.8,166.7L118.9,162.4L115.3,162.3L111.0,160.2L108.2,160.8L107.9,159.5L110.5,157.4L110.5,154.9L108.0,154.8L108.8,149.8L111.3,148.4L110.6,144.6L107.4,142.1L107.1,140.6L108.7,135.8L112.1,136.9Z"
                      fill="#4CD964"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-200 cursor-pointer hover:fill-[#4CD964]/80"
                      onMouseEnter={() => setHoveredRegion({ name: 'Nellimarla', cases: 136, risk: 'Low Risk' })}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                    {/* Vizianagaram Region */}
                    <path
                      d="M108.2,160.8L111.0,160.2L115.3,162.3L118.9,162.4L120.8,166.7L123.1,166.9L123.4,168.0L122.9,169.1L121.6,168.3L118.7,170.3L121.9,172.8L120.0,175.6L122.1,179.6L121.1,179.5L120.8,181.7L119.0,183.5L116.8,184.0L116.5,185.4L114.0,185.5L112.6,187.8L112.9,193.6L110.1,193.5L109.7,192.3L102.3,190.5L97.6,187.5L94.8,188.8L95.1,190.6L92.6,193.0L91.1,190.9L88.3,191.9L87.8,186.2L89.8,186.3L89.7,180.4L92.4,177.5L96.8,178.6L99.7,175.9L101.7,176.6L101.4,174.2L103.1,171.9L97.9,170.2L95.8,168.3L98.1,158.4L101.9,158.3L101.0,164.6L101.9,165.2L107.0,165.1L108.2,160.8Z"
                      fill="#FF4D4D"
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-200 cursor-pointer hover:fill-[#FF4D4D]/80"
                      onMouseEnter={() => setHoveredRegion({ name: 'Vizianagaram', cases: 137, risk: 'High Risk' })}
                      onMouseLeave={() => setHoveredRegion(null)}
                    />
                  </svg>

                  {/* Map hover tooltip */}
                  {hoveredRegion && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark/95 text-white p-3 rounded-xl shadow-2xl border border-secondary text-left space-y-1 z-30 pointer-events-none w-44 backdrop-blur-sm">
                      <p className="font-extrabold text-xs text-white">{hoveredRegion.name}</p>
                      <p className="text-[10px] text-secondary-light font-semibold">Risk: <span className={`font-bold ${hoveredRegion.risk.includes('High') ? 'text-red-400' : hoveredRegion.risk.includes('Medium') ? 'text-orange-400' : 'text-green-400'}`}>{hoveredRegion.risk}</span></p>
                      <p className="text-[10px] text-white/80">Active Cases: <span className="font-bold text-white text-xs">{hoveredRegion.cases}</span></p>
                    </div>
                  )}
                </div>

                {/* Map Legend */}
                <div className="flex items-center justify-around text-[9px] font-bold text-secondary/80 border-t border-accent/20 pt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF4D4D]"></span><span>High Risk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF9500]"></span><span>Medium</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4CD964]"></span><span>Low Risk</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00BFA6]"></span><span>Very Low</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Critical Alerts Panel */}
              <div className="p-5 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-xs font-bold uppercase text-dark tracking-wider">Critical Alerts</h3>
                  <button 
                    onClick={() => setActiveTab('alerts')}
                    className="text-[10px] text-secondary font-bold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3.5 overflow-y-auto max-h-64 pr-1">
                  {criticalAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 border border-accent/20 rounded-xl bg-accent/15 flex gap-2.5 items-start">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        alert.type === 'high' ? 'bg-red-500' : alert.type === 'warning' ? 'bg-orange-500' : 'bg-secondary'
                      }`}></span>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-bold text-dark leading-tight">{alert.text}</p>
                        <span className="text-[9px] text-secondary/60 font-semibold">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Lower-Middle Action and Risk summary row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Resource redistribution list (left) */}
              <div className="p-5 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-6 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase text-dark tracking-wider">Resource Redistribution Suggestions (AI)</h3>
                  <button 
                    onClick={() => setActiveTab('redistribution')}
                    className="text-[10px] text-secondary font-bold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b border-accent/15 text-secondary/70 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2 px-1">Resource</th>
                        <th className="py-2 px-1">From Facility</th>
                        <th className="py-2 px-1">To Facility</th>
                        <th className="py-2 px-1 text-center">Qty</th>
                        <th className="py-2 px-1">Reason</th>
                        <th className="py-2 px-1 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] text-dark font-medium">
                      {redistributions.map((r) => (
                        <tr key={r.id} className="border-b border-accent/15 hover:bg-accent/10">
                          <td className="py-2 px-1 font-bold">{r.item}</td>
                          <td className="py-2 px-1 text-secondary/80 max-w-[120px] truncate" title={r.from}>{r.from}</td>
                          <td className="py-2 px-1 text-secondary/80 max-w-[120px] truncate" title={r.to}>{r.to}</td>
                          <td className="py-2 px-1 text-center font-bold">{r.qty}</td>
                          <td className="py-2 px-1 text-secondary/70 font-semibold">{r.reason}</td>
                          <td className="py-2 px-1 text-center">
                            {r.status === 'Pending Approval' ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button 
                                  onClick={() => handleApproveRedistribute(r.id)}
                                  className="px-2 py-0.5 bg-secondary text-white text-[9px] font-bold rounded hover:bg-[#00a892] transition-colors"
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectRedistribute(r.id)}
                                  className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-bold rounded hover:bg-red-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[9px]">Approved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bed occupancy progress list (center) */}
              <div className="p-5 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase text-dark tracking-wider">Bed Occupancy Summary</h3>
                  <button 
                    onClick={() => setActiveTab('beds')}
                    className="text-[10px] text-secondary font-bold hover:underline"
                  >
                    View Details
                  </button>
                </div>
                <div className="space-y-4">
                  {([] as any[]).map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-dark">
                        <span>{item.label}</span>
                        <span className="text-secondary">{item.val}%</span>
                      </div>
                      <div className="w-full h-2 bg-accent/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-secondary rounded-full transition-all duration-500" 
                          style={{ width: `${item.val}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top 5 High Risk mandals list (right) */}
              <div className="p-5 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-3 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase text-dark tracking-wider">Top 5 High Risk Areas</h3>
                  <button 
                    onClick={() => setActiveTab('outbreaks')}
                    className="text-[10px] text-secondary font-bold hover:underline"
                  >
                    View Map
                  </button>
                </div>
                <div className="space-y-3.5">
                  {([] as any[]).map((area) => (
                    <div key={area.id} className="flex items-center justify-between gap-2.5 text-[11px] font-bold text-dark">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-accent text-secondary font-black rounded-lg flex items-center justify-center text-[10px]">{area.id}</span>
                        <div className="flex flex-col">
                          <span>{area.name}</span>
                          <span className="text-[9px] text-secondary/60 font-semibold">{area.disease}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        area.risk === 'High' ? 'bg-red-100 text-red-700' : area.risk === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>{area.risk}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Bottom Footer Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              
              {/* Facility Status Overview */}
              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-extrabold uppercase text-dark tracking-wider">Facility Status Overview</h3>
                  <button onClick={() => setActiveTab('facilities')} className="text-[9px] text-secondary font-bold hover:underline">View All</button>
                </div>
                <div className="flex items-center gap-4 py-2">
                  {/* Radial/Donut simulator */}
                  <div className="relative w-16 h-16 rounded-full border-4 border-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-dark">24</span>
                    <span className="absolute inset-0 rounded-full border-4 border-secondary border-t-transparent border-l-transparent"></span>
                  </div>
                  <div className="space-y-1 text-[9px] font-bold text-secondary/80">
                    <p className="flex items-center gap-1.5 text-dark"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Operational: 18</p>
                    <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> Partially: 4</p>
                    <p className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Maintenance: 2</p>
                  </div>
                </div>
              </div>

              {/* Medicine Stock Status */}
              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-extrabold uppercase text-dark tracking-wider">Medicine Stock Status</h3>
                  <button onClick={() => setActiveTab('medicine')} className="text-[9px] text-secondary font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-2 text-[10px] font-bold">
                  <div className="flex justify-between items-center bg-red-50 text-red-700 px-2.5 py-1 rounded-lg">
                    <span>Low Stock</span><span className="font-extrabold">23</span>
                  </div>
                  <div className="flex justify-between items-center bg-green-50 text-green-700 px-2.5 py-1 rounded-lg">
                    <span>Adequate Stock</span><span className="font-extrabold">156</span>
                  </div>
                  <div className="flex justify-between items-center bg-accent/30 text-secondary px-2.5 py-1 rounded-lg">
                    <span>Overstock</span><span className="font-extrabold">12</span>
                  </div>
                  <div className="flex justify-between items-center bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-lg">
                    <span>Expiring Soon</span><span className="font-extrabold">18</span>
                  </div>
                </div>
              </div>

              {/* Recent Outbreak Reports */}
              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-extrabold uppercase text-dark tracking-wider">Recent Outbreak Reports</h3>
                  <button onClick={() => setActiveTab('outbreaks')} className="text-[9px] text-secondary font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-3 overflow-y-auto max-h-32 text-[10px]">
                  {([] as any[]).map(item => (
                    <div key={item.id} className="flex justify-between items-center border-b border-accent/15 pb-1">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-dark truncate max-w-[100px]">{item.text}</span>
                        <span className="text-[8px] text-secondary/60">{item.time}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                        item.risk === 'High' ? 'bg-red-100 text-red-700' : item.risk === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>{item.risk}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appointments & OPD log */}
              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-extrabold uppercase text-dark tracking-wider">Appointments & OPD</h3>
                  <button onClick={() => alert("Redirecting to Appointments...")} className="text-[9px] text-secondary font-bold hover:underline">View All</button>
                </div>
                <div className="space-y-2 text-[10px] font-bold text-dark flex items-center justify-center p-4">
                  <span className="text-secondary/70">No Data</span>
                </div>
              </div>

              {/* Quick Actions Grid */}
              <div className="p-4 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col justify-between">
                <h3 className="text-[10px] font-extrabold uppercase text-dark tracking-wider mb-3">Quick Actions</h3>
                <div className="grid grid-cols-3 gap-2.5">
                  <button 
                    onClick={() => setIsFacilityModalOpen(true)}
                    className="p-1.5 bg-accent/20 hover:bg-[#00BFA6]/10 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center text-secondary transition-all"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    <span className="text-[8px] font-bold leading-tight">Add Facility</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('redistribution')}
                    className="p-1.5 bg-accent/20 hover:bg-[#00BFA6]/10 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center text-secondary transition-all"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
                    <span className="text-[8px] font-bold leading-tight">Resource Transfer</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('outbreaks')}
                    className="p-1.5 bg-accent/20 hover:bg-[#00BFA6]/10 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center text-secondary transition-all"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="text-[8px] font-bold leading-tight">Outbreak Report</span>
                  </button>

                  <button 
                    onClick={() => alert("Generating District Reports...")}
                    className="p-1.5 bg-accent/20 hover:bg-[#00BFA6]/10 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center text-secondary transition-all"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H9.75m0 18.75h-2.12c-.732 0-1.4-.417-1.724-1.074L3 15.031m0 0l2.25 2.25M3 15.031l2.25-2.25" /></svg>
                    <span className="text-[8px] font-bold leading-tight">View Reports</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('workflows')}
                    className="p-1.5 bg-accent/20 hover:bg-[#00BFA6]/10 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center text-secondary transition-all"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[8px] font-bold leading-tight">Approve Requests</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('alerts')}
                    className="p-1.5 bg-accent/20 hover:bg-[#00BFA6]/10 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center text-secondary transition-all"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
                    <span className="text-[8px] font-bold leading-tight">Send Alert</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: HOSPITALS & CLINICS                              */}
        {/* ======================================================== */}
        {activeTab === 'hospitals' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="text-base font-extrabold text-dark">Vizianagaram District Hospitals & Clinics</h3>
                <p className="text-[11px] text-secondary/60 mt-1">Surveillance registry for hospital facilities, primary health clinics, and community centers.</p>
              </div>
              <button 
                onClick={() => setIsFacilityModalOpen(true)}
                className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow hover:bg-[#00a892] transition-all"
              >
                + Add Clinic/Hospital
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(metrics?.hospitals_list || []).map((h: any) => (
                <div key={h.id} className="p-5 border border-accent/25 rounded-2xl bg-accent/15 flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <span className="px-2 py-0.5 bg-secondary/15 text-secondary text-[9px] font-bold rounded">{h.type}</span>
                    <h4 className="font-extrabold text-sm text-dark leading-snug">{h.name}</h4>
                    <p className="text-xs text-secondary/70">Beds capacity: <span className="font-bold text-dark">{h.total_beds} total</span></p>
                  </div>
                  <div className="flex items-center justify-between border-t border-accent/20 pt-4 mt-4 text-xs">
                    <span className="font-bold text-secondary">Available: {h.available_beds}</span>
                    <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                      h.available_beds < 10 ? 'bg-red-150 text-red-700' : 'bg-green-150 text-green-700'
                    }`}>Load: {h.available_beds < 10 ? 'High' : 'Low'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: REGISTERED FACILITIES                             */}
        {/* ======================================================== */}
        {activeTab === 'facilities' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-extrabold text-dark">Healthcare Facilities Roster</h3>
                <p className="text-[11px] text-secondary/60 mt-1">Audit registry tracking patient capacity limits and operational criteria.</p>
              </div>
              <button 
                onClick={() => setIsFacilityModalOpen(true)}
                className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow hover:bg-[#00a892] transition-colors"
              >
                + Register Facility
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-secondary/70 text-xs font-bold">
                    <th className="py-2.5 px-4">Facility Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Beds Roster</th>
                    <th className="py-2.5 px-4">Compliance Rating</th>
                    <th className="py-2.5 px-4">Load Level</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  {(metrics?.hospitals_list || []).map((f: any) => (
                    <tr key={f.id} className="border-b border-accent/15 hover:bg-accent/10">
                      <td className="py-2.5 px-4 font-bold text-dark">{f.name}</td>
                      <td className="py-2.5 px-4 text-secondary/70 font-semibold">{f.type}</td>
                      <td className="py-2.5 px-4 font-bold">{f.total_beds} beds</td>
                      <td className="py-2.5 px-4 font-bold text-secondary">Avail: {f.available_beds}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                          f.available_beds < 10 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>{f.available_beds < 10 ? 'High' : 'Low'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: RESOURCE REDISTRIBUTION                           */}
        {/* ======================================================== */}
        {activeTab === 'redistribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: AI Suggestions */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-dark">AI Redistribution Orders</h3>
                <p className="text-[11px] text-secondary/60 mt-1">Intelligent cross-mandal dispatch orders generated automatically from consumption prediction metrics.</p>
              </div>
              <div className="space-y-4">
                {redistributions.map((r) => (
                  <div key={r.id} className="p-4 border border-accent/25 rounded-2xl flex items-center justify-between gap-4 text-xs hover:shadow-sm transition-all bg-accent/10">
                    <div className="space-y-1">
                      <span className="text-[9px] text-[#00a892] font-black uppercase tracking-wider">TRANSFER INSTRUCTION</span>
                      <p className="text-dark font-extrabold text-sm">{r.qty}x {r.item}</p>
                      <p className="text-[10px] text-secondary/70">From: <span className="font-bold text-dark">{r.from}</span> • To: <span className="font-bold text-dark">{r.to}</span></p>
                      <p className="text-[9px] text-[#00BFA6] font-bold">Reason: {r.reason}</p>
                    </div>
                    <div>
                      {r.status === 'Pending Approval' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveRedistribute(r.id)}
                            className="px-3.5 py-2 bg-secondary text-white font-bold rounded-xl shadow-sm hover:bg-[#00a892] transition-colors"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleRejectRedistribute(r.id)}
                            className="px-3.5 py-2 bg-red-100 text-red-700 font-bold rounded-xl hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-xl font-black uppercase text-[10px]">Dispatched</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Historical logs */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold text-dark">Dispatched Roster History</h3>
              <div className="space-y-3.5">
                {[
                  { id: 1, item: 'Oxygen Cylinders', qty: 50, to: 'Vizianagaram GGH', time: 'Yesterday' },
                  { id: 2, item: 'ORS Sachets', qty: 2000, to: 'Bobbili CHC', time: '2 days ago' },
                  { id: 3, item: 'Paracetamol 500mg', qty: 1000, to: 'Salur Hospital', time: '4 days ago' }
                ].map(hist => (
                  <div key={hist.id} className="p-3.5 border border-accent/15 rounded-xl bg-accent/5 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-dark">{hist.qty}x {hist.item}</p>
                      <p className="text-[9px] text-secondary/60">Sent to {hist.to}</p>
                    </div>
                    <span className="text-[9px] font-bold text-secondary">{hist.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: OUTBREAK MONITORING                               */}
        {/* ======================================================== */}
        {activeTab === 'outbreaks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-2 space-y-4">
              <h3 className="text-base font-extrabold text-dark">Active Outbreak Alarms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { region: 'Vizianagaram Mandal (HQ)', disease: 'Dengue Surge', risk: 'High', details: 'Dengue cases have increased by 20% compared to previous weeks.' },
                  { region: 'Bobbili Mandal', disease: 'Dengue Risk', risk: 'High', details: 'Positive vector indices report high density of breeding pools.' },
                  { region: 'Salur Mandal', disease: 'Malaria Uprising', risk: 'Medium', details: 'Cases rising slightly near borders due to excessive stagnant water.' },
                  { region: 'Gajapathinagaram Mandal', disease: 'Typhoid Risk', risk: 'Medium', details: 'Minor case increase reported; water sanitation test triggered.' }
                ].map((out, idx) => (
                  <div key={idx} className="p-4 border border-accent/20 rounded-2xl bg-accent/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-dark">{out.disease}</span>
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        out.risk === 'High' ? 'bg-red-150 text-red-750' : 'bg-orange-150 text-orange-755'
                      }`}>{out.risk}</span>
                    </div>
                    <p className="text-[10px] text-secondary font-bold">{out.region}</p>
                    <p className="text-[10px] text-secondary/70 leading-relaxed font-semibold">{out.details}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold text-dark">Dispatched Medical Response Teams</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 border border-accent/20 rounded-xl bg-accent/10 space-y-1">
                  <p className="font-bold text-dark">Team A (Epidemiology)</p>
                  <p className="text-[10px] text-secondary">Assigned to: Vizianagaram HQ</p>
                  <p className="text-[9px] text-[#00BFA6] font-bold">Status: Inspecting water logs</p>
                </div>
                <div className="p-3 border border-accent/20 rounded-xl bg-accent/10 space-y-1">
                  <p className="font-bold text-dark">Team B (Vector Spraying)</p>
                  <p className="text-[10px] text-secondary">Assigned to: Bobbili Mandal</p>
                  <p className="text-[9px] text-[#00BFA6] font-bold">Status: Active fogging logs</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 6: DISEASE SURVEILLANCE                             */}
        {/* ======================================================== */}
        {activeTab === 'surveillance' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-dark">Disease Surveillance System</h3>
              <p className="text-[11px] text-secondary/60 mt-1">Continuous monitoring of infectious diseases across all mandals of Vizianagaram.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Dengue cases', active: 114, rate: '+15% this week', color: '#FF4D4D' },
                { name: 'Malaria cases', active: 59, rate: 'Stable rate', color: '#FF9500' },
                { name: 'Chikungunya cases', active: 25, rate: '-8% reduction', color: '#4CD964' }
              ].map((dis, idx) => (
                <div key={idx} className="p-5 border border-accent/20 rounded-2xl bg-accent/10 space-y-2">
                  <h4 className="font-bold text-secondary text-[11px] uppercase tracking-wider">{dis.name}</h4>
                  <p className="text-3xl font-black text-dark">{dis.active}</p>
                  <span className="text-[10px] font-bold text-secondary/60">Trend: {dis.rate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 7: BED MANAGEMENT                                    */}
        {/* ======================================================== */}
        {activeTab === 'beds' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-dark">District Bed Management Portal</h3>
              <p className="text-[11px] text-secondary/60 mt-1">Real-time status of ICU, general wards, pediatric, and emergency beds.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-secondary/70 text-xs font-bold">
                    <th className="py-2.5 px-4">Hospital Name</th>
                    <th className="py-2.5 px-4 text-center">General Beds</th>
                    <th className="py-2.5 px-4 text-center">ICU Beds</th>
                    <th className="py-2.5 px-4 text-center">Pediatric Beds</th>
                    <th className="py-2.5 px-4 text-center">Available Capacity</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark font-medium">
                  {facilitiesList.map((f, idx) => (
                    <tr key={idx} className="border-b border-accent/15 hover:bg-accent/10">
                      <td className="py-2.5 px-4 font-bold">{f.name}</td>
                      <td className="py-2.5 px-4 text-center">{Math.floor(f.beds * 0.7)}</td>
                      <td className="py-2.5 px-4 text-center">{Math.floor(f.beds * 0.15)}</td>
                      <td className="py-2.5 px-4 text-center">{Math.floor(f.beds * 0.15)}</td>
                      <td className="py-2.5 px-4 text-center font-bold text-secondary">{Math.floor(f.beds * 0.16)} available</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 8: MEDICINE MONITORING                               */}
        {/* ======================================================== */}
        {activeTab === 'medicine' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-dark">Medicine Inventory Monitoring</h3>
              <p className="text-[11px] text-secondary/60 mt-1">Tracking stock counts, expiring dates, and critical shortages across mandal stores.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 border border-accent/20 rounded-2xl bg-accent/10 space-y-4">
                <h4 className="font-extrabold text-sm text-dark">Stock Warning Lists</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-red-100/50 p-2.5 rounded-xl text-red-700">
                    <span className="font-bold">ORS Sachets (Nellimarla PHC)</span><span>23 left (Critical)</span>
                  </div>
                  <div className="flex justify-between items-center bg-yellow-100/50 p-2.5 rounded-xl text-yellow-700">
                    <span className="font-bold">Paracetamol 500mg (Cheepurupalli CHC)</span><span>150 left (Low Stock)</span>
                  </div>
                </div>
              </div>

              <div className="p-5 border border-accent/20 rounded-2xl bg-accent/10 space-y-4">
                <h4 className="font-extrabold text-sm text-dark">Emergency Vaccine Status</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-green-100/50 p-2.5 rounded-xl text-green-700">
                    <span className="font-bold">Rabies Vaccine (Vizianagaram GGH)</span><span>450 doses</span>
                  </div>
                  <div className="flex justify-between items-center bg-green-100/50 p-2.5 rounded-xl text-green-700">
                    <span className="font-bold">Dengue Kits (Bobbili CHC)</span><span>1,200 kits</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 9: STAFF & WORKFORCE                                 */}
        {/* ======================================================== */}
        {activeTab === 'staff' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-dark">Staff & Workforce Allocations</h3>
              <p className="text-[11px] text-secondary/60 mt-1">Registry of doctors, nurses, and allied workers currently deployed.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-dark font-medium">
              <div className="p-5 border border-accent/20 rounded-2xl bg-accent/10 space-y-3">
                <h4 className="font-extrabold text-sm text-dark">Doctor Rosters (General Surgeons & Physicians)</h4>
                <p>• Vizianagaram GGH: 48 active doctors</p>
                <p>• Bobbili CHC: 12 active doctors</p>
                <p>• Salur Hospital: 14 active doctors</p>
              </div>
              <div className="p-5 border border-accent/20 rounded-2xl bg-accent/10 space-y-3">
                <h4 className="font-extrabold text-sm text-dark">Nurse & Nursing Staff</h4>
                <p>• Vizianagaram GGH: 210 nursing staff</p>
                <p>• Bobbili CHC: 45 nursing staff</p>
                <p>• Salur Hospital: 55 nursing staff</p>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 10: ALERTS & NOTIFICATIONS                           */}
        {/* ======================================================== */}
        {activeTab === 'alerts' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-dark">Alerts Broadcast Console</h3>
              <p className="text-[11px] text-secondary/60 mt-1">Dispatch localized alerts, guidelines, or notifications to all mandal healthcare nodes.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); alert('Broadcast sent to all district endpoints!'); }} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Alert Message Header</label>
                <input type="text" placeholder="e.g. Urgent Dengue vector control fogging guidelines" className="w-full text-xs px-3.5 py-2.5 border border-accent/30 rounded-xl outline-none bg-accent/10" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">Message Description</label>
                <textarea rows={4} placeholder="Type the detailed warnings or actions to execute..." className="w-full text-xs px-3.5 py-2.5 border border-accent/30 rounded-xl outline-none bg-accent/10" required></textarea>
              </div>
              <button type="submit" className="px-5 py-2.5 bg-secondary text-white text-xs font-bold rounded-xl shadow hover:bg-[#00a892]">Broadcast Alert</button>
            </form>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 11: WORKFLOW APPROVALS                               */}
        {/* ======================================================== */}
        {activeTab === 'workflows' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-dark">Workflow Approvals Log</h3>
              <p className="text-[11px] text-secondary/60 mt-1">Audit log of system approvals, resource distributions, and settings changes.</p>
            </div>
            <div className="space-y-3.5">
              {[
                { id: 1, action: 'Resource Redistribution approved for ORS Sachets', target: 'Nellimarla PHC', user: 'DistrictAdmin' },
                { id: 2, action: 'Facility registered: Vizianagaram GGH', target: 'Vizianagaram Mandal', user: 'SuperAdmin' }
              ].map(w => (
                <div key={w.id} className="p-3.5 border border-accent/20 rounded-xl bg-accent/5 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-dark">{w.action}</p>
                    <p className="text-[9px] text-secondary/60">Target: {w.target}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-secondary/15 text-secondary rounded font-bold text-[9px]">{w.user}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 12: SETTINGS                                         */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-dark">District Configuration Settings</h3>
              <p className="text-[11px] text-secondary/60 mt-1">Adjust notification thresholds, auto-triggering AI limits, and general admin variables.</p>
            </div>
            <div className="space-y-4 text-xs font-bold text-secondary">
              <div className="flex justify-between items-center border-b border-accent/15 pb-3">
                <div>
                  <p className="text-dark">Auto-Redistribution Suggestions</p>
                  <p className="text-[10px] text-secondary/60 font-medium">Allow AI to formulate and recommend medicine transfers automatically.</p>
                </div>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-secondary accent-secondary" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-dark">Outbreak Alert Threshold</p>
                  <p className="text-[10px] text-secondary/60 font-medium">Percent increase in weekly case counts that triggers emergency status.</p>
                </div>
                <select className="px-2.5 py-1.5 border border-accent/30 bg-accent/10 rounded-xl text-dark outline-none cursor-pointer">
                  <option>10% Increase</option>
                  <option>20% Increase</option>
                  <option>30% Increase</option>
                </select>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: Register Facility */}
      {isFacilityModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-accent/30 shadow-2xl">
            <h3 className="text-base font-extrabold text-dark mb-4">Register Roster Facility</h3>
            <form onSubmit={handleRegisterFacility} className="space-y-4 text-xs">
              <div>
                <label className="block text-secondary/60 font-bold mb-1">Facility Name</label>
                <input 
                  type="text"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({...facilityForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-secondary/60 font-bold mb-1">Category Type</label>
                  <select 
                    value={facilityForm.type}
                    onChange={(e) => setFacilityForm({...facilityForm, type: e.target.value})}
                    className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                  >
                    <option>Hospital</option>
                    <option>PHC</option>
                    <option>CHC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-secondary/60 font-bold mb-1">Total Beds</label>
                  <input 
                    type="number"
                    value={facilityForm.beds}
                    onChange={(e) => setFacilityForm({...facilityForm, beds: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                    required 
                  />
                </div>
              </div>
              <div className="flex gap-2.5 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsFacilityModalOpen(false)}
                  className="px-4 py-2 border border-accent/40 rounded-xl font-bold text-secondary hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-secondary text-white rounded-xl font-bold shadow hover:bg-[#00a892]"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
