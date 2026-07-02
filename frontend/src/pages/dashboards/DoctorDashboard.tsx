import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

export default function DoctorDashboard() {
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [reportText, setReportText] = useState('Patient report shows elevated blood pressure 150/95 and high cholesterol.');
  const [medlensResult, setMedlensResult] = useState<any>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['doctorMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/doctor');
      return res.data.metrics;
    }
  });

  const medlensMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await api.post('/medlens/upload', { report_text: text, save_to_record: true });
      return res.data;
    },
    onSuccess: (data) => {
      setMedlensResult(data);
    }
  });

  // Mocking Web Speech API for voice notes
  const handleToggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setTimeout(() => {
        setVoiceNote(prev => prev + " [Voice Note Recorded: Patient presents with mild fever.] ");
        setIsRecording(false);
      }, 2000);
    }
  };

  const handleGenerateSummary = () => {
    medlensMutation.mutate(reportText);
  };

  return (
    <DashboardLayout title="Doctor Dashboard" role="Doctor">
      {isLoading ? <p>Loading metrics...</p> : error ? <p className="text-red-500">Error loading data</p> : (
        <div className="space-y-6">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Today's Appointments</h3>
              <p className="text-3xl font-bold text-secondary mb-2">{data?.todays_appointments || 0}</p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Pending Reports</h3>
              <p className="text-3xl font-bold text-orange-500 mb-2">{data?.pending_reports || 0}</p>
            </div>
             <div className="p-6 bg-secondary text-white rounded-2xl shadow-clay border border-secondary">
              <h3 className="text-lg font-semibold mb-2">AI Insights</h3>
              <p className="font-medium text-sm">{data?.ai_insights}</p>
            </div>
          </div>

          {/* Quick Actions & Voice Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100 flex flex-col h-full">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Patient Voice Notes</h3>
              <textarea 
                className="w-full flex-1 min-h-[150px] p-4 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-secondary resize-none text-sm shadow-inner"
                placeholder="Dictate or type patient notes here..."
                value={voiceNote}
                onChange={(e) => setVoiceNote(e.target.value)}
              />
              <div className="mt-4 flex justify-between items-center">
                <button 
                  onClick={handleToggleRecording}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium shadow-md transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-secondary hover:bg-[#00a892]'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                  {isRecording ? 'Listening...' : 'Record Voice Note'}
                </button>
                <button className="text-sm font-semibold text-secondary hover:underline">Save to EMR</button>
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl shadow-clay border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">MedLens: Upload & Analyze</h3>
              
              {!medlensResult ? (
                <>
                  <textarea 
                    className="w-full h-[100px] p-3 border-2 border-dashed border-gray-300 rounded-xl text-sm focus:border-secondary focus:ring-0 mb-4"
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    placeholder="Paste report text or mock OCR text here..."
                  />
                  <button 
                    onClick={handleGenerateSummary}
                    disabled={medlensMutation.isPending}
                    className="w-full py-2 bg-secondary text-white font-semibold rounded-xl hover:bg-[#00a892] transition-colors shadow-md disabled:bg-gray-400"
                  >
                    {medlensMutation.isPending ? 'Analyzing with Gemini...' : 'Generate AI Summary'}
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-xs font-bold text-green-700 mb-1">AI Summary</p>
                    <p className="text-sm text-gray-800">{medlensResult.summary}</p>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-bold text-red-700 mb-1">Abnormal Values</p>
                    <ul className="list-disc pl-4 text-sm text-gray-800">
                      {medlensResult.abnormal_values?.map((val: string, i: number) => (
                        <li key={i}>{val}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-xs font-bold text-blue-700 mb-1">Recommendations</p>
                    <ul className="list-disc pl-4 text-sm text-gray-800">
                      {medlensResult.recommendations?.map((rec: string, i: number) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                  <button 
                    onClick={() => setMedlensResult(null)}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
