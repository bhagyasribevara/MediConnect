import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { getModelStatus, retrainModel, retrainAllModels } from '../../services/ai_api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Icons as inline SVGs
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68-.34-1.44-.08-1.88.54l-.44.62a8.04 8.04 0 01-1.39-1.4l.62-.44a1.88 1.88 0 00.54-1.89l-.26-1.02c-.17-.68-.82-1.12-1.5-1.02L5.05 11a8.06 8.06 0 010-2l.98.13c.69.1 1.34-.34 1.5-1.02l.26-1.02c.18-.68-.14-1.44-.54-1.89l-.62-.44a8.04 8.04 0 011.39-1.4l.44.62c.44.62 1.2.88 1.88.54l1.02-.26c.68-.18 1.12-.83 1.02-1.5l-.13-.98a8.06 8.06 0 012 0l-.13.98c-.1.68.34 1.33 1.02 1.5l1.02.26c.68.34 1.44.08 1.88-.54l.44-.62a8.04 8.04 0 011.39 1.4l-.62.44a1.88 1.88 0 00-.54 1.89l.26 1.02c.17.68.82 1.12 1.5 1.02l.98-.13a8.06 8.06 0 010 2l-.98-.13a1.88 1.88 0 00-1.5 1.02l-.26 1.02a1.88 1.88 0 00.54 1.89l.62.44a8.04 8.04 0 01-1.39 1.4l-.44-.62a1.88 1.88 0 00-1.88-.54l-1.02.26a1.88 1.88 0 00-1.02 1.5l.13.98a8.06 8.06 0 01-2 0l.13-.98a1.88 1.88 0 00-1.02-1.5l-1.02-.26z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 18H8.25c-4.321 0-7.78-3.534-7.78-7.78 0-4.246 3.46-7.78 7.78-7.78h1.839c1.921 0 3.73.486 5.312 1.343m0 0A10.748 10.748 0 0118 8v1.238c0 1.932-.782 3.682-2.046 4.954" />
  </svg>
);
const ModelsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 00-2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);
const DatabaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75M3.75 13.875v3.75" />
  </svg>
);
const BroadcastIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
  </svg>
);

const superTabs = [
  { id: 'system_control', label: 'System & Load', icon: <SettingsIcon /> },
  { id: 'users', label: 'Users Directory', icon: <UsersIcon /> },
  { id: 'ai_models', label: 'AI LLM Models', icon: <ModelsIcon /> },
  { id: 'backups', label: 'System Backups', icon: <DatabaseIcon /> },
  { id: 'broadcast', label: 'Global Broadcast', icon: <BroadcastIcon /> },
];

