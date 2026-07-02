import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

export default function PatientDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['patientMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/patient');
      return res.data.metrics;
    }
  });

  return (
    <DashboardLayout title="Patient Dashboard" role="Patient">
      {isLoading ? <p>Loading metrics...</p> : error ? <p className="text-red-500">Error loading data</p> : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-1">Upcoming Appointments</h3>
                <p className="text-3xl font-bold text-gray-800">{data?.upcoming_appointments || 0}</p>
              </div>
              <button className="mt-4 w-full py-2 bg-secondary text-white rounded-xl font-medium shadow-md hover:bg-[#00a892] transition-colors">
                Book Appointment
              </button>
            </div>
            
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 mb-1">Recent Reports</h3>
              <p className="text-3xl font-bold text-gray-800">{data?.recent_reports || 0}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                  View Reports
                </button>
                <button className="flex-1 py-2 bg-secondary text-white rounded-xl font-medium shadow-md hover:bg-[#00a892] transition-colors">
                  MedLens OCR
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-red-50 rounded-2xl shadow-clay border border-red-200 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500 shadow-sm cursor-pointer hover:bg-red-200 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-red-700 mb-2">Emergency SOS</h3>
              <p className="text-sm text-red-600 mb-4">Instantly notify nearby hospitals and request an ambulance.</p>
              <button className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors w-full">
                Trigger SOS
              </button>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
               <h3 className="text-lg font-semibold text-gray-700 mb-4">Medication Reminders</h3>
               <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Paracetamol (500mg)</p>
                      <p className="text-xs text-gray-500">After Lunch - 02:00 PM</p>
                    </div>
                    <input type="checkbox" className="w-5 h-5 text-secondary rounded border-gray-300 focus:ring-secondary" />
                 </div>
                 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Vitamin C</p>
                      <p className="text-xs text-gray-500">Morning - 09:00 AM</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-5 h-5 text-secondary rounded border-gray-300 focus:ring-secondary" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
