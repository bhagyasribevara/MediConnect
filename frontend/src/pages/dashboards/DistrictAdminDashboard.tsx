import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { io } from 'socket.io-client';

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
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const socket = io('http://127.0.0.1:5000');
    socket.on('new_inventory_request', (data) => {
      setNotifications(prev => [`New Request from ${data.hospital}: ${data.quantity}x ${data.medicine}`, ...prev]);
      queryClient.invalidateQueries({ queryKey: ['pendingRequests'] });
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

  const { data: requests, isLoading: isRequestsLoading } = useQuery({
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
    }
  });

  const handleDownloadPDF = () => {
    alert('Generating District Health Report PDF...');
  };

  return (
    <DashboardLayout title="District Admin Dashboard" role="DistrictAdmin">
      {notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {notifications.map((msg, i) => (
            <div key={i} className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl flex justify-between shadow-sm">
              <span>{msg}</span>
              <button onClick={() => setNotifications(prev => prev.filter((_, idx) => idx !== i))} className="font-bold text-blue-900">&times;</button>
            </div>
          ))}
        </div>
      )}

      {isMetricsLoading ? <p>Loading metrics...</p> : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-white font-medium rounded-xl shadow-md hover:bg-[#00a892] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export Report (PDF)
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Total Hospitals</h3>
              <p className="text-3xl font-bold text-gray-800">{metrics?.total_hospitals || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Total District Beds</h3>
              <p className="text-3xl font-bold text-gray-800">{metrics?.total_district_beds || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Available Beds</h3>
              <p className="text-3xl font-bold text-secondary">{metrics?.available_beds || 0}</p>
            </div>
            <div className="p-6 bg-orange-50 text-orange-800 rounded-2xl shadow-clay border border-orange-200">
              <h3 className="text-sm font-semibold mb-1">AI Outbreak Risk</h3>
              <p className="text-xl font-bold">High - Dengue</p>
              <p className="text-xs mt-1">Expected 20% surge next week.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Disease Outbreak Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00BFA6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00BFA6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="cases" stroke="#00BFA6" strokeWidth={3} fillOpacity={1} fill="url(#colorCases)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Pending Requests</h3>
                {isRequestsLoading ? (
                  <p className="text-sm text-gray-500">Loading requests...</p>
                ) : requests && requests.length > 0 ? (
                  <div className="space-y-3">
                    {requests.map((req: any) => (
                      <div key={req.id} className="p-3 border border-gray-200 rounded-xl bg-gray-50">
                        <p className="text-xs font-bold text-gray-500 mb-1">{req.hospital}</p>
                        <p className="text-sm font-semibold text-gray-800">{req.quantity}x {req.medicine}</p>
                        <button 
                          onClick={() => approveMutation.mutate(req.id)}
                          disabled={approveMutation.isPending}
                          className="mt-2 w-full py-1.5 bg-secondary text-white text-xs font-semibold rounded-lg shadow hover:bg-[#00a892]"
                        >
                          {approveMutation.isPending ? 'Approving...' : 'Approve Transfer'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No pending requests.</p>
                )}
              </div>
              
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">AI Redistribution</h3>
                <div className="space-y-4">
                  <div className="p-3 border border-gray-100 rounded-xl bg-gray-50">
                    <p className="text-xs font-bold text-secondary mb-1">Transfer Suggestion</p>
                    <p className="text-sm text-gray-700">Move 50 O2 Cylinders from <span className="font-semibold">City Hospital</span> to <span className="font-semibold">Rural PHC</span>.</p>
                    <button className="mt-2 text-xs font-semibold text-secondary hover:underline">Execute Transfer</button>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
