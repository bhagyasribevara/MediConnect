import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';

// Icons as inline SVGs
const OverviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
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
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.684A1.125 1.125 0 003 6.69v11.834c0 .426.241.817.622 1.006l4.875 2.437c.381.19.821.19 1.202 0l3.802-1.901a1.125 1.125 0 011.006 0z" />
  </svg>
);
const ReportsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5A3.375 3.375 0 0010.125 2.25H9.75m0 18.75h-2.12c-.732 0-1.4-.417-1.724-1.074L3 15.031m0 0l2.25 2.25M3 15.031l2.25-2.25" />
  </svg>
);

const districtTabs = [
  { id: 'overview', label: 'District Overview', icon: <OverviewIcon /> },
  { id: 'facilities', label: 'Registered Facilities', icon: <FacilitiesIcon /> },
  { id: 'redistribution', label: 'Resource Redistribution', icon: <TransferIcon /> },
  { id: 'outbreaks', label: 'Outbreak Monitoring', icon: <OutbreakIcon /> },
  { id: 'reports', label: 'District Reports', icon: <ReportsIcon /> },
];

const mockChartData = [
  { name: 'Jan', cases: 400 },
  { name: 'Feb', cases: 300 },
  { name: 'Mar', cases: 550 },
  { name: 'Apr', cases: 450 },
  { name: 'May', cases: 700 },
  { name: 'Jun', cases: 650 },
];