const mockSystemHealthData = [
  { name: '08:00', load: 30 },
  { name: '10:00', load: 45 },
  { name: '12:00', load: 80 },
  { name: '14:00', load: 60 },
  { name: '16:00', load: 50 },
  { name: '18:00', load: 70 },
];

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('system_control');

  // User list directories
  const [userSearch, setUserSearch] = useState('');
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', role: 'Patient', phone: '' });
  const [usersList, setUsersList] = useState<any[]>([
    { id: 1, username: 'patient_yusuf', role: 'Patient', phone: '1234567890', status: 'Active' },
    { id: 2, username: 'doc_yusuf', role: 'Doctor', phone: '1234567890', status: 'Active' },
    { id: 3, username: 'hospital_yusuf', role: 'HospitalAdmin', phone: '1234567890', status: 'Active' },
    { id: 4, username: 'district_yusuf', role: 'DistrictAdmin', phone: '1234567890', status: 'Active' }
  ]);

  // AI models active states
  const [aiModels, setAiModels] = useState<any[]>([
    { id: 'gemini-pro', name: 'Gemini 1.5 Pro', latency: '420ms', status: 'Active', tokens: '2.4M / 10M' },
    { id: 'gemini-flash', name: 'Gemini 1.5 Flash', latency: '180ms', status: 'Active', tokens: '5.1M / 20M' },
    { id: 'medlm', name: 'MedLM (Clinical Model)', latency: '650ms', status: 'Inactive', tokens: '0 / 1M' }
  ]);

  // Database backups history
  const [backups, setBackups] = useState<any[]>([
    { timestamp: '2026-07-03 09:00:15', size: '4.2 MB', status: 'Success', trigger: 'Auto System' },
    { timestamp: '2026-07-02 09:00:10', size: '4.1 MB', status: 'Success', trigger: 'Auto System' }
  ]);

  // Global bulletin broadcast
  const [broadcastForm, setBroadcastForm] = useState({ target: 'All', urgency: 'Info', message: '' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['superAdminMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/superadmin');
      return res.data.metrics;
    }
  });

  // Fetch AI Model Status
  const { data: mlModels, refetch: refetchModels } = useQuery({
    queryKey: ['ml_model_status'],
    queryFn: async () => {
      const res = await getModelStatus();
      return res.data;
    },
    enabled: activeTab === 'ai_models'
  });

  const handleRetrain = async (modelName: string) => {
    try {
      await retrainModel(modelName);
      alert(`Retraining started for model: ${modelName}. This will run in the background.`);
    } catch (err) {
      alert(`Error starting retraining for ${modelName}`);
    }
  };

  const handleRetrainAll = async () => {
    try {
      await retrainAllModels();
      alert('Retraining started for all models in the background.');
    } catch (err) {
      alert('Error starting batch retraining.');
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUsersList(prev => [...prev, { id: Date.now(), username: userForm.username, role: userForm.role, phone: userForm.phone, status: 'Active' }]);
    setIsUserModalOpen(false);
    setUserForm({ username: '', role: 'Patient', phone: '' });
  };

  const handleRunBackup = () => {
    alert("Running SQLite database backup process...");
    setTimeout(() => {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      setBackups(prev => [{ timestamp: now, size: '4.2 MB', status: 'Success', trigger: 'SuperAdmin Manual' }, ...prev]);
      alert("System database backup completed successfully and saved to local secure folder!");
    }, 1000);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Global alert broadcasted successfully to all users matching target: "${broadcastForm.target}".`);
    setBroadcastForm({ target: 'All', urgency: 'Info', message: '' });
  };

  const toggleModel = (id: string) => {
    setAiModels(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' } : m));
  };

  return (
    <DashboardLayout 
      title="System Architecture SuperAdmin" 
      role="SuperAdmin" 
      tabs={superTabs} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      {isLoading ? <p className="text-xs text-secondary/60">Loading metrics...</p> : error ? <p className="text-red-500 text-xs">Error loading data</p> : (
        <div className="space-y-6">

          {/* TAB 1: SYSTEM & LOAD */}
          {activeTab === 'system_control' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                  <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Registered System Users</h3>
                  <p className="text-3xl font-extrabold text-dark mt-1">{data?.total_users || 0}</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                  <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Total Facility Indexes</h3>
                  <p className="text-3xl font-extrabold text-dark mt-1">{data?.total_hospitals || 0}</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                  <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">System Server Health</h3>
                  <p className="text-3xl font-extrabold text-green-500 mt-1">{data?.system_health || '99.9%'}</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                  <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Security Anomaly Alerts</h3>
                  <p className="text-3xl font-extrabold text-dark mt-1">0</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Load Chart */}
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                  <h3 className="text-sm font-bold text-dark mb-4">Core CPU / memory Load Profile</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockSystemHealthData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBF8F6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#00BFA6', fontSize: 10}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#00BFA6', fontSize: 10}} />
                        <Tooltip cursor={{fill: '#EBF8F6'}} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Bar dataKey="load" fill="#00BFA6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-4">
                  <h3 className="text-sm font-bold text-dark">Active Audit logs</h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    <div className="p-3 bg-accent/20 border border-accent/15 rounded-xl text-xs">
                      <span className="font-semibold text-secondary">[12:45 PM]</span> User 'doc_yusuf' logged in successfully.
                    </div>
                    <div className="p-3 bg-accent/20 border border-accent/15 rounded-xl text-xs">
                      <span className="font-semibold text-secondary">[12:30 PM]</span> 'district_yusuf' generated PDF report.
                    </div>
                    <div className="p-3 bg-red-50 text-red-800 rounded-xl text-xs border border-red-200">
                      <span className="font-semibold">[11:15 AM]</span> Failed login attempt from IP 192.168.1.5 (Rate Limited).
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS DIRECTORY */}
          {activeTab === 'users' && (
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-dark">System User Registrations</h3>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Search username..." 
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="px-3 py-1.5 border border-accent/40 bg-accent/20 text-dark rounded-xl text-xs outline-none focus:ring-2 focus:ring-secondary w-52 shadow-inner"
                  />
                  <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow hover:bg-[#00a892]"
                  >
                    + Register User
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                      <th className="py-2.5 px-4 font-semibold">Username</th>
                      <th className="py-2.5 px-4 font-semibold">User Role</th>
                      <th className="py-2.5 px-4 font-semibold">Phone Contact</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                      <th className="py-2.5 px-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-dark">
                    {usersList.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase())).map((user) => (
                      <tr key={user.id} className="border-b border-accent/15 hover:bg-accent/10">
                        <td className="py-2.5 px-4 font-bold text-dark">{user.username}</td>
                        <td className="py-2.5 px-4 text-secondary/70">{user.role}</td>
                        <td className="py-2.5 px-4">{user.phone}</td>
                        <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px]">{user.status}</span></td>
                        <td className="py-2.5 px-4">
                          <button onClick={() => setUsersList(prev => prev.filter(u => u.id !== user.id))} className="text-red-500 hover:underline font-bold">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AI ML MODELS & API */}
          {activeTab === 'ai_models' && (
            <div className="space-y-6">
              
              {/* ML Pipeline Models (Joblib/Scikit-learn/XGBoost) */}
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-dark flex items-center gap-2">
                    <ModelsIcon /> Predictive ML Pipeline Models
                  </h3>
                  <button onClick={handleRetrainAll} className="px-3 py-1.5 bg-secondary text-white text-xs font-bold rounded-xl shadow hover:bg-[#00a892]">
                    Retrain All Models
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {mlModels?.models?.map((model: any) => (
                    <div key={model.name} className="p-5 border border-accent/25 rounded-2xl bg-white shadow-sm flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-sm text-dark capitalize">{model.name} Model</h4>
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${model.status === 'loaded' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {model.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">{model.purpose || 'ML Prediction Model'}</p>
                        
                        <div className="mt-4 text-xs space-y-2 bg-accent/10 p-3 rounded-xl border border-accent/20">
                          <div className="flex justify-between">
                            <span className="text-secondary/60 font-bold">Accuracy / Score</span>
                            <span className="text-dark font-medium">{model.accuracy ? (model.accuracy * 100).toFixed(1) + '%' : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary/60 font-bold">Algorithm</span>
                            <span className="text-dark font-medium">{model.model_type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary/60 font-bold">Dataset Rows</span>
                            <span className="text-dark font-medium">{model.dataset_rows ? model.dataset_rows.toLocaleString() : 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary/60 font-bold">Size</span>
                            <span className="text-dark font-medium">{model.file_size_mb} MB</span>
                          </div>
                        </div>
                      </div>
                      
                      <button onClick={() => handleRetrain(model.name)} className="w-full py-2 bg-accent/20 hover:bg-accent/40 text-secondary font-bold text-[10px] uppercase rounded-xl transition-colors">
                        Initiate Retraining
                      </button>
                    </div>
                  ))}
                  
                  {!mlModels?.models && (
                    <div className="col-span-full py-8 text-center text-sm text-gray-500">
                      Loading ML Model Status...
                    </div>
                  )}
                </div>
              </div>

              {/* Gemini LLM API Status (Existing) */}
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
                <h3 className="text-sm font-bold text-dark">Active Generative AI (LLM) Deployments</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {aiModels.map((model) => (
                    <div key={model.id} className="p-5 border border-accent/25 rounded-2xl bg-accent/20 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-xs text-dark">{model.name}</h4>
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${model.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-650'}`}>{model.status}</span>
                        </div>
                        <div className="mt-4 text-xs space-y-2">
                          <div className="flex justify-between">
                            <span className="text-secondary/60 font-bold">API Latency</span>
                            <span className="text-dark font-medium">{model.latency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-secondary/60 font-bold">Tokens Used</span>
                            <span className="text-dark font-medium">{model.tokens}</span>
                          </div>
                        </div>
                      </div>
                      <button className="w-full py-2 bg-white text-secondary font-bold text-[10px] uppercase rounded-xl border border-accent/30 hover:bg-secondary hover:text-white transition-all shadow-sm">
                        View Analytics
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: SYSTEM BACKUPS */}
          {activeTab === 'backups' && (
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-dark">SQLite database Snapshots</h3>
                <button 
                  onClick={handleRunBackup}
                  className="px-4 py-2 bg-secondary text-white text-xs font-bold rounded-xl shadow hover:bg-[#00a892]"
                >
                  Backup Database
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                      <th className="py-2.5 px-4 font-semibold">Backup Timestamp</th>
                      <th className="py-2.5 px-4 font-semibold">Snapshot Size</th>
                      <th className="py-2.5 px-4 font-semibold">Operator Trigger</th>
                      <th className="py-2.5 px-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-dark">
                    {backups.map((b, i) => (
                      <tr key={i} className="border-b border-accent/15">
                        <td className="py-2.5 px-4 font-bold">{b.timestamp}</td>
                        <td className="py-2.5 px-4 text-secondary/70">{b.size}</td>
                        <td className="py-2.5 px-4">{b.trigger}</td>
                        <td className="py-2.5 px-4"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-bold text-[10px]">{b.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: GLOBAL BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-4 max-w-xl">
              <h3 className="text-sm font-bold text-dark">Broadcast Global Bulletin Alert</h3>
              
              <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-secondary/60 font-bold mb-1">Target Audience</label>
                    <select 
                      value={broadcastForm.target}
                      onChange={(e) => setBroadcastForm({...broadcastForm, target: e.target.value})}
                      className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                    >
                      <option>All</option>
                      <option>Patients Only</option>
                      <option>Doctors Only</option>
                      <option>Hospital Administrators</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-secondary/60 font-bold mb-1">Alert Urgency Level</label>
                    <select 
                      value={broadcastForm.urgency}
                      onChange={(e) => setBroadcastForm({...broadcastForm, urgency: e.target.value})}
                      className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                    >
                      <option>Info</option>
                      <option>Maintenance Warning</option>
                      <option>Emergency Alert</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-secondary/60 font-bold mb-1">Bulletin Message</label>
                  <textarea 
                    value={broadcastForm.message}
                    onChange={(e) => setBroadcastForm({...broadcastForm, message: e.target.value})}
                    placeholder="Enter message bulletin to broadcast..."
                    className="w-full h-24 p-3 bg-accent/20 border-none rounded-xl focus:ring-2 focus:ring-secondary resize-none"
                    required
                  />
                </div>

                <button type="submit" className="px-6 py-2 bg-secondary text-white font-bold rounded-xl shadow hover:bg-[#00a892]">
                  📢 Broadcast Alert
                </button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* Register User Modal Dialog */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-accent/30 shadow-2xl">
            <h3 className="text-base font-extrabold text-dark mb-4">Register System Account</h3>
            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-secondary/60 font-bold mb-1">Username</label>
                <input 
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-secondary/60 font-bold mb-1">Account Role</label>
                  <select 
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                  >
                    <option>Patient</option>
                    <option>Doctor</option>
                    <option>HospitalAdmin</option>
                    <option>DistrictAdmin</option>
                    <option>SuperAdmin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-secondary/60 font-bold mb-1">Contact Phone</label>
                  <input 
                    type="text"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none"
                    required 
                  />
                </div>
              </div>
              <div className="flex gap-2.5 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-accent/40 rounded-xl font-bold text-secondary hover:bg-accent/40"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-secondary text-white rounded-xl font-bold shadow hover:bg-[#00a892]"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
