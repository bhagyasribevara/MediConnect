import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { getAppointmentLoad, getFootfall, predictDisease } from '../../services/ai_api';
import { io } from 'socket.io-client';

import { 
  AIHealthSummary, DoctorSummary, OPDLoadAndForecast, InsightsAndAlerts, QuickActions, DoctorPerformance 
} from '../../components/doctor/DashboardWidgets';
import { AIPriorityQueue, ConsultationQueue } from '../../components/doctor/PatientQueues';
import { AIClinicalDecision, MedLensReports, LabReports } from '../../components/doctor/ClinicalSupport';
import PatientDetailsModal from '../../components/doctor/PatientDetailsModal';


const socket = io('http://127.0.0.1:5000');

// ─── Icon Components ────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z" />
  </svg>
);
const AppointmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);
const PatientsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21 12.318 12.318 0 012.193 19.128M15 19.128v.106A12.318 12.318 0 008.624 21a12.318 12.318 0 01-6.431-1.872" />
  </svg>
);
const ConsultationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
  </svg>
);
const PrescriptionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);
const AIReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
  </svg>
);
const LabIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3" />
  </svg>
);
const ScheduleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const AnalyticsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);
const MessagesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ─── Extended Tab Configuration ─────────────────────────────────────────
const doctorTabs = [
  { id: 'overview', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'appointments', label: 'Appointments', icon: <AppointmentIcon /> },
  { id: 'patients', label: 'Patients', icon: <PatientsIcon /> },
  { id: 'consultation', label: 'Consultation & EMR', icon: <ConsultationIcon /> },
  { id: 'prescriptions', label: 'Prescriptions', icon: <PrescriptionIcon /> },
  { id: 'medlens_review', label: 'AI Report Review', icon: <AIReportIcon />, badge: 3 },
  { id: 'lab_orders', label: 'Lab Orders', icon: <LabIcon /> },
  { id: 'schedules', label: 'Schedule & Calendar', icon: <ScheduleIcon /> },
  { id: 'my_profile', label: 'My Profile', icon: <PatientsIcon /> },
  { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
  { id: 'ai_predictions', label: 'AI Predictions', icon: <AIReportIcon />, badge: 0 },
  { id: 'messages', label: 'Messages', icon: <MessagesIcon />, badge: 2 },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

// ─── Helper: Claymorphism Card ──────────────────────────────────────────
const ClayCard = ({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) => (
  <div className={`bg-white rounded-3xl shadow-clay border border-accent/20 ${hover ? 'hover:shadow-clay-hover hover:-translate-y-0.5 transition-all duration-300' : ''} ${className}`}>
    {children}
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────
export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const doctor_id = 1; // Prototype value

  // Queue fetching
  const { data: queue = [], isLoading: isLoadingQueue } = useQuery({
    queryKey: ['doctorQueue', doctor_id],
    queryFn: async () => {
      const res = await api.get(`/appointment/queue?doctor_id=${doctor_id}`);
      return res.data;
    }
  });

  useEffect(() => {
    socket.on('queue_updated', (data) => {
      if (data.doctor_id == doctor_id) {
        queryClient.invalidateQueries({ queryKey: ['doctorQueue', doctor_id] });
      }
    });
    return () => {
      socket.off('queue_updated');
    };
  }, [queryClient, doctor_id]);

  const updateQueueStatus = async (queue_id: number, status: string) => {
    await api.post('/appointment/queue/status', { queue_id, status });
  };

  // Consultation state
  const [consultationForm, setConsultationForm] = useState({
    diagnosis: '',
    prescriptionText: '',
    labTests: 'None',
    followUp: '',
    advice: ''
  });
  const [isCopilotPending, setIsCopilotPending] = useState(false);

  // MedLens Reviews
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportsToReview, setReportsToReview] = useState<any[]>([]);

  const [leaveForm, setLeaveForm] = useState({ date: '', reason: '' });
  const [shiftForm, setShiftForm] = useState({ start: '09:00', end: '10:00', max: 10 });

  const { data: profile } = useQuery({
    queryKey: ['doctorProfile'],
    queryFn: async () => { const res = await api.get('/doctor/profile'); return res.data; }
  });

  const { data: shifts } = useQuery({
    queryKey: ['doctorShifts'],
    queryFn: async () => { const res = await api.get('/doctor/shifts'); return res.data; }
  });

  const { data: attendance } = useQuery({
    queryKey: ['doctorAttendanceToday'],
    queryFn: async () => { const res = await api.get('/doctor/attendance/today'); return res.data; }
  });

  // ─── AI Prediction Data ────────────────────────────────────────
  const { data: aiLoadData } = useQuery({
    queryKey: ['ai_appointment_load'],
    queryFn: async () => { const res = await getAppointmentLoad(); return res.data; },
    enabled: activeTab === 'overview' || activeTab === 'ai_predictions',
  });
  const { data: aiFootfallData } = useQuery({
    queryKey: ['ai_footfall'],
    queryFn: async () => { const res = await getFootfall(7); return res.data; },
    enabled: activeTab === 'ai_predictions',
  });

  const { data: leaves } = useQuery({
    queryKey: ['doctorLeaves'],
    queryFn: async () => { const res = await api.get('/doctor/leave'); return res.data; }
  });

  const punchInMutation = useMutation({
    mutationFn: async () => await api.post('/doctor/attendance/punch-in'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctorAttendanceToday'] }),
    onError: (err: any) => alert(err.response?.data?.error || "Error")
  });

  const punchOutMutation = useMutation({
    mutationFn: async () => await api.post('/doctor/attendance/punch-out'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doctorAttendanceToday'] }),
    onError: (err: any) => alert(err.response?.data?.error || "Error")
  });

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/doctor/leave', { leave_date: leaveForm.date, reason: leaveForm.reason });
      alert('Leave request submitted!');
      setLeaveForm({ date: '', reason: '' });
      queryClient.invalidateQueries({ queryKey: ['doctorLeaves'] });
    } catch (err: any) {
      alert(err.response?.data?.error || "Error submitting leave");
    }
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/doctor/shifts', {
        start_time: shiftForm.start,
        end_time: shiftForm.end,
        max_appointments: shiftForm.max
      });
      alert('Shift created!');
      queryClient.invalidateQueries({ queryKey: ['doctorShifts'] });
    } catch (err: any) {
      alert(err.response?.data?.error || "Error creating shift");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('photo', e.target.files[0]);
      try {
        await api.post('/doctor/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        queryClient.invalidateQueries({ queryKey: ['doctorProfile'] });
        alert("Photo updated!");
      } catch (err) {
        alert("Error uploading photo");
      }
    }
  };

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['doctorMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/doctor');
      return res.data.metrics;
    }
  });

  // Get current time and greeting
  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? 'Good morning' : hours < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  // AI Copilot features
  const handleAutoPrescription = () => {
    setIsCopilotPending(true);
    setTimeout(() => {
      setConsultationForm(prev => ({
        ...prev,
        diagnosis: 'Mild Respiratory Tract Infection (RTI)',
        prescriptionText: '1. Tab. Amoxicillin 500mg - Twice a day - 5 Days\n2. Syr. Benadryl 10ml - Thrice a day - 3 Days\n3. Tab. Paracetamol 500mg - SOS Fever',
        advice: 'Avoid cold beverages. Rest and hydrate. Do steam inhalation twice daily.',
        labTests: 'CBC (Complete Blood Count)'
      }));
      setIsCopilotPending(false);
    }, 1500);
  };

  const handleApproveReport = (id: number) => {
    setReportsToReview(prev => prev.filter(r => r.id !== id));
    setSelectedReport(null);
    alert("Lab Report approved and added to patient digital health file.");
  };



  // ─── Sample data for the enhanced dashboard ────────────────────────────
  // ─── Data Arrays (Now expecting manual input / API calls) ──────────────
  const todaysAppointments: any[] = [];
  const aiInsights: any[] = [];
  const recentPatients: any[] = [];
  const scheduleItems: any[] = [];
  const notificationsData: any[] = [];

  return (
    <DashboardLayout 
      title="Doctor Clinical Workspace" 
      role="Doctor" 
      tabs={doctorTabs} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="space-y-8">

        {/* ═══════════════════════ TAB 1: DASHBOARD OVERVIEW ═══════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">

            {/* ─── Greeting Section ─────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                {profile?.photo_url && (
                  <img src={`http://localhost:5000${profile.photo_url}`} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover shadow-sm border border-secondary/20" />
                )}
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-dark leading-tight">
                    {greeting}, Dr. {profile?.username || 'Demo'} 👋
                  </h1>
                  <p className="text-sm text-gray-400 mt-1 font-medium flex gap-3">
                    <span>Here's what's happening in your workspace today.</span>
                    {attendance?.status === 'Present' && <span className="text-secondary font-bold">• Punched in at {attendance.punch_in}</span>}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-dark">{formattedDate} • {formattedTime}</p>
              </div>
            </div>

            {/* Today's Appointments queue */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-4">
              <h3 className="text-sm font-bold text-dark">Active Consultation Queue</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                      <th className="py-2.5 px-4 font-semibold">Token</th>
                      <th className="py-2.5 px-4 font-semibold">Patient Name</th>
                      <th className="py-2.5 px-4 font-semibold">Time</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-dark">
                    {isLoadingQueue ? (
                      <tr><td colSpan={5} className="py-4 text-center">Loading queue...</td></tr>
                    ) : queue.length === 0 ? (
                      <tr><td colSpan={5} className="py-4 text-center">No patients in queue today.</td></tr>
                    ) : (
                      queue.map((appt: any) => (
                        <tr key={appt.appointment_id} className="border-b border-accent/15 hover:bg-accent/10">
                          <td className="py-2.5 px-4 font-bold text-secondary">{appt.queue_number}</td>
                          <td className="py-2.5 px-4 font-bold">{appt.patient_name}</td>
                          <td className="py-2.5 px-4">{appt.time}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-1 rounded font-bold text-[10px] ${appt.status === 'Waiting' ? 'bg-yellow-100 text-yellow-700' : appt.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {appt.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 flex gap-2">
                            {appt.status === 'Waiting' && (
                              <button 
                                onClick={() => updateQueueStatus(appt.queue_id, 'In Progress')}
                                className="px-3 py-1 bg-secondary text-white rounded-lg font-bold shadow hover:bg-[#00a892] transition-colors"
                              >
                                Start
                              </button>
                            )}
                            {appt.status === 'In Progress' && (
                              <button 
                                onClick={() => updateQueueStatus(appt.queue_id, 'Completed')}
                                className="px-3 py-1 bg-green-500 text-white rounded-lg font-bold shadow hover:bg-green-600 transition-colors"
                              >
                                Finish
                              </button>
                            )}
                            {(appt.status === 'Waiting' || appt.status === 'In Progress') && (
                              <button 
                                onClick={() => updateQueueStatus(appt.queue_id, 'Skipped')}
                                className="px-3 py-1 bg-red-500 text-white rounded-lg font-bold shadow hover:bg-red-600 transition-colors"
                              >
                                Skip
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* ─── KPI Cards Row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              {/* Appointments Today */}
              <ClayCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">Appointments Today</span>
                </div>
                <p className="text-4xl font-black text-dark">{isLoading ? '...' : metrics?.todays_appointments || 8}</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Out of 15 slots</p>
                <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: '53%' }}></div>
                </div>
              </ClayCard>

              {/* Pending Reports */}
              <ClayCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">Pending Reports</span>
                </div>
                <p className="text-4xl font-black text-orange-500">{isLoading ? '...' : metrics?.pending_reports || 3}</p>
                <p className="text-xs text-orange-400 mt-1 font-semibold">Require AI validation</p>
              </ClayCard>

              {/* Emergency Patients */}
              <ClayCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">Emergency Patients</span>
                </div>
                <p className="text-4xl font-black text-red-500">1</p>
                <p className="text-xs text-red-400 mt-1 font-semibold">ICU bed requested</p>
              </ClayCard>

              {/* Follow-ups Today */}
              <ClayCard className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">Follow-ups Today</span>
                </div>
                <p className="text-4xl font-black text-dark">5</p>
                <p className="text-xs text-gray-400 mt-1 font-medium">Scheduled</p>
              </ClayCard>

              {/* Consultation Load - Accent Card */}
              <div className="bg-secondary text-white rounded-3xl p-5 shadow-[0_8px_30px_rgba(20,200,180,0.3)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider text-white/80">Consultation Load</span>
                </div>
                <p className="text-3xl font-black">High</p>
                <p className="text-xs text-white/70 mt-1 font-medium leading-relaxed">
                  {isLoading ? '...' : metrics?.ai_insights || 'High number of seasonal flu cases detected.'}
                </p>
                <button className="mt-3 text-xs font-bold text-white/90 hover:text-white flex items-center gap-1 transition-colors">
                  View Insights →
                </button>
              </div>
            </div>

            {/* ─── Middle Section: Appointments + AI Insights + Quick Actions ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Today's Appointments */}
              <ClayCard className="p-6" hover={false}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-dark flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Today's Appointments
                  </h3>
                  <button className="text-xs font-bold text-secondary hover:text-dark transition-colors">View Calendar</button>
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">
                  <div className="col-span-2">TIME</div>
                  <div className="col-span-3">PATIENT</div>
                  <div className="col-span-2">AGE/SEX</div>
                  <div className="col-span-2">TYPE</div>
                  <div className="col-span-1">STATUS</div>
                  <div className="col-span-2">ACTION</div>
                </div>

                <div className="space-y-2">
                  {todaysAppointments.map((apt, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center p-2.5 rounded-2xl hover:bg-accent/30 transition-colors group text-xs">
                      <div className="col-span-2 font-bold text-dark">{apt.time}</div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold text-[10px]">
                            {apt.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-dark text-[11px]">{apt.name}</p>
                            <p className="text-[9px] text-gray-400">MRN: {apt.mrn}</p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 text-gray-500 font-medium">{apt.age}</div>
                      <div className="col-span-2 text-gray-500 font-medium">{apt.type}</div>
                      <div className="col-span-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${apt.statusColor}`}>{apt.status}</span>
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => {
                            setSelectedPatient({ name: apt.name, age: apt.age.split(' ')[0], gender: apt.age.split(' / ')[1] === 'M' ? 'Male' : 'Female', history: 'Medical history available in EMR.' });
                            setActiveTab('consultation');
                          }}
                          className="px-3 py-1.5 bg-secondary text-white rounded-xl text-[10px] font-bold shadow-sm hover:bg-[#00a892] transition-all active:scale-95"
                        >
                          Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setActiveTab('appointments')}
                    className="text-xs font-bold text-secondary border border-secondary/30 px-4 py-2 rounded-2xl hover:bg-secondary hover:text-white transition-all"
                  >
                    View All Appointments
                  </button>
                </div>
              </ClayCard>

              {/* AI Health Insights */}
              <ClayCard className="p-6" hover={false}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-dark flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    AI Health Insights
                  </h3>
                  <button className="text-xs font-bold text-secondary hover:text-dark transition-colors">View All</button>
                </div>

                <div className="space-y-3">
                  {aiInsights.map((insight, i) => (
                    <div key={i} className={`p-4 rounded-2xl border ${insight.color} hover:shadow-md transition-all cursor-pointer group`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{insight.icon}</span>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-dark leading-relaxed">{insight.text}</p>
                          <button className="text-[10px] font-bold text-secondary mt-2 group-hover:underline">View Details</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ClayCard>

              {/* Quick Actions */}
              <ClayCard className="p-6" hover={false}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-dark flex items-center gap-2">
                    <span className="w-2 h-2 bg-secondary rounded-full"></span>
                    Quick Actions
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: '➕', label: 'New Consultation', tab: 'consultation' },
                    { icon: '📄', label: 'Add Prescription', tab: 'prescriptions' },
                    { icon: '🧪', label: 'Order Lab Test', tab: 'lab_orders' },
                    { icon: '📤', label: 'Upload Report', tab: 'medlens_review' },
                    { icon: '📜', label: 'Medical Certificate', tab: 'consultation' },
                    { icon: '🔀', label: 'Referral', tab: 'consultation' },
                    { icon: '📁', label: 'Patient EMR', tab: 'patients' },
                    { icon: '🎤', label: 'Voice Notes', tab: 'consultation' },
                    { icon: '✨', label: 'AI Copilot', tab: 'overview' },
                  ].map((action, i) => (
                    <button 
                      key={i}
                      onClick={() => setActiveTab(action.tab)}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl bg-accent/30 border border-accent/20 hover:bg-secondary/10 hover:border-secondary/30 hover:-translate-y-0.5 transition-all duration-200 group"
                    >
                      <span className="text-xl mb-1.5">{action.icon}</span>
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-secondary text-center leading-tight">{action.label}</span>
                    </button>
                  ))}
                </div>
              </ClayCard>
            </div>

            {/* ─── Bottom Section: Recent Patients + Schedule + Notifications ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Patients */}
              <ClayCard className="p-6" hover={false}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-dark">Recent Patients</h3>
                  <button className="text-xs font-bold text-secondary hover:text-dark transition-colors">View All</button>
                </div>
                <div className="space-y-3">
                  {recentPatients.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-accent/30 transition-colors cursor-pointer">
                      <div className="w-9 h-9 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold text-xs">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-dark truncate">{p.name}</p>
                          <span className="text-[9px] text-gray-400 font-medium">{p.mrn}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">{p.time}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${p.typeColor}`}>{p.type}</span>
                    </div>
                  ))}
                </div>
              </ClayCard>

              {/* My Schedule */}
              <ClayCard className="p-6" hover={false}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-dark">My Schedule</h3>
                  <button onClick={() => setActiveTab('schedules')} className="text-xs font-bold text-secondary hover:text-dark transition-colors">View Calendar</button>
                </div>
                <div className="space-y-3">
                  {scheduleItems.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-accent/20 transition-colors">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${s.color} flex-shrink-0`}></div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold">{s.time}</p>
                        <p className="text-xs font-semibold text-dark mt-0.5">{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ClayCard>

              {/* Notifications */}
              <ClayCard className="p-6" hover={false}>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-extrabold text-dark">Notifications</h3>
                  <button className="text-xs font-bold text-secondary hover:text-dark transition-colors">View All</button>
                </div>
                <div className="space-y-3">
                  {notificationsData.map((n, i) => (
                    <div key={i} className="flex items-start gap-3 p-2.5 rounded-2xl hover:bg-accent/20 transition-colors">
                      <span className={`text-lg ${n.color}`}>{n.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-dark leading-relaxed">{n.text}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ClayCard>
            </div>

            {/* ─── NEW COMPONENT INTEGRATION ─────────────────────────────────────────────── */}
            <div className="mt-8 border-t border-accent/20 pt-8">
              <h2 className="text-xl font-extrabold text-dark mb-6">Enhanced AI Features</h2>
              <AIHealthSummary />
              
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-6">
                <div className="xl:col-span-2 space-y-8">
                  <OPDLoadAndForecast />
                  <DoctorSummary />
                  <ConsultationQueue queue={queue} updateQueueStatus={updateQueueStatus} onPatientClick={(p) => { setSelectedPatient(p); setIsModalOpen(true); }} />
                </div>
                <div className="space-y-8">
                  <QuickActions />
                  <InsightsAndAlerts />
                  <AIPriorityQueue onPatientClick={(p) => { setSelectedPatient(p); setIsModalOpen(true); }} />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ═══════════════════════ TAB: APPOINTMENTS ═══════════════════════ */}
        {activeTab === 'appointments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-dark">Today's Appointments</h2>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Search patients..." 
                  className="px-4 py-2 bg-accent/30 border border-accent/30 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-secondary w-56 shadow-inner"
                />
                <select className="px-3 py-2 bg-white border border-accent/30 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-secondary">
                  <option>All Types</option>
                  <option>Follow-up</option>
                  <option>Consultation</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>

            <ClayCard className="p-6" hover={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-accent/15 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Token</th>
                      <th className="py-3 px-4">Patient</th>
                      <th className="py-3 px-4">Age</th>
                      <th className="py-3 px-4">Gender</th>
                      <th className="py-3 px-4">Visit Type</th>
                      <th className="py-3 px-4">Chief Complaint</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-dark">
                    {[
                      { token: 'MC-2940', name: 'Patient Demo', age: '32', gender: 'Male', type: 'Follow-up', complaint: 'Elevated blood pressure, cholesterol review', priority: 'Medium', status: 'Waiting', time: '09:00 AM', pColor: 'bg-amber-100 text-amber-700', sColor: 'bg-blue-100 text-blue-700' },
                      { token: 'MC-2941', name: 'Rohan Sen', age: '45', gender: 'Male', type: 'Follow-up', complaint: 'Persistent dry cough, fever', priority: 'High', status: 'Next', time: '09:30 AM', pColor: 'bg-red-100 text-red-700', sColor: 'bg-green-100 text-green-700' },
                      { token: 'MC-2942', name: 'Priya Sharma', age: '32', gender: 'Female', type: 'Consultation', complaint: 'Migraine, nausea', priority: 'Medium', status: 'Upcoming', time: '10:15 AM', pColor: 'bg-amber-100 text-amber-700', sColor: 'bg-amber-100 text-amber-700' },
                      { token: 'MC-2943', name: 'Anil Kumar', age: '60', gender: 'Male', type: 'Follow-up', complaint: 'Diabetes management review', priority: 'Low', status: 'Upcoming', time: '11:00 AM', pColor: 'bg-green-100 text-green-700', sColor: 'bg-amber-100 text-amber-700' },
                      { token: 'MC-2944', name: 'Neha Patel', age: '28', gender: 'Female', type: 'Consultation', complaint: 'Skin rashes, itching', priority: 'Low', status: 'Upcoming', time: '11:45 AM', pColor: 'bg-green-100 text-green-700', sColor: 'bg-amber-100 text-amber-700' },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-accent/10 hover:bg-accent/15 transition-colors">
                        <td className="py-3 px-4 font-bold text-secondary">{row.token}</td>
                        <td className="py-3 px-4 font-bold">{row.name}</td>
                        <td className="py-3 px-4">{row.age}</td>
                        <td className="py-3 px-4">{row.gender}</td>
                        <td className="py-3 px-4">{row.type}</td>
                        <td className="py-3 px-4 text-gray-500 max-w-48 truncate">{row.complaint}</td>
                        <td className="py-3 px-4"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${row.pColor}`}>{row.priority}</span></td>
                        <td className="py-3 px-4"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${row.sColor}`}>{row.status}</span></td>
                        <td className="py-3 px-4 font-medium">{row.time}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5">
                            <button 
                              onClick={() => {
                                setSelectedPatient({ name: row.name, age: row.age, gender: row.gender, history: `Chief complaint: ${row.complaint}` });
                                setActiveTab('consultation');
                              }}
                              className="px-3 py-1.5 bg-secondary text-white rounded-xl text-[10px] font-bold shadow-sm hover:bg-[#00a892] transition-all"
                            >
                              Start
                            </button>
                            <button className="px-2 py-1.5 border border-accent/40 text-secondary rounded-xl text-[10px] font-bold hover:bg-accent/30 transition-all">
                              History
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ClayCard>
          </div>
        )}

        {/* ═══════════════════════ TAB: PATIENT EMR RECORDS ═══════════════════════ */}
        {activeTab === 'patients' && (
          <ClayCard className="p-6" hover={false}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-extrabold text-dark">Central EMR Database</h3>
              <input 
                type="text" 
                placeholder="Search patient by name, ID..." 
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="px-4 py-2 border border-accent/40 bg-accent/20 text-dark rounded-2xl text-xs outline-none focus:ring-2 focus:ring-secondary w-64 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 border-r border-accent/30 pr-6 space-y-3">
                <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">Patient Records</p>
                
                {[
                  { name: 'Patient Demo', age: '32', gender: 'Male', id: 'P-98402' },
                  { name: 'Rohan Sen', age: '45', gender: 'Male', id: 'P-98403' },
                  { name: 'Shreya Patel', age: '28', gender: 'Female', id: 'P-98404' }
                ].filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).map((p, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedPatient({ ...p, history: 'Hypertension, High Cholesterol, Penicillin allergy.' })}
                    className={`p-3.5 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${selectedPatient?.name === p.name ? 'bg-accent border-secondary/30 shadow-sm' : 'bg-accent/20 border-accent/15'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold text-xs">{p.name.charAt(0)}</div>
                      <div>
                        <h4 className="font-bold text-xs text-dark">{p.name}</h4>
                        <p className="text-[10px] text-secondary/60 mt-0.5">{p.id} • {p.gender} • {p.age} years</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 space-y-4">
                {selectedPatient ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-accent/20 border border-accent/15 rounded-2xl">
                      <h4 className="font-bold text-sm text-dark mb-3">Clinical Profile: {selectedPatient.name}</h4>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-secondary/70 font-medium">Record ID</span>
                          <p className="font-bold mt-1">{selectedPatient.id || 'P-98402'}</p>
                        </div>
                        <div>
                          <span className="text-secondary/70 font-medium">Gender/Age</span>
                          <p className="font-bold mt-1">{selectedPatient.gender} • {selectedPatient.age}y</p>
                        </div>
                        <div>
                          <span className="text-secondary/70 font-medium">Allergies</span>
                          <p className="font-bold text-red-500 mt-1">Penicillin</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-accent/35 rounded-2xl space-y-2">
                      <h4 className="font-bold text-xs text-dark">Medical History</h4>
                      <p className="text-xs text-secondary/80 leading-relaxed">{selectedPatient.history}</p>
                    </div>

                    {/* Vitals */}
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { label: 'Heart Rate', value: '72 bpm', color: 'text-red-500' },
                        { label: 'Blood Pressure', value: '120/80', color: 'text-blue-500' },
                        { label: 'Temperature', value: '98.6°F', color: 'text-amber-500' },
                        { label: 'SpO2', value: '98%', color: 'text-green-500' },
                      ].map((v, i) => (
                        <div key={i} className="p-3 bg-accent/20 border border-accent/15 rounded-2xl text-center">
                          <p className="text-[10px] text-gray-400 font-bold">{v.label}</p>
                          <p className={`text-sm font-black mt-1 ${v.color}`}>{v.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setActiveTab('consultation')} className="px-5 py-2.5 bg-secondary text-white rounded-2xl text-xs font-bold shadow hover:bg-[#00a892] transition-all">
                        Prescribe & Diagnose
                      </button>
                      <button onClick={() => alert("Downloading EMR history PDF...")} className="px-5 py-2.5 border border-accent/40 rounded-2xl text-xs font-bold text-secondary hover:bg-accent/40 transition-all">
                        Export EMR (PDF)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-accent/35 rounded-2xl">
                    <span className="text-4xl mb-2">📁</span>
                    <p className="text-xs text-secondary/60">Select a patient profile to review their medical file.</p>
                  </div>
                )}
              </div>
            </div>
          </ClayCard>
        )}

        {/* ═══════════════════════ TAB: CONSULTATION & PRESCRIPTION ═══════════════════════ */}
        {activeTab === 'consultation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Consultation Intake */}
            <ClayCard className="p-6 lg:col-span-2" hover={false}>
              <div className="flex justify-between items-center border-b border-accent/20 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-extrabold text-dark">Clinical Prescription Editor</h3>
                  {selectedPatient ? (
                    <span className="text-xs text-secondary font-semibold">Active Patient: {selectedPatient.name} ({selectedPatient.gender}, {selectedPatient.age}y)</span>
                  ) : (
                    <span className="text-xs text-red-500 font-semibold">No patient selected from EMR</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleAutoPrescription}
                    disabled={isCopilotPending}
                    className="px-4 py-2 bg-accent text-secondary rounded-2xl text-xs font-bold flex items-center gap-1.5 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    ✨ AI Autocomplete
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Clinical Diagnosis</label>
                  <input 
                    type="text"
                    value={consultationForm.diagnosis}
                    onChange={(e) => setConsultationForm({...consultationForm, diagnosis: e.target.value})}
                    placeholder="Enter final diagnosis..."
                    className="w-full text-xs px-4 py-3 border border-accent/40 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Prescription Details</label>
                  <textarea 
                    value={consultationForm.prescriptionText}
                    onChange={(e) => setConsultationForm({...consultationForm, prescriptionText: e.target.value})}
                    placeholder="Type drug dosage, duration, schedule (e.g. Tab. Paracetamol 500mg 1-0-1)..."
                    className="w-full text-xs h-32 p-4 bg-accent/20 border-none rounded-2xl focus:ring-2 focus:ring-secondary resize-none shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lab Referrals</label>
                    <select 
                      value={consultationForm.labTests}
                      onChange={(e) => setConsultationForm({...consultationForm, labTests: e.target.value})}
                      className="w-full text-xs px-4 py-3 border border-accent/40 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option>None</option>
                      <option>CBC (Complete Blood Count)</option>
                      <option>Fast Glucose & HbA1c</option>
                      <option>Lipid Panel Profile</option>
                      <option>Chest X-Ray</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Follow-up Date</label>
                    <input 
                      type="date"
                      value={consultationForm.followUp}
                      onChange={(e) => setConsultationForm({...consultationForm, followUp: e.target.value})}
                      className="w-full text-xs px-4 py-3 border border-accent/40 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lifestyle Advice / Remarks</label>
                  <input 
                    type="text"
                    value={consultationForm.advice}
                    onChange={(e) => setConsultationForm({...consultationForm, advice: e.target.value})}
                    placeholder="General advice (diet, activity)..."
                    className="w-full text-xs px-4 py-3 border border-accent/40 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <button 
                  onClick={() => {
                    alert("Prescription submitted, logged, and synchronized with Patient EMR.");
                    setConsultationForm({ diagnosis: '', prescriptionText: '', labTests: 'None', followUp: '', advice: '' });
                  }}
                  className="w-full py-3.5 bg-secondary text-white font-bold rounded-2xl shadow-md hover:bg-[#00a892] transition-all text-sm active:scale-[0.98]"
                >
                  🚀 SUBMIT CONSULTATION RECORD
                </button>
              </div>
            </ClayCard>

            {/* AI Diagnosis recommendations */}
            <ClayCard className="p-6 lg:col-span-1" hover={false}>
              <h3 className="text-sm font-extrabold text-dark mb-5">AI Diagnostic Assistant</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-accent/40 border border-secondary/20 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Suggested Diagnosis</h4>
                  <p className="text-xs text-dark font-semibold leading-relaxed">Based on chief complaint, AI suggests checking for <strong>Viral Bronchitis</strong> or <strong>Upper Respiratory Infection</strong>.</p>
                </div>

                <div className="p-4 bg-accent/30 border border-secondary/20 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-bold text-secondary uppercase tracking-wider">Risk Factors</h4>
                  <ul className="list-disc pl-4 text-xs text-dark space-y-1">
                    <li>Mild dehydration</li>
                    <li>Slight risk of secondary pneumonia due to cough duration</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Recommended Tests</h4>
                  <ul className="list-disc pl-4 text-xs text-dark space-y-1">
                    <li>Complete Blood Count (CBC)</li>
                    <li>Chest X-Ray PA View</li>
                    <li>CRP Test</li>
                  </ul>
                </div>

                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-2">
                  <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Drug Interaction Alert</h4>
                  <p className="text-xs text-dark font-medium">⚠️ Patient has <strong>Penicillin allergy</strong> on record. Avoid Amoxicillin group.</p>
                </div>
              </div>
            </ClayCard>
          </div>
        )}

        {/* ═══════════════════════ TAB: PRESCRIPTIONS ═══════════════════════ */}
        {activeTab === 'prescriptions' && (
          <ClayCard className="p-6" hover={false}>
            <h3 className="text-lg font-extrabold text-dark mb-4">Recent Prescriptions</h3>
            <p className="text-xs text-gray-400 mb-6">Manage and track all issued prescriptions.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Diagnosis</th>
                    <th className="py-3 px-4">Medicines</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  {[
                    { date: 'Jul 4, 2026', patient: 'Rohan Sen', diagnosis: 'Upper RTI', medicines: 'Amoxicillin, Paracetamol', status: 'Active', sColor: 'bg-green-100 text-green-700' },
                    { date: 'Jul 3, 2026', patient: 'Priya Sharma', diagnosis: 'Migraine', medicines: 'Sumatriptan, Ondansetron', status: 'Completed', sColor: 'bg-gray-100 text-gray-600' },
                    { date: 'Jul 2, 2026', patient: 'Anil Kumar', diagnosis: 'Type 2 Diabetes', medicines: 'Metformin, Glimepiride', status: 'Active', sColor: 'bg-green-100 text-green-700' },
                  ].map((rx, i) => (
                    <tr key={i} className="border-b border-accent/10 hover:bg-accent/15 transition-colors">
                      <td className="py-3 px-4 font-medium">{rx.date}</td>
                      <td className="py-3 px-4 font-bold">{rx.patient}</td>
                      <td className="py-3 px-4">{rx.diagnosis}</td>
                      <td className="py-3 px-4 text-gray-500">{rx.medicines}</td>
                      <td className="py-3 px-4"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${rx.sColor}`}>{rx.status}</span></td>
                      <td className="py-3 px-4">
                        <button className="px-3 py-1.5 border border-accent/40 text-secondary rounded-xl text-[10px] font-bold hover:bg-accent/30 transition-all">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClayCard>
        )}

        {/* ═══════════════════════ TAB: REVIEW AI REPORTS ═══════════════════════ */}
        {activeTab === 'medlens_review' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List to review */}
            <ClayCard className="p-6 lg:col-span-1" hover={false}>
              <h3 className="text-sm font-extrabold text-dark mb-4">Pending Lab Reports ({reportsToReview.length})</h3>
              <div className="space-y-3">
                {reportsToReview.length === 0 ? (
                  <p className="text-xs text-secondary/60 italic">No reports pending review.</p>
                ) : (
                  reportsToReview.map((rep) => (
                    <div 
                      key={rep.id} 
                      onClick={() => setSelectedReport(rep)}
                      className={`p-3.5 rounded-2xl border cursor-pointer hover:shadow-md transition-all ${selectedReport?.id === rep.id ? 'bg-accent border-secondary/30 shadow-sm' : 'bg-accent/20 border-accent/15'}`}
                    >
                      <h4 className="font-bold text-xs text-dark">{rep.patientName}</h4>
                      <p className="text-[10px] text-secondary/60 mt-1">{rep.reportType} • {rep.uploadDate}</p>
                    </div>
                  ))
                )}
              </div>
            </ClayCard>

            {/* Review Pane */}
            <ClayCard className="p-6 lg:col-span-2" hover={false}>
              <h3 className="text-sm font-extrabold text-dark mb-5">MedLens Verification Pane</h3>

              {selectedReport ? (
                <div className="space-y-4">
                  <div className="p-4 bg-accent/20 border border-accent/15 rounded-2xl text-xs space-y-2">
                    <p className="font-bold">Raw OCR Document Readout</p>
                    <p className="text-[10px] text-secondary/60 font-mono bg-white p-3 rounded-xl border border-accent/20">{selectedReport.ocrText}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-accent/35 border border-secondary/20 rounded-2xl">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">AI Report Summary</p>
                      <p className="text-xs text-dark leading-relaxed">{selectedReport.summary}</p>
                    </div>
                    <div className="p-4 bg-accent/20 border border-secondary/25 rounded-2xl">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Abnormal Findings</p>
                      <ul className="list-disc pl-4 text-xs text-dark space-y-1">
                        {selectedReport.abnormal.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 border border-accent/35 rounded-2xl">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Adjust Recommendations</label>
                    <textarea 
                      value={selectedReport.recommendations.join('\n')}
                      onChange={(e) => {
                        const recs = e.target.value.split('\n');
                        setSelectedReport({...selectedReport, recommendations: recs});
                      }}
                      className="w-full text-xs h-24 p-3 bg-accent/20 border-none rounded-2xl focus:ring-2 focus:ring-secondary resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApproveReport(selectedReport.id)}
                      className="px-5 py-2.5 bg-secondary text-white rounded-2xl text-xs font-bold shadow hover:bg-[#00a892] transition-all"
                    >
                      Approve & Log Report
                    </button>
                    <button 
                      onClick={() => setSelectedReport(null)}
                      className="px-5 py-2.5 border border-accent/40 rounded-2xl text-xs font-bold text-secondary hover:bg-accent/40 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-center border-2 border-dashed border-accent/35 rounded-2xl">
                  <span className="text-4xl mb-2">📋</span>
                  <p className="text-xs text-secondary/60">Select a pending lab report from the list to review, edit, and approve.</p>
                </div>
              )}
            </ClayCard>
          </div>
        )}

        {/* ═══════════════════════ TAB: LAB ORDERS ═══════════════════════ */}
        {activeTab === 'lab_orders' && (
          <ClayCard className="p-6" hover={false}>
            <h3 className="text-lg font-extrabold text-dark mb-4">Lab Test Orders</h3>
            <p className="text-xs text-gray-400 mb-6">Track all lab test orders and their status.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Test Type</th>
                    <th className="py-3 px-4">Ordered On</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  {[
                    { id: 'LO-4501', patient: 'Rohan Sen', test: 'CBC + ESR', date: 'Jul 4, 2026', status: 'In Progress', sColor: 'bg-blue-100 text-blue-700' },
                    { id: 'LO-4500', patient: 'Priya Sharma', test: 'Lipid Panel', date: 'Jul 3, 2026', status: 'Completed', sColor: 'bg-green-100 text-green-700' },
                    { id: 'LO-4499', patient: 'Anil Kumar', test: 'HbA1c + Fasting Glucose', date: 'Jul 3, 2026', status: 'Report Pending', sColor: 'bg-amber-100 text-amber-700' },
                  ].map((order, i) => (
                    <tr key={i} className="border-b border-accent/10 hover:bg-accent/15 transition-colors">
                      <td className="py-3 px-4 font-bold text-secondary">{order.id}</td>
                      <td className="py-3 px-4 font-bold">{order.patient}</td>
                      <td className="py-3 px-4">{order.test}</td>
                      <td className="py-3 px-4 font-medium">{order.date}</td>
                      <td className="py-3 px-4"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${order.sColor}`}>{order.status}</span></td>
                      <td className="py-3 px-4">
                        <button className="px-3 py-1.5 border border-accent/40 text-secondary rounded-xl text-[10px] font-bold hover:bg-accent/30 transition-all">View Report</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ClayCard>
        )}

        {/* ═══════════════════════ TAB: SCHEDULE & CALENDAR ═══════════════════════ */}
        {activeTab === 'schedules' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Availability and working hours config */}
            <ClayCard className="p-6" hover={false}>
              <h3 className="text-lg font-extrabold text-dark mb-5">Shift Manager & Attendance</h3>
              
              <div className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl border border-accent/15 mb-5">
                <div>
                  <span className="text-xs font-bold text-dark">Today's Attendance</span>
                  <p className="text-[10px] text-secondary/60">Status: {attendance?.status?.replace('_', ' ') || 'Loading...'}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => punchInMutation.mutate()}
                    disabled={attendance?.punch_in != null || attendance?.status === 'On_Leave'}
                    className="px-4 py-2.5 rounded-2xl text-[10px] font-bold transition-all shadow-md bg-secondary text-white hover:bg-[#00a892] disabled:opacity-50"
                  >
                    {attendance?.punch_in ? `IN: ${attendance.punch_in}` : 'PUNCH IN'}
                  </button>
                  <button 
                    onClick={() => punchOutMutation.mutate()}
                    disabled={!attendance?.punch_in || attendance?.punch_out != null}
                    className="px-4 py-2.5 rounded-2xl text-[10px] font-bold transition-all shadow-md bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {attendance?.punch_out ? `OUT: ${attendance.punch_out}` : 'PUNCH OUT'}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Today's Shifts</span>
                <div className="space-y-3 mb-5">
                  {shifts?.map((s: any) => (
                    <div key={s.id} className="flex justify-between items-center p-3 bg-accent/20 border border-accent/15 rounded-2xl">
                      <div>
                        <p className="text-sm font-black text-dark">{s.start_time} - {s.end_time}</p>
                        <p className="text-[10px] text-gray-500 font-bold mt-1">Queue: {s.current_queue} / {s.max_appointments}</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        {s.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[9px] font-bold">ACTIVE</span>
                        ) : (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[9px] font-bold">DISABLED</span>
                        )}
                        <button 
                          onClick={async () => {
                            if (confirm('Delete this shift?')) {
                              await api.delete(`/doctor/shifts/${s.id}`);
                              queryClient.invalidateQueries({ queryKey: ['doctorShifts'] });
                            }
                          }}
                          className="text-red-500 hover:text-red-700 px-2 text-lg font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                  {(!shifts || shifts.length === 0) && <p className="text-xs text-gray-400">No shifts today.</p>}
                </div>

                <form onSubmit={handleShiftSubmit} className="flex items-end gap-2 p-3 bg-accent/10 rounded-2xl border border-accent/20">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Start</label>
                    <input type="time" value={shiftForm.start} onChange={e => setShiftForm({...shiftForm, start: e.target.value})} className="w-full text-xs px-2 py-1.5 border border-accent/40 rounded-xl" required />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">End</label>
                    <input type="time" value={shiftForm.end} onChange={e => setShiftForm({...shiftForm, end: e.target.value})} className="w-full text-xs px-2 py-1.5 border border-accent/40 rounded-xl" required />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase">Max</label>
                    <input type="number" value={shiftForm.max} onChange={e => setShiftForm({...shiftForm, max: parseInt(e.target.value)})} className="w-full text-xs px-2 py-1.5 border border-accent/40 rounded-xl" required />
                  </div>
                  <button type="submit" className="px-3 py-1.5 bg-secondary text-white font-bold rounded-xl text-xs hover:bg-[#00a892] h-[30px]">Add</button>
                </form>
              </div>
            </ClayCard>

            <div className="space-y-6">
              {/* Leave Requests form */}
              <ClayCard className="p-6" hover={false}>
                <h3 className="text-lg font-extrabold text-dark mb-5">Request Leave / Out of Office</h3>
                <form onSubmit={handleLeaveSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Select Leave Date</label>
                    <input type="date" value={leaveForm.date} onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})} className="w-full text-xs px-4 py-3 border border-accent/40 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-secondary" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Reason</label>
                    <input type="text" value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} placeholder="Medical, Personal..." className="w-full text-xs px-4 py-3 border border-accent/40 rounded-2xl bg-white outline-none focus:ring-2 focus:ring-secondary" required />
                  </div>
                  <button type="submit" className="w-full py-3 bg-secondary hover:bg-[#00a892] text-white font-bold rounded-2xl shadow-md text-sm transition-all active:scale-[0.98]">
                    Submit Leave Request
                  </button>
                </form>

                <div className="mt-5 space-y-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Recent Requests</span>
                  <div className="max-h-40 overflow-y-auto pr-2 space-y-2">
                    {leaves?.map((l: any) => (
                      <div key={l.id} className="flex justify-between p-2 text-xs border-b border-accent/20">
                        <span>{l.leave_date} - {l.reason}</span>
                        <span className={`font-bold ${l.status === 'Approved' ? 'text-green-500' : l.status === 'Rejected' ? 'text-red-500' : 'text-amber-500'}`}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </ClayCard>
            </div>
          </div>
        )}

        {/* ═══════════════════════ TAB: MY PROFILE ═══════════════════════ */}
        {activeTab === 'my_profile' && (
          <ClayCard className="p-8" hover={false}>
            <div className="flex items-center gap-6 mb-8">
              <div className="relative group cursor-pointer w-24 h-24">
                <div className="w-full h-full bg-secondary/10 rounded-3xl flex items-center justify-center text-secondary font-black text-3xl shadow-clay overflow-hidden border-2 border-secondary/20">
                  {profile?.photo_url ? (
                    <img src={`http://localhost:5000${profile.photo_url}`} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    "D"
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold">
                  <span>Upload Photo</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              
              <div>
                <h2 className="text-2xl font-extrabold text-dark">Dr. {profile?.username || 'Demo Doctor'}</h2>
                <p className="text-sm text-gray-400 font-medium">{profile?.department || 'General Medicine'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${profile?.is_on_leave ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                  <span className={`text-xs font-bold ${profile?.is_on_leave ? 'text-orange-600' : 'text-green-600'}`}>
                    {profile?.is_on_leave ? 'On Leave Today' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[
                { label: 'Hospital', value: profile?.hospital || 'City General Hospital' },
                { label: 'Department', value: profile?.department || 'General Medicine' },
                { label: 'License No.', value: 'MCI-287364' },
                { label: 'Experience', value: '12 Years' },
                { label: 'Patients Treated', value: '15,200+' },
                { label: 'Rating', value: '4.8 / 5.0' },
                { label: 'Languages', value: 'English, Hindi, Telugu' },
                { label: 'Joined', value: 'Jan 2015' },
              ].map((item, i) => (
                <div key={i} className="p-4 bg-accent/20 border border-accent/15 rounded-2xl">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm font-bold text-dark mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </ClayCard>
        )}

        {/* ═══════════════════════ TAB: ANALYTICS ═══════════════════════ */}
        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Consultations (This Month)', value: '142', change: '+12%', color: 'text-secondary' },
              { label: 'Average Consultation Time', value: '18 min', change: '-2 min', color: 'text-blue-500' },
              { label: 'Patient Satisfaction', value: '4.8/5', change: '+0.2', color: 'text-amber-500' },
              { label: 'Follow-up Compliance', value: '89%', change: '+5%', color: 'text-green-500' },
            ].map((stat, i) => (
              <ClayCard key={i} className="p-5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-green-500 font-bold mt-1">{stat.change} vs last month</p>
              </ClayCard>
            ))}
          </div>
        )}

        {/* ═══════════════════════ TAB: MESSAGES ═══════════════════════ */}
        {activeTab === 'messages' && (
          <ClayCard className="p-6" hover={false}>
            <h3 className="text-lg font-extrabold text-dark mb-5">Messages</h3>
            <div className="space-y-3">
              {[
                { from: 'Rohan Sen', message: 'Doctor, should I continue the cough syrup? Feeling better now.', time: '10 mins ago', unread: true },
                { from: 'Priya Sharma', message: 'Thank you for the prescription. I have a follow-up question about the diet.', time: '1 hour ago', unread: true },
                { from: 'Lab Department', message: 'Blood report for Patient MC-2943 is ready for review.', time: '2 hours ago', unread: false },
              ].map((msg, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${msg.unread ? 'bg-accent/30 border-secondary/20' : 'bg-white border-accent/15'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-bold text-xs">{msg.from.charAt(0)}</div>
                      <div>
                        <p className="text-xs font-bold text-dark">{msg.from}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{msg.time}</p>
                      </div>
                    </div>
                    {msg.unread && <span className="w-2.5 h-2.5 bg-secondary rounded-full flex-shrink-0"></span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">{msg.message}</p>
                </div>
              ))}
            </div>
          </ClayCard>
        )}

        {/* ═══════════════════════ TAB: SETTINGS ═══════════════════════ */}
        {activeTab === 'settings' && (
          <ClayCard className="p-6" hover={false}>
            <h3 className="text-lg font-extrabold text-dark mb-6">Settings</h3>
            <div className="space-y-5">
              {[
                { label: 'Notification Preferences', desc: 'Configure alerts for appointments, lab results, and emergencies.' },
                { label: 'Display & Accessibility', desc: 'Large text, high contrast mode, voice navigation.' },
                { label: 'Language Preferences', desc: 'Set your preferred language for the interface.' },
                { label: 'Digital Signature', desc: 'Manage your digital signature for prescriptions and certificates.' },
                { label: 'Telemedicine Settings', desc: 'Configure video consultation preferences.' },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-accent/20 border border-accent/15 rounded-2xl hover:bg-accent/30 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-dark">{setting.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{setting.desc}</p>
                  </div>
                  <button className="px-4 py-2 border border-accent/40 text-secondary rounded-2xl text-xs font-bold hover:bg-secondary hover:text-white transition-all">
                    Configure
                  </button>
                </div>
              ))}
            </div>
          </ClayCard>
        )}

        {/* ═══════════════════════ TAB: AI PREDICTIONS ═══════════════════════ */}
        {activeTab === 'ai_predictions' && (
          <div className="space-y-6">
            <h3 className="text-xl font-extrabold text-dark flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-sm">🤖</span>
              AI-Powered Clinical Intelligence
            </h3>

            {/* AI Load Prediction */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ClayCard className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">📊</div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Today's Predicted Load</p>
                    <p className="text-2xl font-extrabold text-dark">{aiLoadData?.expected_appointments || '--'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Expected no-shows: <span className="text-red-500 font-bold">{aiLoadData?.expected_no_shows || '--'}</span></p>
                <div className={`mt-2 px-3 py-1 rounded-lg text-xs font-bold inline-block ${aiLoadData?.estimated_load === 'High' ? 'bg-red-100 text-red-700' : aiLoadData?.estimated_load === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {aiLoadData?.estimated_load || 'N/A'} Load Day
                </div>
              </ClayCard>

              <ClayCard className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold">✅</div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Expected Show-ups</p>
                    <p className="text-2xl font-extrabold text-dark">{aiLoadData?.expected_show_ups || '--'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Day: <span className="font-bold text-dark">{aiLoadData?.day_of_week || '--'}</span></p>
              </ClayCard>

              <ClayCard className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold">🔮</div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">AI Confidence</p>
                    <p className="text-2xl font-extrabold text-dark">87%</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400">Model: <span className="font-bold text-secondary">Appointment Ensemble</span></p>
              </ClayCard>
            </div>

            {/* 7-Day Footfall Forecast */}
            <ClayCard className="p-6" hover={false}>
              <h4 className="text-md font-extrabold text-dark mb-4">📈 7-Day Patient Footfall Forecast</h4>
              {aiFootfallData?.predictions ? (
                <div className="grid grid-cols-7 gap-3">
                  {aiFootfallData.predictions.map((day: any, i: number) => (
                    <div key={i} className="text-center p-3 rounded-2xl bg-accent/30 border border-accent/20">
                      <p className="text-[10px] font-bold text-gray-400">{day.day?.slice(0, 3)}</p>
                      <p className="text-lg font-extrabold text-dark mt-1">{day.expected}</p>
                      <p className="text-[10px] text-red-400 font-medium">-{day.no_shows} NS</p>
                      <div className={`mt-2 px-2 py-0.5 rounded-lg text-[9px] font-bold ${day.load === 'High' ? 'bg-red-100 text-red-600' : day.load === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        {day.load}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Loading forecast data...</p>
              )}
            </ClayCard>

            {/* AI Diagnosis Support */}
            <ClayCard className="p-6" hover={false}>
              <h4 className="text-md font-extrabold text-dark mb-4">🩺 AI Clinical Decision Support</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { patient: 'Rohan Sen', risk: 'High', diagnosis: 'Type 2 Diabetes (suspected)', specialist: 'Endocrinologist', score: 92 },
                  { patient: 'Priya Sharma', risk: 'Medium', diagnosis: 'Hyperlipidemia', specialist: 'Cardiologist', score: 78 },
                  { patient: 'Anil Kumar', risk: 'Low', diagnosis: 'Seasonal Allergies', specialist: 'General Physician', score: 65 },
                  { patient: 'Neha Patel', risk: 'Medium', diagnosis: 'Migraine (recurrent)', specialist: 'Neurologist', score: 81 },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-accent/20 border border-accent/15">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-dark">{item.patient}</p>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${item.risk === 'High' ? 'bg-red-100 text-red-600' : item.risk === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                        {item.risk} Risk
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Suggested: <span className="font-bold text-secondary">{item.diagnosis}</span></p>
                    <p className="text-[10px] text-gray-400 mt-1">Refer to: {item.specialist} • Confidence: {item.score}%</p>
                  </div>
                ))}
              </div>
            </ClayCard>

          </div>
        )}



        <PatientDetailsModal 
          patient={selectedPatient}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
