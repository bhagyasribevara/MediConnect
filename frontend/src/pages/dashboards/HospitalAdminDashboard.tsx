import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { io } from 'socket.io-client';

// Icons as inline SVGs
const OverviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
);
const StaffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);
const InventoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);
const LabIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v1.244c0 .594-.236 1.164-.656 1.584L4.72 10.306a4.5 4.5 0 00-.77 5.2l.27.464a4.5 4.5 0 005.15 1.954m6.88-14.82v1.244c0 .594.236 1.164.656 1.584l4.374 4.374a4.5 4.5 0 01.77 5.2l-.27.464a4.5 4.5 0 01-5.15 1.954M12 21H3.75m0 0V3.75m0 17.25h16.5M12 3.75h3.75" />
  </svg>
);
const BedsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);
const ScheduleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const BloodIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a5.006 5.006 0 005-5c0-1.8-1.5-3.8-5-7.5-3.5 3.7-5 5.7-5 7.5a5.006 5.006 0 005 5z" />
  </svg>
);
const ApprovalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
);

const adminTabs = [
  { id: 'overview', label: 'Hospital Overview', icon: <OverviewIcon /> },
  { id: 'doctors', label: 'Doctors & Staff Roster', icon: <StaffIcon /> },
  { id: 'inventory', label: 'Pharmacy Inventory', icon: <InventoryIcon /> },
  { id: 'lab', label: 'Laboratory Services', icon: <LabIcon /> },
  { id: 'beds', label: 'Bed Management', icon: <BedsIcon /> },
  { id: 'appointments', label: 'Appointments Book', icon: <ScheduleIcon /> },
  { id: 'blood', label: 'Blood Reserves', icon: <BloodIcon /> },
  { id: 'approvals', label: 'Workflow Approvals', icon: <ApprovalIcon /> },
];

