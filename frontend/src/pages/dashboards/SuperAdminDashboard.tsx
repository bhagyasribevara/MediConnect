import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockSystemHealthData = [
  { name: '08:00', load: 30 },
  { name: '10:00', load: 45 },
  { name: '12:00', load: 80 },
  { name: '14:00', load: 60 },
  { name: '16:00', load: 50 },
  { name: '18:00', load: 70 },
];

export default function SuperAdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['superAdminMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/superadmin');
      return res.data.metrics;
    }
  });

  return (
    <DashboardLayout title="Super Admin Dashboard" role="SuperAdmin">
      {isLoading ? <p>Loading metrics...</p> : error ? <p className="text-red-500">Error loading data</p> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Total Users</h3>
              <p className="text-3xl font-bold text-gray-800">{data?.total_users || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Total Hospitals</h3>
              <p className="text-3xl font-bold text-gray-800">{data?.total_hospitals || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">System Health</h3>
              <p className="text-3xl font-bold text-green-500">{data?.system_health || '99.9%'}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Security Anomalies</h3>
              <p className="text-3xl font-bold text-gray-800">0</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">System Load (CPU/RAM)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockSystemHealthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="load" fill="#1E293B" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Audit Logs</h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                  <span className="font-semibold text-secondary">[12:45 PM]</span> User 'doc_yusuf' logged in successfully.
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                  <span className="font-semibold text-secondary">[12:30 PM]</span> 'district_yusuf' generated PDF report.
                </div>
                <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-100 text-sm">
                  <span className="font-semibold">[11:15 AM]</span> Failed login attempt from IP 192.168.1.5 (Rate Limited).
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm">
                  <span className="font-semibold text-secondary">[09:00 AM]</span> System backup completed successfully.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
