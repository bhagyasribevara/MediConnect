import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import api from '../../services/api';
import { 
   
  predictBedOccupancy, 
  getLowStock, 
  
  
} from '../../services/ai_api';
import './hospital-admin.css'; // Premium Claymorphism UI

// --- ICONS (Inline SVGs for performance & stability) ---
const IconOverview = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>;
const IconDoctor = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
const IconStaff = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>;
const IconCalendar = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>;
const IconBed = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>;
const IconPharmacy = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>;
const IconLab = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v1.244c0 .594-.236 1.164-.656 1.584L4.72 10.306a4.5 4.5 0 00-.77 5.2l.27.464a4.5 4.5 0 005.15 1.954m6.88-14.82v1.244c0 .594.236 1.164.656 1.584l4.374 4.374a4.5 4.5 0 01.77 5.2l-.27.464a4.5 4.5 0 01-5.15 1.954M12 21H3.75m0 0V3.75m0 17.25h16.5M12 3.75h3.75" /></svg>;
const IconBlood = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a5.006 5.006 0 005-5c0-1.8-1.5-3.8-5-7.5-3.5 3.7-5 5.7-5 7.5a5.006 5.006 0 005 5z" /></svg>;
const IconEmergency = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const IconAnalytics = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="ha-nav-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
const IconCopilot = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>;

