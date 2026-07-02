import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import { io } from 'socket.io-client';

export default function HospitalAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'beds' | 'inventory'>('overview');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({ medicine_name: '', requested_quantity: 0 });
  const [notifications, setNotifications] = useState<string[]>([]);
  
  useEffect(() => {
    const socket = io('http://127.0.0.1:5000');
    socket.on('inventory_approved', (data) => {
      setNotifications(prev => [`Request approved: ${data.medicine}`, ...prev]);
    });
    return () => { socket.disconnect(); };
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['hospitalAdminMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/hospitaladmin');
      return res.data.metrics;
    }
  });

  const requestStockMutation = useMutation({
    mutationFn: async (payload: {medicine_name: string, requested_quantity: number}) => {
      return api.post('/inventory/requests', payload);
    },
    onSuccess: () => {
      setIsRequestModalOpen(false);
      setNotifications(prev => ['Request sent to District Admin', ...prev]);
    }
  });

  const handleRequestStock = (e: React.FormEvent) => {
    e.preventDefault();
    requestStockMutation.mutate(requestForm);
  };

  return (
    <DashboardLayout title="Hospital Admin Dashboard" role="HospitalAdmin">
      {notifications.length > 0 && (
        <div className="mb-4 space-y-2">
          {notifications.map((msg, i) => (
            <div key={i} className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl flex justify-between">
              <span>{msg}</span>
              <button onClick={() => setNotifications(prev => prev.filter((_, idx) => idx !== i))} className="font-bold text-green-900">&times;</button>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-2">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`pb-2 px-1 text-sm font-medium ${activeTab === 'overview' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('beds')}
          className={`pb-2 px-1 text-sm font-medium ${activeTab === 'beds' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Bed Management
        </button>
        <button 
          onClick={() => setActiveTab('inventory')}
          className={`pb-2 px-1 text-sm font-medium ${activeTab === 'inventory' ? 'text-secondary border-b-2 border-secondary' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Inventory & Pharmacy
        </button>
      </div>

      {isLoading ? <p>Loading metrics...</p> : error ? <p className="text-red-500">Error loading data</p> : (
        <div className="space-y-6">
          
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Total Beds</h3>
                  <p className="text-3xl font-bold text-gray-800">{data?.total_beds || 0}</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Available Beds</h3>
                  <p className="text-3xl font-bold text-secondary">{data?.available_beds || 0}</p>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-500 mb-1">Doctors on Duty</h3>
                  <p className="text-3xl font-bold text-blue-500">{data?.doctors_on_duty || 0}</p>
                </div>
                <div className="p-6 bg-secondary text-white rounded-2xl shadow-clay border border-secondary">
                  <h3 className="text-sm font-semibold mb-1">Critical Alerts</h3>
                  <p className="text-3xl font-bold">2</p>
                  <p className="text-xs opacity-80 mt-1">O2 cylinders low</p>
                </div>
              </div>
            </>
          )}

          {activeTab === 'beds' && (
            <div className="bg-white p-6 rounded-2xl shadow-clay border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-700">ICU & General Ward Status</h3>
                <button className="px-4 py-2 bg-secondary text-white text-sm font-medium rounded-xl shadow-md hover:bg-[#00a892] transition-colors">
                  + Add Bed
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {[...Array(18)].map((_, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${i % 3 === 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke={i % 3 === 0 ? '#ef4444' : '#10b981'} className="w-8 h-8 mb-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <span className={`text-xs font-bold ${i % 3 === 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {i % 3 === 0 ? 'Occupied' : 'Available'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">ICU-{i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-2xl shadow-clay border border-gray-100">
               <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-700">Pharmacy & Blood Bank</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsRequestModalOpen(true)}
                    className="px-4 py-2 bg-secondary text-white text-sm font-medium rounded-xl shadow-md hover:bg-[#00a892] transition-colors">
                    Request Stock
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
                    + Add Item
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 text-sm">
                      <th className="py-3 px-4 font-semibold">Item Name</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold">Stock Level</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800">Paracetamol 500mg</td>
                      <td className="py-3 px-4 text-gray-500">Medicine</td>
                      <td className="py-3 px-4 text-gray-800">5,400 units</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">Good</span></td>
                      <td className="py-3 px-4"><button className="text-secondary hover:underline">Update</button></td>
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800">O+ Blood Bags</td>
                      <td className="py-3 px-4 text-gray-500">Blood Bank</td>
                      <td className="py-3 px-4 text-gray-800">12 units</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">Critical</span></td>
                      <td className="py-3 px-4"><button className="text-secondary hover:underline">Update</button></td>
                    </tr>
                    <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800">Oxygen Cylinders (Large)</td>
                      <td className="py-3 px-4 text-gray-500">Equipment</td>
                      <td className="py-3 px-4 text-gray-800">45 units</td>
                      <td className="py-3 px-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-bold">Low</span></td>
                      <td className="py-3 px-4"><button className="text-secondary hover:underline">Update</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Request Stock Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-clay">
            <h2 className="text-xl font-bold mb-4">Request Stock</h2>
            <form onSubmit={handleRequestStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input 
                  type="text" 
                  value={requestForm.medicine_name}
                  onChange={(e) => setRequestForm({...requestForm, medicine_name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-secondary focus:border-secondary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input 
                  type="number" 
                  value={requestForm.requested_quantity}
                  onChange={(e) => setRequestForm({...requestForm, requested_quantity: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border rounded-xl focus:ring-secondary focus:border-secondary"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={requestStockMutation.isPending}
                  className="px-4 py-2 bg-secondary text-white rounded-xl shadow-md hover:bg-[#00a892]"
                >
                  {requestStockMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