export default function HospitalAdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Modals & form states
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorForm, setDoctorForm] = useState({ name: '', department: 'Cardiology', shifts: 'Morning (09am - 05pm)', phone: '' });
  const [doctorsList, setDoctorsList] = useState<any[]>([
    { id: 1, name: 'Dr. Sarah Connor', department: 'Cardiology', shifts: 'Morning', phone: '1234567890', duty: 'On Duty' },
    { id: 2, name: 'Dr. Stephen Strange', department: 'Neurology', shifts: 'Evening', phone: '9876543210', duty: 'On Duty' }
  ]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ medicine_name: 'Paracetamol 500mg', requested_quantity: 1000 });
  const [procurements, setProcurements] = useState<any[]>([
    { id: 201, medicine: 'Paracetamol 500mg', qty: 1000, status: 'Approved' },
    { id: 202, medicine: 'ORS Sachets', qty: 500, status: 'Pending Approval' }
  ]);

  const [isBedAllocationOpen, setIsBedAllocationOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<number | null>(null);
  const [bedAllocationForm, setBedAllocationForm] = useState({ patientName: '', wardType: 'General' });

  // Bed Grid array
  const [bedsGrid, setBedsGrid] = useState<Array<{ id: number; type: 'General' | 'ICU' | 'Emergency'; occupied: boolean; patient?: string }>>([
    { id: 1, type: 'ICU', occupied: true, patient: 'Aarav Kumar' },
    { id: 2, type: 'ICU', occupied: false },
    { id: 3, type: 'General', occupied: true, patient: 'Priya Sharma' },
    { id: 4, type: 'General', occupied: false },
    { id: 5, type: 'Emergency', occupied: false },
    { id: 6, type: 'Emergency', occupied: true, patient: 'Patient Demo' }
  ]);

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
    socket.on('inventory_approved', (data) => {
      setProcurements(prev => prev.map(p => p.medicine === data.medicine ? { ...p, status: 'Approved' } : p));
    });
    socket.on('slot_updated', () => queryClient.invalidateQueries({ queryKey: ['hospitalStats'] }));
    socket.on('queue_updated', () => queryClient.invalidateQueries({ queryKey: ['hospitalStats'] }));

    return () => { socket.disconnect(); };
  }, [queryClient]);
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['hospitalAdminMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/hospitaladmin');
      return res.data.metrics;
    }
  });

  const requestStockMutation = useMutation({
    mutationFn: async (payload: { medicine_name: string; requested_quantity: number }) => {
      return api.post('/inventory/requests', payload);
    },
    onSuccess: () => {
      setIsRequestModalOpen(false);
      setProcurements(prev => [{ id: Date.now(), medicine: requestForm.medicine_name, qty: requestForm.requested_quantity, status: 'Pending Approval' }, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['hospitalAdminMetrics'] });
    }
  });

  const handleAddDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    setDoctorsList(prev => [...prev, { id: Date.now(), name: doctorForm.name, department: doctorForm.department, shifts: doctorForm.shifts, phone: doctorForm.phone, duty: 'On Duty' }]);
    setIsDoctorModalOpen(false);
    setDoctorForm({ name: '', department: 'Cardiology', shifts: 'Morning (09am - 05pm)', phone: '' });
  };

  const handleApproveAppointment = (id: number) => {
    alert("Appointment successfully approved!");
  };

  const handleAllocateBedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBed !== null) {
      setBedsGrid(prev => prev.map(b => b.id === selectedBed ? { ...b, occupied: true, patient: bedAllocationForm.patientName, type: bedAllocationForm.wardType as any } : b));
      setIsBedAllocationOpen(false);
      setBedAllocationForm({ patientName: '', wardType: 'General' });
      setSelectedBed(null);
    }
  };

  return (
    <DashboardLayout 
      title="Hospital Facility Administration" 
      role="HospitalAdmin" 
      tabs={adminTabs} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="space-y-6">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Total Facility Beds</h3>
                <p className="text-3xl font-extrabold text-dark mt-1">{isLoading ? '...' : metrics?.total_beds || 0}</p>
                <span className="text-[10px] text-secondary/60 font-medium">Across all wards</span>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Available Beds</h3>
                <p className="text-3xl font-extrabold text-secondary mt-1">{isLoading ? '...' : metrics?.available_beds || 0}</p>
                <span className="text-[10px] text-secondary font-bold">Ready for intake</span>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Active Staff</h3>
                <p className="text-3xl font-extrabold text-blue-500 mt-1">{isLoading ? '...' : metrics?.doctors_on_duty || 0}</p>
                <span className="text-[10px] text-secondary/60 font-medium">On-duty rosters checked</span>
              </div>
              <div className="p-6 bg-secondary text-white rounded-2xl shadow-clay border border-secondary flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold mb-1 uppercase tracking-wider">Hospital Revenue</h3>
                  <p className="text-2xl font-black mt-2">₹1,45,200</p>
                  <p className="text-[10px] opacity-80 mt-1">Total revenue collected today</p>
                </div>
              </div>
            </div>

            {/* AI Insights Block */}
            <div className="p-6 bg-accent/35 border border-secondary/20 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-secondary">AI Facility & Resource Forecasts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-dark">
                <div className="p-4 bg-white rounded-xl shadow-sm border border-accent/25 space-y-1">
                  <span className="text-[10px] font-bold text-secondary/60">PATIENT ADMISSION INTAKE</span>
                  <p className="font-bold">Estimated 15% increase next week</p>
                  <p className="text-secondary/60 text-[10px]">Due to local seasonal flu changes</p>
                </div>
                <div className="p-4 bg-white rounded-xl shadow-sm border border-accent/25 space-y-1">
                  <span className="text-[10px] font-bold text-secondary/60">BED CAPACITY ALLOCATION</span>
                  <p className="font-bold text-orange-500">ICU Bed Shortage Alert</p>
                  <p className="text-secondary/60 text-[10px]">Expected 90% utilization by Friday</p>
                </div>
                <div className="p-4 bg-white rounded-xl shadow-sm border border-accent/25 space-y-1">
                  <span className="text-[10px] font-bold text-secondary/60">PHARMACY INVENTORY DEMAND</span>
                  <p className="font-bold text-secondary">ORS sachets high turnover</p>
                  <p className="text-secondary/60 text-[10px]">Order 500 additional sachets soon</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCTORS & STAFF ROSTER */}
        {activeTab === 'doctors' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-dark">Facility Roster</h3>
              <button 
                onClick={() => setIsDoctorModalOpen(true)}
                className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow hover:bg-[#00a892] transition-colors"
              >
                + Register Doctor
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                    <th className="py-2.5 px-4 font-semibold">Doctor Name</th>
                    <th className="py-2.5 px-4 font-semibold">Specialization</th>
                    <th className="py-2.5 px-4 font-semibold">Roster Shift</th>
                    <th className="py-2.5 px-4 font-semibold">Duty</th>
                    <th className="py-2.5 px-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  {doctorsList.map((doc) => (
                    <tr key={doc.id} className="border-b border-accent/15 hover:bg-accent/10">
                      <td className="py-2.5 px-4 font-bold text-dark">{doc.name}</td>
                      <td className="py-2.5 px-4 text-secondary/70">{doc.department}</td>
                      <td className="py-2.5 px-4">{doc.shifts}</td>
                      <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px]">{doc.duty}</span></td>
                      <td className="py-2.5 px-4">
                        <button onClick={() => setDoctorsList(prev => prev.filter(d => d.id !== doc.id))} className="text-red-500 hover:underline font-bold">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PHARMACY INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-dark">Pharmacy Stock Ledger</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsRequestModalOpen(true)}
                  className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow hover:bg-[#00a892]"
                >
                  Request Procurement
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                    <th className="py-2.5 px-4 font-semibold">Medicine Name</th>
                    <th className="py-2.5 px-4 font-semibold">Batch Number</th>
                    <th className="py-2.5 px-4 font-semibold">Expiration Date</th>
                    <th className="py-2.5 px-4 font-semibold">Stock Quantity</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  <tr className="border-b border-accent/15">
                    <td className="py-2.5 px-4 font-bold text-dark">Paracetamol 500mg</td>
                    <td className="py-2.5 px-4 font-mono text-secondary/60">B-940284</td>
                    <td className="py-2.5 px-4 text-secondary/70">2027-12-01</td>
                    <td className="py-2.5 px-4 font-bold">5,400 units</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px]">Good</span></td>
                  </tr>
                  <tr className="border-b border-accent/15">
                    <td className="py-2.5 px-4 font-bold text-dark">Amoxicillin 250mg</td>
                    <td className="py-2.5 px-4 font-mono text-secondary/60">B-940290</td>
                    <td className="py-2.5 px-4 text-secondary/70">2026-08-15</td>
                    <td className="py-2.5 px-4 font-bold text-yellow-600">120 units</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-bold text-[10px]">Low stock</span></td>
                  </tr>
                  <tr className="border-b border-accent/15">
                    <td className="py-2.5 px-4 font-bold text-dark">ORS Hydration Powder</td>
                    <td className="py-2.5 px-4 font-mono text-secondary/60">B-839212</td>
                    <td className="py-2.5 px-4 text-secondary/70">2026-07-28</td>
                    <td className="py-2.5 px-4 font-bold text-red-500">45 units</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-red-100 text-red-700 rounded font-bold text-[10px]">Expiry Warning</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: LABORATORY SERVICES */}
        {activeTab === 'lab' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <h3 className="text-sm font-bold text-dark">Laboratory Diagnostic Queue</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                    <th className="py-2.5 px-4 font-semibold">Test Type</th>
                    <th className="py-2.5 px-4 font-semibold">Patient Name</th>
                    <th className="py-2.5 px-4 font-semibold">Lab Machine Status</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  <tr className="border-b border-accent/15">
                    <td className="py-2.5 px-4 font-bold text-dark">CBC Analysis</td>
                    <td className="py-2.5 px-4">John Watson</td>
                    <td className="py-2.5 px-4 text-green-500 font-semibold">Calibration Good</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded font-bold text-[10px]">Processing</span></td>
                    <td className="py-2.5 px-4"><button onClick={() => alert("Simulating lab machine diagnostic run...")} className="text-secondary hover:underline font-bold">Run Diagnostic</button></td>
                  </tr>
                  <tr className="border-b border-accent/15">
                    <td className="py-2.5 px-4 font-bold text-dark">Fasting Glucose</td>
                    <td className="py-2.5 px-4">Aarav Kumar</td>
                    <td className="py-2.5 px-4 text-green-500 font-semibold">Calibration Good</td>
                    <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px]">Completed</span></td>
                    <td className="py-2.5 px-4"><button className="text-secondary/40 cursor-not-allowed font-bold" disabled>Done</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BED MANAGEMENT */}
        {activeTab === 'beds' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-dark">Facility Ward Layout Grid</h3>
              <p className="text-xs text-secondary/65 font-semibold">Select an empty bed slot to register/allocate a patient.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {bedsGrid.map((bed) => (
                <div 
                  key={bed.id}
                  onClick={() => {
                    if (!bed.occupied) {
                      setSelectedBed(bed.id);
                      setIsBedAllocationOpen(true);
                    } else {
                      alert(`Bed MC-${bed.id} allocated to patient: ${bed.patient}`);
                    }
                  }}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow ${
                    bed.occupied ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <span className="text-2xl mb-1">🛏️</span>
                  <span className={`text-[10px] font-bold uppercase ${bed.occupied ? 'text-red-500' : 'text-green-500'}`}>
                    {bed.occupied ? 'Occupied' : 'Allocate'}
                  </span>
                  <span className="text-xs font-bold text-dark mt-1">MC-{bed.id}</span>
                  <span className="text-[9px] text-secondary/60">{bed.type}</span>
                </div>
              ))}
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
                <button type="submit" className="px-6 py-2 bg-secondary text-white font-bold rounded-xl shadow hover:bg-[#00a892]">
                  Add Donor record
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 8: WORKFLOW APPROVALS */}
        {activeTab === 'approvals' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <h3 className="text-sm font-bold text-dark">Active Procurement Requests</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                    <th className="py-2.5 px-4 font-semibold">Request ID</th>
                    <th className="py-2.5 px-4 font-semibold">Item Requested</th>
                    <th className="py-2.5 px-4 font-semibold">Quantity</th>
                    <th className="py-2.5 px-4 font-semibold">Approval Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  {procurements.map((proc) => (
                    <tr key={proc.id} className="border-b border-accent/15">
                      <td className="py-2.5 px-4 font-mono font-bold">PR-{proc.id}</td>
                      <td className="py-2.5 px-4 font-bold text-dark">{proc.medicine}</td>
                      <td className="py-2.5 px-4">{proc.qty} units</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${proc.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {proc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}
      {isDoctorModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-accent/30 shadow-2xl">
            <h3 className="text-base font-extrabold text-dark mb-4">Register Roster Doctor</h3>
            <form onSubmit={handleAddDoctor} className="space-y-4 text-xs">
              <div>
                <label className="block text-secondary/60 font-bold mb-1">Full Name</label>
                <input 
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm({...doctorForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                  required 
                />
              </div>
              <div>
                <label className="block text-secondary/60 font-bold mb-1">Department</label>
                <select 
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm({...doctorForm, department: e.target.value})}
                  className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                >
                  <option>Cardiology</option>
                  <option>Neurology</option>
                  <option>Pathology</option>
                  <option>Radiology</option>
                </select>
              </div>
              <div className="flex gap-2.5 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsDoctorModalOpen(false)}
                  className="px-4 py-2 border border-accent/40 rounded-xl font-bold text-secondary hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-secondary text-white rounded-xl font-bold shadow hover:bg-[#00a892]"
                >
                  Save Roster
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Procurement Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-accent/30 shadow-2xl">
            <h3 className="text-base font-extrabold text-dark mb-4">Request Stock Procurement</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                requestStockMutation.mutate({ medicine_name: requestForm.medicine_name, requested_quantity: requestForm.requested_quantity });
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-secondary/60 font-bold mb-1">Medicine Name</label>
                <input 
                  type="text"
                  value={requestForm.medicine_name}
                  onChange={(e) => setRequestForm({...requestForm, medicine_name: e.target.value})}
                  className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                  required 
                />
              </div>
              <div>
                <label className="block text-secondary/60 font-bold mb-1">Quantity Requested</label>
                <input 
                  type="number"
                  value={requestForm.requested_quantity}
                  onChange={(e) => setRequestForm({...requestForm, requested_quantity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                  required 
                />
              </div>
              <div className="flex gap-2.5 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 border border-accent/40 rounded-xl font-bold text-secondary hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={requestStockMutation.isPending}
                  className="px-4 py-2 bg-secondary text-white rounded-xl font-bold shadow hover:bg-[#00a892]"
                >
                  {requestStockMutation.isPending ? 'Requesting...' : 'Request Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Bed Allocation Modal */}
      {isBedAllocationOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-accent/30 shadow-2xl">
            <h3 className="text-base font-extrabold text-dark mb-4">Allocate Bed Ward MC-{selectedBed}</h3>
            <form onSubmit={handleAllocateBedSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-secondary/60 font-bold mb-1">Patient Name</label>
                <input 
                  type="text"
                  value={bedAllocationForm.patientName}
                  onChange={(e) => setBedAllocationForm({...bedAllocationForm, patientName: e.target.value})}
                  className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                  required 
                />
              </div>
              <div>
                <label className="block text-secondary/60 font-bold mb-1">Ward Category</label>
                <select 
                  value={bedAllocationForm.wardType}
                  onChange={(e) => setBedAllocationForm({...bedAllocationForm, wardType: e.target.value})}
                  className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                >
                  <option>General</option>
                  <option>ICU</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div className="flex gap-2.5 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsBedAllocationOpen(false); setSelectedBed(null); }}
                  className="px-4 py-2 border border-accent/40 rounded-xl font-bold text-secondary hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-secondary text-white rounded-xl font-bold shadow hover:bg-[#00a892]"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