export default function DistrictAdminDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirection shipping orders
  const [redistributions, setRedistributions] = useState<any[]>([
    { id: 501, item: 'Oxygen Cylinders', qty: 50, from: 'City General Hospital', to: 'Primary Health Center Block A', status: 'Pending Approval' },
    { id: 502, item: 'ORS Sachets', qty: 300, from: 'Community Health Center Central', to: 'Primary Health Center Block B', status: 'Approved & Shipped' }
  ]);

  // Registered facilities EMR
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [facilityForm, setFacilityForm] = useState({ name: '', type: 'Hospital', beds: 10, compliance: 95 });
  const [facilitiesList, setFacilitiesList] = useState<any[]>([
    { id: 1, name: 'City General Hospital', type: 'Hospital', beds: 18, compliance: 98, load: 'High' },
    { id: 2, name: 'Primary Health Center Block A', type: 'PHC', beds: 5, compliance: 92, load: 'Medium' },
    { id: 3, name: 'Community Health Center Central', type: 'CHC', beds: 12, compliance: 94, load: 'Low' }
  ]);

  // Outbreak predictions
  const [activeOutbreaks] = useState<any[]>([
    { region: 'Sector 3 (City East)', disease: 'Dengue Outbreak', risk: 'High', details: '20% surge forecast next week.' },
    { region: 'Block 2 (Rural West)', disease: 'Malaria Risk', risk: 'Medium', details: 'Slight case uptick due to waterlogging.' }
  ]);

  // Sync real-time socket events
  useEffect(() => {
    const socket = io('http://127.0.0.1:5000');
    socket.on('new_inventory_request', (data) => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      setRedistributions(prev => [
        { id: Date.now(), item: data.medicine, qty: data.quantity, from: 'District Central Stock', to: data.hospital, status: 'Pending Approval' },
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

  const { data: pendingRequests, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['pendingRequests'],
    queryFn: async () => {
      const res = await api.get('/inventory/requests');
      return res.data.requests;
    }
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.post(`/inventory/requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
      alert("Transfer approved. Sync payload broadcasted to hospital stock.");
    }
  });

  const handleRegisterFacility = (e: React.FormEvent) => {
    e.preventDefault();
    setFacilitiesList(prev => [...prev, { id: Date.now(), name: facilityForm.name, type: facilityForm.type, beds: facilityForm.beds, compliance: facilityForm.compliance, load: 'Low' }]);
    setIsFacilityModalOpen(false);
    setFacilityForm({ name: '', type: 'Hospital', beds: 10, compliance: 95 });
  };

  const handleApproveRedistribute = (id: number) => {
    setRedistributions(prev => prev.map(r => r.id === id ? { ...r, status: 'Approved & Shipped' } : r));
    alert("Resource redistribution workflow approved. Hospital stocks scheduled for transfer.");
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Hospitals & Clinics</h3>
                <p className="text-3xl font-extrabold text-dark mt-1">{isMetricsLoading ? '...' : metrics?.total_hospitals || 0}</p>
                <span className="text-[10px] text-secondary/60 font-medium">Under active surveillance</span>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">District Bed Capacity</h3>
                <p className="text-3xl font-extrabold text-dark mt-1">{isMetricsLoading ? '...' : metrics?.total_district_beds || 0}</p>
                <span className="text-[10px] text-secondary/60 font-medium">Total registered units</span>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Available Beds</h3>
                <p className="text-3xl font-extrabold text-secondary mt-1">{isMetricsLoading ? '...' : metrics?.available_beds || 0}</p>
                <span className="text-[10px] text-secondary font-bold">Unoccupied beds</span>
              </div>
              <div className="p-6 bg-accent/25 text-secondary rounded-2xl shadow-clay border border-secondary/20">
                <h3 className="text-xs font-bold mb-1 uppercase tracking-wider">AI Outbreak Forecast</h3>
                <p className="text-base font-extrabold mt-1">High Risk - Dengue</p>
                <p className="text-[10px] opacity-80 leading-relaxed mt-1">Expected 20% case surge next week in Sector 3.</p>
              </div>
            </div>

            {/* Disease charts */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
              <h3 className="text-sm font-bold text-dark mb-4">Outbreak Case Incidence Rate</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00BFA6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00BFA6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBF8F6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#00BFA6', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#00BFA6', fontSize: 10}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="cases" stroke="#00BFA6" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REGISTERED FACILITIES */}
        {activeTab === 'facilities' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-dark">Healthcare Facilities Roster</h3>
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
                  <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                    <th className="py-2.5 px-4 font-semibold">Facility Name</th>
                    <th className="py-2.5 px-4 font-semibold">Type</th>
                    <th className="py-2.5 px-4 font-semibold">Beds Roster</th>
                    <th className="py-2.5 px-4 font-semibold">Compliance Rating</th>
                    <th className="py-2.5 px-4 font-semibold">Load Level</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-dark">
                  {facilitiesList.map((f) => (
                    <tr key={f.id} className="border-b border-accent/15 hover:bg-accent/10">
                      <td className="py-2.5 px-4 font-bold text-dark">{f.name}</td>
                      <td className="py-2.5 px-4 text-secondary/70">{f.type}</td>
                      <td className="py-2.5 px-4">{f.beds} beds</td>
                      <td className="py-2.5 px-4 font-bold text-secondary">{f.compliance}%</td>
                      <td className="py-2.5 px-4"><span className={`px-2 py-0.5 rounded font-bold text-[10px] ${f.load === 'High' ? 'bg-red-100 text-red-700 font-bold' : 'bg-green-100 text-green-700'}`}>{f.load}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RESOURCE REDISTRIBUTION */}
        {activeTab === 'redistribution' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Pending Transfers from socket/api */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold text-dark">Procurement Requests ({pendingRequests?.length || 0})</h3>
              <div className="space-y-3">
                {isRequestsLoading ? (
                  <p className="text-xs text-secondary/60 italic">Fetching transfers...</p>
                ) : pendingRequests && pendingRequests.length > 0 ? (
                  pendingRequests.map((req: any) => (
                    <div key={req.id} className="p-3 border border-accent/25 rounded-xl bg-accent/20 space-y-2">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-secondary/75">{req.hospital}</p>
                        <p className="font-bold text-xs text-dark">{req.quantity}x {req.medicine}</p>
                      </div>
                      <button 
                        onClick={() => approveMutation.mutate(req.id)}
                        className="w-full py-1.5 bg-secondary text-white font-bold rounded-lg hover:bg-[#00a892] text-[10px]"
                      >
                        Approve Transfer
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-secondary/60 italic">No pending procurement requests.</p>
                )}
              </div>
            </div>

            {/* AI suggestions */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-dark">AI Redistribution Orders</h3>
              <div className="space-y-3">
                {redistributions.map((r) => (
                  <div key={r.id} className="p-4 border border-accent/25 rounded-xl flex items-center justify-between gap-4 text-xs hover:shadow-sm transition-shadow bg-accent/20">
                    <div>
                      <span className="text-[10px] text-secondary font-bold block mb-1">TRANSFER INSTRUCTION</span>
                      <p className="text-dark font-bold">{r.qty}x {r.item}</p>
                      <p className="text-[10px] text-secondary/70 mt-1">From: <span className="font-semibold">{r.from}</span> • To: <span className="font-semibold">{r.to}</span></p>
                    </div>
                    <div>
                      {r.status === 'Pending Approval' ? (
                        <button 
                          onClick={() => handleApproveRedistribute(r.id)}
                          className="px-3 py-1.5 bg-secondary text-white font-bold rounded-lg shadow"
                        >
                          Approve Transfer
                        </button>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold text-[10px]">{r.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OUTBREAK MONITORING */}
        {activeTab === 'outbreaks' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual map simulation */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-2 flex flex-col justify-between">
              <h3 className="text-sm font-bold text-dark mb-4">Outbreak Hotspot Incident Grid</h3>
              
              <div className="grid grid-cols-4 gap-4 p-6 bg-accent/20 rounded-xl border border-accent/15">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`h-16 rounded-xl flex items-center justify-center font-bold text-xs ${
                    i === 2 || i === 7 ? 'bg-red-100 text-red-700 border border-red-200' : 
                    i === 5 || i === 10 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                    'bg-green-50 text-green-700 border border-green-200/50'
                  }`}>
                    Sector {i+1}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-secondary/70 mt-4 leading-relaxed font-semibold">Color tags represent live diagnostic volume trends. Red zones trigger immediate epidemic alerts and prioritize ORS/saline shipments.</p>
            </div>

            {/* Outbreak risks */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-4 lg:col-span-1">
              <h3 className="text-sm font-bold text-dark">Active Outbreak Alarms</h3>
              <div className="space-y-3">
                {activeOutbreaks.map((out, idx) => (
                  <div key={idx} className="p-4 border border-accent/35 rounded-xl bg-accent/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-dark">{out.disease}</span>
                      <span className="px-2 py-0.5 bg-red-100 text-red-750 rounded font-bold text-[10px] uppercase">{out.risk}</span>
                    </div>
                    <p className="text-[10px] text-secondary/70 leading-normal">{out.region} • {out.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DISTRICT REPORTS */}
        {activeTab === 'reports' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-4">
            <h3 className="text-sm font-bold text-dark">District Report Compilation Center</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-accent/30 rounded-xl hover:shadow-md transition-all flex justify-between items-center bg-accent/20">
                <div>
                  <h4 className="font-bold text-xs text-dark">District-wide Medicine Stock report</h4>
                  <p className="text-[10px] text-secondary/60 mt-1">Compiled stock levels, shortages, and expiry alerts.</p>
                </div>
                <button onClick={() => alert("Downloading medicine stock PDF...")} className="px-3.5 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg shadow">Export</button>
              </div>
              <div className="p-4 border border-accent/30 rounded-xl hover:shadow-md transition-all flex justify-between items-center bg-accent/20">
                <div>
                  <h4 className="font-bold text-xs text-dark">Facility Compliance & Bed Occupancy Report</h4>
                  <p className="text-[10px] text-secondary/60 mt-1">Clinical performance scores and general statistics.</p>
                </div>
                <button onClick={() => alert("Downloading compliance report PDF...")} className="px-3.5 py-1.5 bg-secondary text-white text-xs font-bold rounded-lg shadow">Export</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODALS */}
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