export default function HospitalAdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Modal States
  const [isAddDoctorModalOpen, setIsAddDoctorModalOpen] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ username: '', email: '', password: '', department: '', hospital_id: 1 });

  
  
  

  // Bed Grid array
  // Doctor stats for appointments
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const { data: doctorStats = [], isLoading: statsLoading } = useQuery({
    queryKey: ['hospitalStats', dateStr],
    queryFn: async () => {
      const res = await api.get(`/appointment/hospital/stats?hospital_id=1&date=${dateStr}`);
      return res.data;
    }
  });

  // Blood bank reserves
  const [bloodStock] = useState<Array<{ type: string; qty: number }>>([
    { type: 'A+', qty: 12 },
    { type: 'B+', qty: 15 },
    { type: 'O+', qty: 6 },
    { type: 'O-', qty: 3 }
  ]);

  // Sync real-time socket events
  useEffect(() => {
    const socket = io('http://127.0.0.1:5000');
    socket.on('slot_updated', () => queryClient.invalidateQueries({ queryKey: ['hospitalStats'] }));
    socket.on('queue_updated', () => queryClient.invalidateQueries({ queryKey: ['hospitalStats'] }));

    return () => { socket.disconnect(); };
  }, [queryClient]);
  // Fetch Data
  const { data: dashboardData } = useQuery({
    queryKey: ['hospitaladmin_dashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/hospitaladmin');
      return res.data;
    }
  });

  const { data: doctorsList } = useQuery({
    queryKey: ['admin_doctors'],
    queryFn: async () => {
      const res = await api.get('/admin/doctors');
      return res.data;
    }
  });

  // Fetch Data for New Modules
  const { data: staffAttendance } = useQuery({ queryKey: ['ha_staff_attendance'], queryFn: async () => (await api.get('/dashboard/hospitaladmin/doctor-attendance')).data, enabled: activeTab === 'staff' });
  const { data: leaveRequests } = useQuery({ queryKey: ['ha_leave_requests'], queryFn: async () => (await api.get('/dashboard/hospitaladmin/leave-requests')).data, enabled: activeTab === 'staff' });
  const { data: appointmentsList } = useQuery({ queryKey: ['ha_appointments'], queryFn: async () => (await api.get('/dashboard/hospitaladmin/appointments')).data, enabled: activeTab === 'appointments' });
  const { data: bedsList } = useQuery({ queryKey: ['ha_beds'], queryFn: async () => (await api.get('/dashboard/hospitaladmin/beds')).data, enabled: activeTab === 'beds' });
  const { data: pharmacyStock } = useQuery({ queryKey: ['ha_pharmacy'], queryFn: async () => (await api.get('/inventory/medicines')).data, enabled: activeTab === 'pharmacy' });
  const { data: labReports } = useQuery({ queryKey: ['ha_lab'], queryFn: async () => (await api.get('/dashboard/hospitaladmin/lab')).data, enabled: activeTab === 'lab' });
  const { data: bloodBank } = useQuery({ queryKey: ['ha_blood'], queryFn: async () => (await api.get('/inventory/bloodbank')).data, enabled: activeTab === 'blood' });

  // ─── AI Predictive Data ───────────────────────────────────────
  const { data: aiBedForecast } = useQuery({
    queryKey: ['ai_bed_forecast'],
    queryFn: async () => (await predictBedOccupancy({ total_beds: 300, current_occupied: 245 })).data,
    enabled: activeTab === 'beds' || activeTab === 'ai_insights'
  });

  const { data: aiMedicineAlerts } = useQuery({
    queryKey: ['ai_medicine_alerts'],
    queryFn: async () => (await getLowStock()).data,
    enabled: activeTab === 'pharmacy' || activeTab === 'ai_insights'
  });

  // Mutations for New Modules
  const updateBedMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => api.put(`/dashboard/hospitaladmin/beds/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ha_beds'] })
  });
  
  const requestMedicineMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/requests', data),
    onSuccess: () => alert('Stock request sent to District Admin!')
  });
  
  const updateBloodMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory/bloodbank', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ha_blood'] })
  });

  // Mutations
  const addDoctorMutation = useMutation({
    mutationFn: (doctorData: any) => api.post('/admin/doctors', doctorData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_doctors'] });
      setIsAddDoctorModalOpen(false);
      setNewDoctor({ username: '', email: '', password: '', department: '', hospital_id: 1 });
    }
  });

  

  

  

  const navItems = [
    { id: 'overview', label: 'Hospital Overview', icon: <IconOverview /> },
    { id: 'doctors', label: 'Doctors', icon: <IconDoctor /> },
    { id: 'staff', label: 'Staff Management', icon: <IconStaff /> },
    { id: 'appointments', label: 'Appointments', icon: <IconCalendar /> },
    { id: 'beds', label: 'Bed Management', icon: <IconBed /> },
    { id: 'pharmacy', label: 'Pharmacy Inventory', icon: <IconPharmacy /> },
    { id: 'lab', label: 'Laboratory', icon: <IconLab /> },
    { id: 'blood', label: 'Blood Bank', icon: <IconBlood /> },
    { id: 'emergency', label: 'Emergency Cases', icon: <IconEmergency /> },
    { id: 'ai_insights', label: 'AI Insights & Forecasts', icon: <IconCopilot /> },
    { id: 'analytics', label: 'Reports & Analytics', icon: <IconAnalytics /> },
  ];
  return (
    <>
      <div className="ha-dashboard-container">
        
        {/* TOP NAVIGATION */}
        <div className="ha-top-nav relative">
          <div className="flex-1 max-w-sm relative">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search patients, records, inventory, reports..." className="w-full pl-9 pr-16 py-2 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14C8B4]/50 text-xs font-medium" />
            <div className="absolute right-3 top-2.5 flex items-center">
              <span className="text-[9px] font-bold text-gray-400 bg-white px-1.5 py-0.5 border border-gray-200 rounded">Ctrl + K</span>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center absolute left-1/2 -translate-x-1/2">
            <h1 className="text-sm font-extrabold text-gray-800">Hospital Facility Administration</h1>
            <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#14C8B4]/10 text-[#14C8B4] rounded">HOSPITALADMIN</span>
          </div>
          <div className="flex items-center gap-5">
            <button className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors">
              🌐 ENG <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button className="relative text-gray-500 hover:text-[#14C8B4] transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[7px] text-white font-bold">4</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-[#14C8B4] text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer hover:bg-[#00a892] transition-colors">H</div>
          </div>
        </div>

        <div className="ha-main-layout">
          
          {/* LEFT SIDEBAR */}
          <div className="ha-sidebar flex flex-col justify-between">
            <div className="space-y-1">
              {navItems.map(item => (
                <div 
                  key={item.id} 
                  className={`ha-nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            {/* Sidebar Footer */}
            <div className="mt-auto pt-6 border-t border-white/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white text-[#14C8B4] font-bold rounded-lg flex items-center justify-center shadow-md">
                  H
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">HospitalAdmin User</p>
                  <p className="text-[10px] text-white/70 font-medium truncate">demo_hospitaladmin</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <span className="text-[9px] text-white/70">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('role');
                  window.location.href = '/login';
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-200 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
          <div className="ha-content-area">
            
            {/* LAYER 1: OPERATIONAL (Always visible top summary if needed, or based on tab) */}
            {activeTab === 'overview' && (
              <>
                {/* KPI Cards (Row 1) */}
                <div className="ha-grid-5 mb-6">
                  <div className="ha-clay-card flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Facility Beds</div>
                      <div className="flex justify-between items-start">
                        <div className="text-3xl font-extrabold text-gray-800">{dashboardData?.metrics?.total_beds || '120'}</div>
                        <div className="p-2 bg-[#14C8B4]/10 rounded-lg text-[#14C8B4]"><IconBed /></div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#14C8B4] mt-4">Across all wards</div>
                  </div>
                  
                  <div className="ha-clay-card flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Available Beds</div>
                      <div className="flex justify-between items-start">
                        <div className="text-3xl font-extrabold text-gray-800">{dashboardData?.metrics?.available_beds || '18'}</div>
                        <div className="p-2 bg-[#14C8B4]/10 rounded-lg text-[#14C8B4]"><IconBed /></div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#14C8B4] mt-4">15% availability</div>
                  </div>

                  <div className="ha-clay-card flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Occupancy Rate</div>
                      <div className="flex justify-between items-start">
                        <div className="text-3xl font-extrabold text-gray-800">85%</div>
                        <div className="w-8 h-8 rounded-full border-[5px] border-[#14C8B4] border-t-gray-100"></div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-4">102 / 120 Beds</div>
                  </div>

                  <div className="ha-clay-card flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Active Staff</div>
                      <div className="flex justify-between items-start">
                        <div className="text-3xl font-extrabold text-gray-800">{dashboardData?.metrics?.staff_on_duty || '58'}</div>
                        <div className="p-2 bg-[#14C8B4]/10 rounded-lg text-[#14C8B4]"><IconStaff /></div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-gray-500 mt-4">On-duty staff</div>
                  </div>

                  <div className="ha-clay-card primary-gradient flex flex-col justify-between border-none">
                    <div>
                      <div className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1">Hospital Revenue (Today)</div>
                      <div className="text-3xl font-extrabold text-white">₹1,45,200</div>
                    </div>
                    <div className="text-xs font-semibold text-white/90 mt-4">+12.5% vs yesterday</div>
                  </div>
                </div>

                {/* AI Insights (Row 2) */}
                <div className="ha-clay-card mb-6 !p-0">
                  <div className="px-5 py-3 border-b border-gray-100 font-bold text-xs text-gray-700">AI Insights & Resource Forecasts</div>
                  <div className="grid grid-cols-4 divide-x divide-gray-100 p-5">
                    <div className="px-2">
                      <div className="flex items-center gap-2 mb-2 text-[#10B981]">
                        <IconAnalytics />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Patient Admission Intake</span>
                      </div>
                      <div className="text-xs font-bold text-gray-800">Estimated 15% increase next week</div>
                      <div className="text-[10px] text-[#14C8B4] font-medium mt-1">Due to local seasonal flu changes</div>
                    </div>
                    <div className="px-4">
                      <div className="flex items-center gap-2 mb-2 text-[#EF4444]">
                        <div className="w-5 h-5 flex items-center justify-center bg-red-50 text-red-500 rounded"><IconEmergency /></div>
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Bed Capacity Allocation</span>
                      </div>
                      <div className="text-xs font-bold text-[#EF4444]">ICU Bed Shortage Alert</div>
                      <div className="text-[10px] text-[#14C8B4] font-medium mt-1">Expected 90% utilization by Friday</div>
                    </div>
                    <div className="px-4">
                      <div className="flex items-center gap-2 mb-2 text-gray-600">
                        <IconPharmacy />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pharmacy Inventory Demand</span>
                      </div>
                      <div className="text-xs font-bold text-gray-800">ORS sachets high turnover</div>
                      <div className="text-[10px] text-[#14C8B4] font-medium mt-1">Order 500 additional sachets soon</div>
                    </div>
                    <div className="px-4">
                      <div className="flex items-center gap-2 mb-2 text-[#14C8B4]">
                        <IconStaff />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Staffing Recommendation</span>
                      </div>
                      <div className="text-xs font-bold text-gray-800">Need 4 more nurses for ICU</div>
                      <div className="text-[10px] text-[#14C8B4] font-medium mt-1">Based on predicted patient load</div>
                    </div>
                  </div>
                </div>

                {/* Main Operations (Row 3) */}
                <div className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-6 mb-6">
                  {/* Bed Occupancy Overview */}
                  <div className="ha-clay-card flex flex-col h-72">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-bold text-xs text-gray-700">Bed Occupancy Overview</div>
                      <a href="#" className="text-[10px] text-[#14C8B4] font-bold hover:underline">View Details</a>
                    </div>
                    <div className="flex-1 -ml-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={[
                          { name: 'Emergency', Occupied: 4, Available: 3 },
                          { name: 'Maternity', Occupied: 10, Available: 7 },
                          { name: 'Pediatric', Occupied: 30, Available: 8 },
                          { name: 'ICU', Occupied: 30, Available: 2 },
                          { name: 'General Ward', Occupied: 60, Available: 20 },
                        ]} margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#f3f4f6" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#9ca3af'}} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#6b7280'}} width={70} />
                          <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                          <Legend wrapperStyle={{fontSize: '9px', top: -20, left: 30}} iconType="square" iconSize={8} />
                          <Bar dataKey="Occupied" stackId="a" fill="#14C8B4" radius={[0, 0, 0, 0]} barSize={12} />
                          <Bar dataKey="Available" stackId="a" fill="#E5E7EB" radius={[0, 4, 4, 0]} barSize={12} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="ha-clay-card flex flex-col h-72">
                    <div className="font-bold text-xs text-gray-700 mb-4">Quick Actions</div>
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <button className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-700 shadow-sm"><span className="text-[#14C8B4]"><IconDoctor /></span> Add Doctor</button>
                      <button className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-700 shadow-sm"><span className="text-[#14C8B4]"><IconStaff /></span> Add Staff</button>
                      <button className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-700 shadow-sm"><span className="text-[#14C8B4]"><IconPharmacy /></span> Add Medicine</button>
                      <button className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-700 shadow-sm"><span className="text-[#14C8B4]"><IconBed /></span> Add Bed</button>
                      <button className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-700 shadow-sm"><span className="text-[#14C8B4]"><IconCalendar /></span> Book Appt</button>
                      <button className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-700 shadow-sm"><span className="text-[#14C8B4]"><IconLab /></span> Lab Test</button>
                      <button className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-700 shadow-sm"><span className="text-[#14C8B4]"><IconBlood /></span> Blood Request</button>
                      <button className="flex items-center gap-2 p-2.5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-[10px] font-bold text-gray-700 shadow-sm"><span className="text-[#14C8B4]"><IconOverview /></span> View Reports</button>
                    </div>
                  </div>

                  {/* Critical Alerts */}
                  <div className="ha-clay-card flex flex-col h-72">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-bold text-xs text-gray-700">Critical Alerts</div>
                      <a href="#" className="text-[10px] text-[#14C8B4] font-bold hover:underline">View All</a>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 custom-scrollbar">
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-xl bg-red-100 text-red-500 flex items-center justify-center shrink-0 shadow-sm">!</div>
                        <div>
                          <div className="text-xs font-bold text-gray-800">ICU Bed Shortage</div>
                          <div className="text-[10px] text-gray-500 font-medium">Only 2 ICU beds are available</div>
                          <div className="text-[9px] text-gray-400 mt-0.5">10 mins ago</div>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center shrink-0 shadow-sm"><IconPharmacy /></div>
                        <div>
                          <div className="text-xs font-bold text-gray-800">Medicine Low Stock</div>
                          <div className="text-[10px] text-gray-500 font-medium">Paracetamol stock less than 50 units</div>
                          <div className="text-[9px] text-gray-400 mt-0.5">25 mins ago</div>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 shadow-sm"><IconLab /></div>
                        <div>
                          <div className="text-xs font-bold text-gray-800">Lab Equipment Service</div>
                          <div className="text-[10px] text-gray-500 font-medium">X-Ray Machine maintenance due</div>
                          <div className="text-[9px] text-gray-400 mt-0.5">1 hour ago</div>
                        </div>
                      </div>
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-xl bg-green-100 text-green-500 flex items-center justify-center shrink-0 shadow-sm"><IconEmergency /></div>
                        <div>
                          <div className="text-xs font-bold text-gray-800">Emergency Case</div>
                          <div className="text-[10px] text-gray-500 font-medium">New emergency case admitted</div>
                          <div className="text-[9px] text-gray-400 mt-0.5">1 hour ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summaries (Row 4) */}
                <div className="ha-grid-4">
                  {/* Recent Appointments */}
                  <div className="ha-clay-card flex flex-col h-64">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-bold text-xs text-gray-700">Recent Appointments</div>
                      <a href="#" className="text-[10px] text-[#14C8B4] font-bold hover:underline">View All</a>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden shrink-0"><img src="https://i.pravatar.cc/100?img=11" alt="avatar" /></div>
                          <div><div className="text-xs font-bold text-gray-800">Rohan Sen</div><div className="text-[9px] text-gray-500 font-medium">OPD - Dr. Demo</div></div>
                        </div>
                        <div className="text-right"><div className="text-[9px] text-gray-500 font-bold mb-1">09:30 AM</div><span className="ha-badge success !text-[9px] !py-0.5">Completed</span></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden shrink-0"><img src="https://i.pravatar.cc/100?img=5" alt="avatar" /></div>
                          <div><div className="text-xs font-bold text-gray-800">Priya Sharma</div><div className="text-[9px] text-gray-500 font-medium">OPD - Dr. Neha</div></div>
                        </div>
                        <div className="text-right"><div className="text-[9px] text-gray-500 font-bold mb-1">10:15 AM</div><span className="ha-badge warning !text-[9px] !py-0.5 !text-blue-500 !bg-blue-50">In Progress</span></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden shrink-0"><img src="https://i.pravatar.cc/100?img=12" alt="avatar" /></div>
                          <div><div className="text-xs font-bold text-gray-800">Anil Kumar</div><div className="text-[9px] text-gray-500 font-medium">Consultation</div></div>
                        </div>
                        <div className="text-right"><div className="text-[9px] text-gray-500 font-bold mb-1">11:00 AM</div><span className="ha-badge warning !text-[9px] !py-0.5 !text-blue-500 !bg-blue-50">Upcoming</span></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden shrink-0"><img src="https://i.pravatar.cc/100?img=9" alt="avatar" /></div>
                          <div><div className="text-xs font-bold text-gray-800">Neha Patel</div><div className="text-[9px] text-gray-500 font-medium">Follow-up</div></div>
                        </div>
                        <div className="text-right"><div className="text-[9px] text-gray-500 font-bold mb-1">11:45 AM</div><span className="ha-badge warning !text-[9px] !py-0.5 !text-blue-500 !bg-blue-50">Upcoming</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Pharmacy Inventory Status */}
                  <div className="ha-clay-card flex flex-col h-64">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-bold text-xs text-gray-700">Pharmacy Inventory Status</div>
                      <a href="#" className="text-[10px] text-[#14C8B4] font-bold hover:underline">View All</a>
                    </div>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr>
                          <th className="text-[9px] font-bold uppercase text-gray-400 pb-2">Medicine</th>
                          <th className="text-[9px] font-bold uppercase text-gray-400 pb-2 text-center">Stock</th>
                          <th className="text-[9px] font-bold uppercase text-gray-400 pb-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-bold text-gray-700">
                        <tr><td className="py-2.5">Paracetamol 500mg</td><td className="py-2.5 text-center">45</td><td className="py-2.5 text-right"><span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Low Stock</span></td></tr>
                        <tr><td className="py-2.5">ORS Sachets</td><td className="py-2.5 text-center">120</td><td className="py-2.5 text-right"><span className="text-green-500 bg-green-50 px-2 py-0.5 rounded">Good</span></td></tr>
                        <tr><td className="py-2.5">Amoxicillin 250mg</td><td className="py-2.5 text-center">80</td><td className="py-2.5 text-right"><span className="text-green-500 bg-green-50 px-2 py-0.5 rounded">Good</span></td></tr>
                        <tr><td className="py-2.5">Azithromycin 500mg</td><td className="py-2.5 text-center">30</td><td className="py-2.5 text-right"><span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Low Stock</span></td></tr>
                        <tr><td className="py-2.5">Dolo 650mg</td><td className="py-2.5 text-center">200</td><td className="py-2.5 text-right"><span className="text-green-500 bg-green-50 px-2 py-0.5 rounded">Good</span></td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Lab Test Summary */}
                  <div className="ha-clay-card flex flex-col h-64">
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-bold text-xs text-gray-700">Lab Test Summary</div>
                      <a href="#" className="text-[10px] text-[#14C8B4] font-bold hover:underline">View All</a>
                    </div>
                    <div className="space-y-4 flex-1 mt-2">
                      <div className="flex justify-between items-center text-xs font-bold"><div className="flex items-center gap-2 text-[#14C8B4]"><IconLab /><span className="text-gray-700">Total Tests Today</span></div><span className="text-[#14C8B4]">48</span></div>
                      <div className="flex justify-between items-center text-xs font-bold"><div className="flex items-center gap-2 text-green-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-gray-700">Completed</span></div><span className="text-green-500">32</span></div>
                      <div className="flex justify-between items-center text-xs font-bold"><div className="flex items-center gap-2 text-blue-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span className="text-gray-700">Pending</span></div><span className="text-blue-500">12</span></div>
                      <div className="flex justify-between items-center text-xs font-bold"><div className="flex items-center gap-2 text-orange-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><span className="text-gray-700">In Progress</span></div><span className="text-orange-500">4</span></div>
                      <div className="flex justify-between items-center text-xs font-bold"><div className="flex items-center gap-2 text-red-500"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg><span className="text-gray-700">Cancelled</span></div><span className="text-red-500">0</span></div>
                    </div>
                  </div>

                  {/* Revenue Overview */}
                  <div className="ha-clay-card flex flex-col h-64">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-xs text-gray-700">Revenue Overview</div>
                      <a href="#" className="text-[10px] text-[#14C8B4] font-bold hover:underline">View Report</a>
                    </div>
                    <div>
                      <div className="text-xl font-extrabold text-gray-800">₹1,45,200</div>
                      <div className="text-[10px] text-gray-500 font-medium">Today's Collection</div>
                      <div className="text-[9px] font-bold text-[#14C8B4] mt-0.5">+12.5% vs yesterday</div>
                    </div>
                    <div className="flex-1 mt-4 -ml-4 -mb-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          {name: 'Mon', uv: 2000},
                          {name: 'Tue', uv: 3000},
                          {name: 'Wed', uv: 2000},
                          {name: 'Thu', uv: 2780},
                          {name: 'Fri', uv: 1890},
                          {name: 'Sat', uv: 2390},
                          {name: 'Sun', uv: 3490},
                        ]} margin={{top:5, right:20, bottom:0, left:0}}>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#9ca3af'}} />
                          <Tooltip cursor={false} contentStyle={{borderRadius:'8px', border:'none', boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}} />
                          <Line type="monotone" dataKey="uv" stroke="#14C8B4" strokeWidth={2.5} dot={{fill: '#14C8B4', strokeWidth: 2, r: 3}} activeDot={{r: 5}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* LAYER 2: MANAGEMENT (Doctors) */}
            {activeTab === 'doctors' && (
              <div className="ha-layer-section">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="ha-layer-title mb-0">Doctor & Staff Management</h3>
                  <button className="ha-btn ha-btn-primary" onClick={() => setIsAddDoctorModalOpen(true)}>
                    + Add Doctor
                  </button>
                </div>

                <div className="ha-clay-card p-0">
                  <div className="ha-table-container">
                    <table className="ha-table">
                      <thead>
                        <tr>
                          <th>Doctor Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctorsList?.map((doc: any) => (
                          <tr key={doc.id}>
                            <td className="font-medium">{doc.name}</td>
                            <td>{doc.email || 'N/A'}</td>
                            <td>{doc.department}</td>
                            <td>
                              <span className={`ha-badge ${doc.is_on_leave ? 'danger' : 'success'}`}>
                                {doc.is_on_leave ? 'On Leave' : 'On Duty'}
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-2">
                                <button className="text-blue-500 hover:underline text-sm font-medium">Edit Shifts</button>
                                <button className="text-orange-500 hover:underline text-sm font-medium">Transfer</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!doctorsList?.length && (
                          <tr><td colSpan={5} className="text-center text-gray-500 py-4">No doctors found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* STAFF MANAGEMENT TAB */}
            {activeTab === 'staff' && (
              <div className="ha-layer-section">
                <h3 className="ha-layer-title mb-6">Staff Attendance & Leaves</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Attendance */}
                  <div className="ha-clay-card p-0">
                    <div className="p-4 border-b border-gray-100 font-bold text-gray-700 bg-gray-50/50">Today's Attendance</div>
                    <div className="ha-table-container">
                      <table className="ha-table">
                        <thead><tr><th>Doctor</th><th>Dept</th><th>Status</th><th>Time</th></tr></thead>
                        <tbody>
                          {staffAttendance?.map((att: any) => (
                            <tr key={att.doctor_id}>
                              <td className="font-medium">{att.doctor_name}</td>
                              <td>{att.department}</td>
                              <td>
                                <span className={`ha-badge ${att.status === 'Present' ? 'success' : att.status === 'Absent' ? 'danger' : 'warning'}`}>
                                  {att.status}
                                </span>
                              </td>
                              <td className="text-sm">{att.punch_in || '-'} - {att.punch_out || '-'}</td>
                            </tr>
                          ))}
                          {!staffAttendance?.length && <tr><td colSpan={4} className="text-center py-4 text-gray-500">No attendance records.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Leave Requests */}
                  <div className="ha-clay-card p-0">
                    <div className="p-4 border-b border-gray-100 font-bold text-gray-700 bg-gray-50/50">Pending Leave Requests</div>
                    <div className="ha-table-container">
                      <table className="ha-table">
                        <thead><tr><th>Doctor</th><th>Date</th><th>Status</th></tr></thead>
                        <tbody>
                          {leaveRequests?.map((lr: any) => (
                            <tr key={lr.id}>
                              <td>{lr.doctor_name}</td>
                              <td>{lr.leave_date}</td>
                              <td><span className="ha-badge warning">{lr.status}</span></td>
                            </tr>
                          ))}
                          {!leaveRequests?.length && <tr><td colSpan={3} className="text-center py-4 text-gray-500">No pending requests.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPOINTMENTS TAB */}
            {activeTab === 'appointments' && (
              <div className="ha-layer-section">
                <h3 className="ha-layer-title mb-6">Hospital Appointments Queue</h3>
                <div className="ha-clay-card p-0">
                  <div className="ha-table-container">
                    <table className="ha-table">
                      <thead>
                        <tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Dept</th><th>Status</th><th>Booked At</th></tr>
                      </thead>
                      <tbody>
                        {appointmentsList?.map((apt: any) => (
                          <tr key={apt.id}>
                            <td className="font-bold text-[#14C8B4]">#{apt.token_number}</td>
                            <td className="font-medium">{apt.patient_name}</td>
                            <td>Dr. {apt.doctor_name}</td>
                            <td>{apt.department}</td>
                            <td><span className="ha-badge primary-gradient text-white">{apt.status}</span></td>
                            <td className="text-gray-500 text-sm">{apt.booked_at}</td>
                          </tr>
                        ))}
                        {!appointmentsList?.length && <tr><td colSpan={6} className="text-center py-4 text-gray-500">No appointments found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BEDS TAB */}
            {activeTab === 'beds' && (
              <div className="ha-layer-section">
                <h3 className="ha-layer-title mb-6">Bed Management</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {bedsList?.map((bed: any) => (
                    <div 
                      key={bed.id} 
                      onClick={() => {
                        const newStatus = bed.status === 'Available' ? 'Occupied' : bed.status === 'Occupied' ? 'Maintenance' : 'Available';
                        updateBedMutation.mutate({ id: bed.id, status: newStatus });
                      }}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 text-center border-2 
                        ${bed.status === 'Available' ? 'bg-green-50 border-green-200 hover:border-green-400' : 
                          bed.status === 'Occupied' ? 'bg-red-50 border-red-200 hover:border-red-400' : 
                          'bg-yellow-50 border-yellow-200 hover:border-yellow-400'}`}
                    >
                      <IconBed />
                      <div className="font-bold mt-2">Bed {bed.id}</div>
                      <div className="text-xs text-gray-500 font-medium">{bed.type}</div>
                      <div className={`text-xs font-bold mt-1 
                        ${bed.status === 'Available' ? 'text-green-600' : bed.status === 'Occupied' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {bed.status}
                      </div>
                    </div>
                  ))}
                  {!bedsList?.length && <div className="col-span-full text-gray-500 text-center py-8">No beds configured.</div>}
                </div>
              </div>
            )}

            {/* PHARMACY TAB */}
            {activeTab === 'pharmacy' && (
              <div className="ha-layer-section">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="ha-layer-title mb-0">Pharmacy Inventory</h3>
                  <button className="ha-btn ha-btn-primary" onClick={() => {
                    const med = prompt("Enter medicine name to request:");
                    const qty = prompt("Enter quantity to request:");
                    if (med && qty) requestMedicineMutation.mutate({ medicine_name: med, requested_quantity: parseInt(qty) });
                  }}>
                    Request Stock from District
                  </button>
                </div>
                <div className="ha-clay-card p-0">
                  <div className="ha-table-container">
                    <table className="ha-table">
                      <thead><tr><th>Medicine</th><th>Batch No</th><th>Quantity</th><th>Expiry Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {pharmacyStock?.map((med: any) => (
                          <tr key={med.id}>
                            <td className="font-medium">{med.name}</td>
                            <td>{med.batch_number || 'N/A'}</td>
                            <td className="font-bold">{med.quantity} Units</td>
                            <td>{med.expiry_date || 'N/A'}</td>
                            <td>
                              <span className={`ha-badge ${med.quantity < 50 ? 'danger' : med.quantity < 150 ? 'warning' : 'success'}`}>
                                {med.quantity < 50 ? 'Critical' : med.quantity < 150 ? 'Low Stock' : 'Optimal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {!pharmacyStock?.length && <tr><td colSpan={5} className="text-center py-4 text-gray-500">No inventory found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* LAB TAB */}
            {activeTab === 'lab' && (
              <div className="ha-layer-section">
                <h3 className="ha-layer-title mb-6">Laboratory Reports</h3>
                <div className="ha-clay-card p-0">
                  <div className="ha-table-container">
                    <table className="ha-table">
                      <thead><tr><th>Patient</th><th>Date Generated</th><th>AI Summary</th><th>Abnormal Values</th></tr></thead>
                      <tbody>
                        {labReports?.map((rep: any) => (
                          <tr key={rep.id}>
                            <td className="font-medium">{rep.patient_name}</td>
                            <td>{rep.created_at}</td>
                            <td className="text-sm max-w-xs truncate" title={rep.ai_summary}>{rep.ai_summary || '-'}</td>
                            <td className="text-sm text-red-500 font-medium">{rep.ai_abnormal_values || 'None'}</td>
                          </tr>
                        ))}
                        {!labReports?.length && <tr><td colSpan={4} className="text-center py-4 text-gray-500">No lab reports found.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* BLOOD BANK TAB */}
            {activeTab === 'blood' && (
              <div className="ha-layer-section">
                <h3 className="ha-layer-title mb-6">Blood Bank Inventory</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => {
                    const bloodItem = bloodBank?.find((b: any) => b.group === group);
                    const units = bloodItem?.units || 0;
                    return (
                      <div key={group} className="ha-clay-card flex flex-col items-center justify-center py-8 relative overflow-hidden group">
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 blur-xl ${units < 10 ? 'bg-red-500' : 'bg-[#14C8B4]'}`}></div>
                        <IconBlood />
                        <div className="text-3xl font-extrabold text-gray-800 mt-4">{group}</div>
                        <div className={`text-2xl font-bold mt-2 ${units < 10 ? 'text-red-500' : 'text-[#14C8B4]'}`}>{units} Units</div>
                        <button 
                          className="mt-4 text-sm font-bold text-gray-500 hover:text-[#14C8B4] transition-colors"
                          onClick={() => {
                            const add = prompt(`Enter units of ${group} to add:`);
                            if (add) updateBloodMutation.mutate({ group, units: parseInt(add) });
                          }}
                        >+ Add Stock</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* EMERGENCY TAB */}
            {activeTab === 'emergency' && (
              <div className="ha-layer-section">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="ha-layer-title mb-0 flex items-center gap-2 text-red-600"><div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div> Active Emergencies (Live)</h3>
                  <div className="ha-badge danger">CODE RED READY</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mocked Emergency Case 1 */}
                  <div className="ha-clay-card border-l-4 border-l-red-500 bg-red-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-red-700 text-lg">Ambulance ETA: 4 mins</div>
                      <span className="ha-badge danger">Trauma</span>
                    </div>
                    <p className="text-gray-700 font-medium">Male, 34. Severe head injury from RTA.</p>
                    <div className="mt-4 flex gap-2">
                      <button className="ha-btn bg-red-600 text-white hover:bg-red-700 w-full py-2">Prepare Trauma ICU</button>
                      <button className="ha-btn bg-white text-red-600 border border-red-200 w-full py-2">Page Neuro On-Call</button>
                    </div>
                  </div>
                  {/* Mocked Emergency Case 2 */}
                  <div className="ha-clay-card border-l-4 border-l-orange-500 bg-orange-50/30">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-orange-700 text-lg">Walk-in Triage</div>
                      <span className="ha-badge warning">Cardiac</span>
                    </div>
                    <p className="text-gray-700 font-medium">Female, 62. Chest pain, radiating to left arm.</p>
                    <div className="mt-4 flex gap-2">
                      <button className="ha-btn bg-orange-500 text-white hover:bg-orange-600 w-full py-2">ECG Ordered</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="ha-layer-section">
                <h3 className="ha-layer-title mb-6">Reports & Analytics</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="ha-clay-card">
                    <h4 className="font-bold text-gray-700 mb-4">Patient Intake Trends</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={[
                          { name: 'Mon', count: 45 }, { name: 'Tue', count: 52 }, { name: 'Wed', count: 38 },
                          { name: 'Thu', count: 65 }, { name: 'Fri', count: 48 }, { name: 'Sat', count: 80 }, { name: 'Sun', count: 72 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                          <Area type="monotone" dataKey="count" stroke="#14C8B4" fill="#14C8B4" fillOpacity={0.2} strokeWidth={3} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="ha-clay-card">
                    <h4 className="font-bold text-gray-700 mb-4">Department Load</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Cardiology', count: 40 }, { name: 'Neurology', count: 25 }, 
                          { name: 'Pediatrics', count: 60 }, { name: 'General', count: 110 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                          <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
        {/* AI Copilot Floating Button */}
        <div className="ha-ai-copilot-btn" title="MediConnect AI Copilot">
          <IconCopilot />
        </div>
        {/* ═══════════════════════ TAB: AI INSIGHTS ═══════════════════════ */}
        {activeTab === 'ai_insights' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-indigo-500/30">
                🤖
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-gray-900">AI Clinical & Operational Insights</h3>
                <p className="text-sm text-gray-500 font-medium mt-1">Predictive analytics powered by MediConnect 360 AI Models</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Bed Occupancy Forecast */}
              <div className="ha-clay-card flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      🛏️ Predictive Bed Occupancy
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">AI forecast based on admission trends</p>
                  </div>
                  <div className={`px-3 py-1 rounded-xl text-xs font-bold ${aiBedForecast?.alert_level === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {aiBedForecast?.alert_level} RISK
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 font-bold">Current Rate</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{aiBedForecast?.current_occupancy_rate || 0}%</p>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-bold">Predicted (48h)</p>
                    <p className="text-2xl font-black text-indigo-700 mt-1">{aiBedForecast?.predicted_occupancy_rate || 0}%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-sm font-bold text-gray-700">Projected Availability</h5>
                  {aiBedForecast?.bed_breakdown && Object.entries(aiBedForecast.bed_breakdown).map(([type, data]: [string, any]) => (
                    <div key={type} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                      <span className="text-sm font-bold capitalize text-gray-700">{type} Beds</span>
                      <div className="text-right">
                        <span className="text-lg font-black text-gray-900">{data.available}</span>
                        <span className="text-xs text-gray-400 ml-1">/ {data.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medicine & Stock Alerts */}
              <div className="ha-clay-card flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      💊 Smart Inventory Forecasting
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">AI-driven low stock & demand alerts</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                    {aiMedicineAlerts?.total_alerts || 0}
                  </div>
                </div>

                <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                  {aiMedicineAlerts?.alerts?.map((alert: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.risk_level === 'CRITICAL' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                      <div className="flex justify-between items-start pl-2">
                        <div>
                          <h5 className="font-bold text-gray-900">{alert.medicine}</h5>
                          <p className="text-xs text-gray-500 mt-1">Stockout in <span className="font-bold text-gray-700">{alert.days_until_stockout} days</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Suggested Reorder</p>
                          <p className="text-lg font-black text-indigo-600">{alert.suggested_reorder} units</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!aiMedicineAlerts?.alerts || aiMedicineAlerts.alerts.length === 0) && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No critical stock alerts at this time.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: APPOINTMENTS BOOK */}
        {activeTab === 'appointments' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-dark">Doctor-wise Appointment Statistics</h3>
              <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} className="text-xs px-3 py-2 border rounded-xl outline-none border-accent/40 bg-white shadow-inner" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                    <th className="py-2.5 px-4 font-semibold">Doctor Name</th>
                    <th className="py-2.5 px-4 font-semibold">Department</th>
                    <th className="py-2.5 px-4 font-semibold">Total Slots</th>
                    <th className="py-2.5 px-4 font-semibold">Booked Consultations</th>
                    <th className="py-2.5 px-4 font-semibold">Wait/IP Status</th>
                    <th className="py-2.5 px-4 font-semibold">Completed Consults</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  {statsLoading ? (
                    <tr><td colSpan={6} className="py-4 text-center text-secondary/60 font-bold">Loading stats...</td></tr>
                  ) : doctorStats.length === 0 ? (
                    <tr><td colSpan={6} className="py-4 text-center text-secondary/60">No doctor data retrieved.</td></tr>
                  ) : (
                    doctorStats.map((stat: any, idx: number) => (
                      <tr key={idx} className="border-b border-accent/15 hover:bg-accent/10">
                        <td className="py-2.5 px-4 font-bold text-dark flex items-center gap-2">
                          {stat.doctor_name}
                          {stat.is_on_leave && <span className="bg-red-100 text-red-600 px-1 py-0.5 rounded text-[9px]">ON LEAVE</span>}
                        </td>
                        <td className="py-2.5 px-4 text-secondary/70">{stat.department}</td>
                        <td className="py-2.5 px-4 font-bold">{stat.slots}</td>
                        <td className="py-2.5 px-4 text-secondary font-bold">
                          {stat.booked}
                        </td>
                        <td className="py-2.5 px-4 text-yellow-600 font-bold">{stat.pending} Pending</td>
                        <td className="py-2.5 px-4 text-green-600 font-bold">{stat.completed} Completed</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: BLOOD BANK RESERVES */}
        {activeTab === 'blood' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold text-dark">Active Blood Stock</h3>
              <div className="grid grid-cols-2 gap-4">
                {bloodStock.map((b) => (
                  <div key={b.type} className="p-4 bg-red-50/50 border border-red-200/50 rounded-xl flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-red-650 mb-1">{b.type}</span>
                    <span className="text-sm font-bold text-secondary/80">{b.qty} Bags</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-dark">Register Donor Record</h3>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Donor recorded and registered.");
                }} 
                className="space-y-4 text-xs"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-secondary/60 font-bold mb-1">Donor Name</label>
                    <input type="text" className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none" required />
                  </div>
                  <div>
                    <label className="block text-secondary/60 font-bold mb-1">Blood Type</label>
                    <select className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none">
                      <option>O+</option>
                      <option>A+</option>
                      <option>B+</option>
                      <option>AB+</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <button type="submit" className="ha-btn ha-btn-primary">Register Donor</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Doctor Modal */}
        {isAddDoctorModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="ha-clay-card w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Add New Doctor</h3>
              <form onSubmit={(e) => { e.preventDefault(); addDoctorMutation.mutate(newDoctor); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input type="text" required className="mt-1 w-full p-2 border border-gray-300 rounded-xl"
                    value={newDoctor.username} onChange={e => setNewDoctor({...newDoctor, username: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input type="email" required className="mt-1 w-full p-2 border border-gray-300 rounded-xl"
                    value={newDoctor.email} onChange={e => setNewDoctor({...newDoctor, email: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" required className="mt-1 w-full p-2 border border-gray-300 rounded-xl"
                    value={newDoctor.password} onChange={e => setNewDoctor({...newDoctor, password: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select required className="mt-1 w-full p-2 border border-gray-300 rounded-xl"
                    value={newDoctor.department} onChange={e => setNewDoctor({...newDoctor, department: e.target.value})}>
                    <option value="">Select Department...</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" className="ha-btn" onClick={() => setIsAddDoctorModalOpen(false)}>Cancel</button>
                  <button type="submit" className="ha-btn ha-btn-primary" disabled={addDoctorMutation.isPending}>
                    {addDoctorMutation.isPending ? 'Saving...' : 'Add Doctor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
    </>
  );
}
