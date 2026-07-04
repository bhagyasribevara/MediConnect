import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
<<<<<<< HEAD
import { predictDisease } from '../../services/ai_api';
=======
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:5000');
>>>>>>> 99fdc27202c99ed6e249142b2351bb55e5424ad4

// Icons as inline SVGs
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);
const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
  </svg>
);
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15M6.827 6.175l-.74-1.344A2.25 2.25 0 004.102 3.5h5.796c.626 0 1.196.327 1.51.87l.74 1.344m-5.32 0h8.64m-8.64 0a2.25 2.25 0 01-1.897-1.03L6 3.5M19.5 7.5h.008v.008H19.5V7.5zm-3 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
  </svg>
);
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);
const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-19.5 0A2.25 2.25 0 004.5 15h15a2.25 2.25 0 002.25-2.25m-19.5 0v.25A2.25 2.25 0 004.5 18h15a2.25 2.25 0 002.25-2.25v-.25m-18-6V7.5A2.25 2.25 0 015.25 5.25h3.75a2.25 2.25 0 011.664.739l2.336 2.511a2.25 2.25 0 001.664.739H19.5A2.25 2.25 0 0121.75 11.25V12" />
  </svg>
);

const patientTabs = [
  { id: 'home', label: 'Dashboard Home', icon: <HomeIcon /> },
  { id: 'ai_doctor', label: 'AI Doctor Assistant', icon: <ChatIcon /> },
  { id: 'medlens', label: 'MedLens OCR Scanner', icon: <CameraIcon /> },
  { id: 'appointments', label: 'Book Appointment', icon: <CalendarIcon /> },
  { id: 'emergency_sos', label: 'Emergency SOS', icon: <AlertIcon /> },
  { id: 'digital_emr', label: 'Digital Health Records', icon: <FolderIcon /> },
];

export default function PatientDashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeLang, setActiveLang] = useState('English');
  const [isVoiceOn, setIsVoiceOn] = useState(false);
  const [sosStatus, setSosStatus] = useState<'idle' | 'triggered'>('idle');

  // AI Doctor state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'bot', text: 'Hello! I am your AI Doctor Assistant. Please describe your symptoms in detail.' }
  ]);
  const [isDoctorLoading, setIsDoctorLoading] = useState(false);

  // MedLens states
  const [ocrText, setOcrText] = useState('Blood Report details: White Blood Cell: 12.5 K/uL (High), Glucose Fasting: 110 mg/dL (Borderline). All other parameters standard.');
  const [reportType, setReportType] = useState('Blood Report');
  const [medlensResult, setMedlensResult] = useState<any>(null);
  const [isLensLoading, setIsLensLoading] = useState(false);

  // Appointment states
  const [bookingForm, setBookingForm] = useState({ hospital: '1', doctor: '1', date: new Date().toISOString().split('T')[0], time: '', reason: '' });
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [queueState, setQueueState] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: slots = [] } = useQuery({
    queryKey: ['availableSlots', bookingForm.doctor, bookingForm.date],
    queryFn: async () => {
      if (!bookingForm.doctor || !bookingForm.date) return [];
      const res = await api.get(`/appointment/slots?doctor_id=${bookingForm.doctor}&date=${bookingForm.date}`);
      return res.data;
    },
    enabled: !!bookingForm.doctor && !!bookingForm.date
  });

  useEffect(() => {
    socket.on('slot_updated', (data) => {
      if (data.doctor_id == bookingForm.doctor && data.date == bookingForm.date) {
        queryClient.invalidateQueries({ queryKey: ['availableSlots', bookingForm.doctor, bookingForm.date] });
      }
    });
    return () => {
      socket.off('slot_updated');
    };
  }, [queryClient, bookingForm.doctor, bookingForm.date]);
  // EMR filters
  const [searchTerm, setSearchTerm] = useState('');

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['patientMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/patient');
      return res.data.metrics;
    }
  });

  // AI Doctor handle send
  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatMessage('');
    setIsDoctorLoading(true);

    try {
      // 1. Get ML Symptom Prediction
      const extractedSymptoms = userMsg.toLowerCase().split(/[\s,]+/);
      const mlResponse = await predictDisease(extractedSymptoms);
      const topDiseaseInfo = mlResponse.data.top_diseases?.[0];
      const topDisease = topDiseaseInfo?.disease || 'Unknown condition';
      
      const description = topDiseaseInfo?.description || 'We recommend consulting a doctor for more details.';
      const precautions = topDiseaseInfo?.precautions || ['Rest well', 'Consult a doctor'];
      
      let finalReply = '';
      try {
        // 2. Get Generative AI advice based on ML prediction
        const response = await api.post('/copilot/chat', { 
          message: `Role: Patient. Language: ${activeLang}. Symptoms: ${userMsg}. You have been diagnosed with: ${topDisease}. Description: ${description}. Precautions: ${precautions.join(', ')}. Provide a brief, compassionate response explaining the disease and giving suggestions to get cured. Do not mention ML, AI models, or confidence scores.` 
        });
        
        if (response.data.is_fallback) {
           throw new Error('Fallback triggered');
        }
        finalReply = response.data.reply;
      } catch (e) {
        // Graceful fallback using local ML model data
        finalReply = `Based on your symptoms, you might have **${topDisease}**.\n\n**What is it?**\n${description}\n\n**Suggestions:**\n${precautions.map((p: string) => `- ${p.charAt(0).toUpperCase() + p.slice(1)}`).join('\n')}\n\nPlease consult a medical professional for an official diagnosis.`;
      }
      
      setChatHistory(prev => [...prev, { sender: 'bot', text: finalReply }]);
    } catch (e) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: "Sorry, I am having trouble analyzing your symptoms right now. Please seek immediate medical care if it's an emergency." }]);
    } finally {
      setIsDoctorLoading(false);
    }
  };

  // MedLens Analyze
  const handleMedLensAnalyze = async () => {
    setIsLensLoading(true);
    try {
      const response = await api.post('/medlens/upload', { report_text: ocrText, save_to_record: true });
      setMedlensResult(response.data);
    } catch (e) {
      setMedlensResult({
        summary: "Analyzed Glucose levels and Blood counts. WBC is elevated indicating possible infection.",
        abnormal_values: ["White Blood Cell Count: 12.5 K/uL (High)", "Glucose Fasting: 110 mg/dL (Borderline)"],
        recommendations: ["Consult a physician regarding elevated white counts.", "Maintain low sugar diet and retest fasting glucose in 2 weeks."]
      });
    } finally {
      setIsLensLoading(false);
    }
  };

  // SOS Trigger
  const handleTriggerSOS = () => {
    setSosStatus('triggered');
    setTimeout(() => {
      alert("SOS notification broadcasted successfully to City General Hospital emergency service and nearest ambulance dispatch (102).");
    }, 500);
  };

  // Appointment Submission
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPaymentOpen(true);
  };

  const handleConfirmPayment = async () => {
    try {
      const res = await api.post('/appointment/book', {
        patient_id: 1, // Prototype patient id
        slot_id: selectedSlotId
      });
      setIsPaymentOpen(false);
      setQueueState({
        ticket: `MC-${res.data.appointment_id}`,
        queuePosition: res.data.queue_number,
        waitTime: 'Wait for notification',
        hospital: bookingForm.hospital,
        doctor: bookingForm.doctor
      });
      alert('Appointment booked successfully!');
    } catch(e: any) {
      alert(e.response?.data?.error || 'Failed to book slot');
      setIsPaymentOpen(false);
    }
  };

  return (
    <DashboardLayout 
      title="Patient Healthcare App" 
      role="Patient" 
      tabs={patientTabs} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="space-y-6">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Scheduled Appointments</h3>
                <p className="text-3xl font-extrabold text-dark mt-1">
                  {isLoading ? '...' : metrics?.upcoming_appointments || 0}
                </p>
                <button onClick={() => setActiveTab('appointments')} className="mt-4 w-full py-2 bg-secondary text-white rounded-xl font-bold shadow-md hover:bg-[#00a892] transition-all text-xs">
                  Book New Visit
                </button>
              </div>

              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Recent Test Reports</h3>
                <p className="text-3xl font-extrabold text-dark mt-1">
                  {isLoading ? '...' : metrics?.recent_reports || 0}
                </p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setActiveTab('digital_emr')} className="flex-1 py-2 bg-accent/40 text-secondary rounded-xl font-bold hover:bg-accent/70 transition-all text-xs">
                    View Records
                  </button>
                  <button onClick={() => setActiveTab('medlens')} className="flex-1 py-2 bg-secondary text-white rounded-xl font-bold shadow-md hover:bg-[#00a892] transition-all text-xs">
                    MedLens OCR
                  </button>
                </div>
              </div>

              <div className="p-6 bg-accent/25 rounded-2xl shadow-clay border border-secondary/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Emergency SOS</h3>
                  <p className="text-xs text-dark mt-2 leading-relaxed">Instantly share location and alert the nearest emergency ward and ambulance services.</p>
                </div>
                <button onClick={() => setActiveTab('emergency_sos')} className="mt-4 w-full py-2 bg-secondary text-white rounded-xl font-bold shadow-md hover:bg-[#00a892] transition-all text-xs">
                  Open SOS Dashboard
                </button>
              </div>
            </div>

            {/* Quick reminders & Nearby facilities grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Medication Reminders */}
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-1">
                <h3 className="text-sm font-bold text-dark mb-4">Medication Reminders</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-accent/20 rounded-xl border border-accent/15">
                    <div>
                      <p className="font-bold text-dark text-xs">Paracetamol (500mg)</p>
                      <p className="text-[10px] text-secondary/70">After Lunch • 02:00 PM</p>
                    </div>
                    <input type="checkbox" className="w-4 h-4 text-secondary rounded border-accent/30 focus:ring-secondary" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-accent/20 rounded-xl border border-accent/15">
                    <div>
                      <p className="font-bold text-dark text-xs">Amoxicillin (250mg)</p>
                      <p className="text-[10px] text-secondary/70">Twice a day • 09:00 AM / PM</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-secondary rounded border-accent/30 focus:ring-secondary" />
                  </div>
                </div>
              </div>

              {/* Nearby Facilities */}
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-dark">Nearby Healthcare Facilities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-accent/30 rounded-xl hover:shadow-md transition-shadow">
                    <span className="text-[10px] uppercase font-bold bg-accent text-secondary px-2 py-0.5 rounded">Hospital</span>
                    <h4 className="font-bold text-dark text-xs mt-2">City General Hospital</h4>
                    <p className="text-[10px] text-secondary/70 mt-1">2.4 km away • 15 General, 4 ICU beds available</p>
                  </div>
                  <div className="p-4 border border-accent/30 rounded-xl hover:shadow-md transition-shadow">
                    <span className="text-[10px] uppercase font-bold bg-accent text-secondary px-2 py-0.5 rounded">PHC</span>
                    <h4 className="font-bold text-dark text-xs mt-2">Primary Health Center Block A</h4>
                    <p className="text-[10px] text-secondary/70 mt-1">4.1 km away • Outpatient available • 200 ORS units in stock</p>
                  </div>
                  <div className="p-4 border border-accent/30 rounded-xl hover:shadow-md transition-shadow">
                    <span className="text-[10px] uppercase font-bold bg-accent text-secondary px-2 py-0.5 rounded">CHC</span>
                    <h4 className="font-bold text-dark text-xs mt-2">Community Health Center Central</h4>
                    <p className="text-[10px] text-secondary/70 mt-1">5.8 km away • Blood stock available • General ward</p>
                  </div>
                  <div className="p-4 border border-accent/30 rounded-xl hover:shadow-md transition-shadow">
                    <span className="text-[10px] uppercase font-bold bg-accent text-secondary px-2 py-0.5 rounded">Specialty</span>
                    <h4 className="font-bold text-dark text-xs mt-2">Metro Eye & Dental Clinic</h4>
                    <p className="text-[10px] text-secondary/70 mt-1">6.2 km away • By appointment only</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AI DOCTOR ASSISTANT */}
        {activeTab === 'ai_doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Control Sidebar */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-1 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-secondary/70 uppercase tracking-wider mb-2">Input Mode</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsVoiceOn(false)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${!isVoiceOn ? 'bg-secondary text-white border-secondary shadow-md' : 'text-secondary bg-accent/35 hover:bg-accent/70'}`}
                  >
                    ⌨ Text Input
                  </button>
                  <button 
                    onClick={() => {
                      setIsVoiceOn(true);
                      alert("Voice service active. Hold down 'Record Symptoms' button to speak.");
                    }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${isVoiceOn ? 'bg-secondary text-white border-secondary shadow-md' : 'text-secondary bg-accent/35 hover:bg-accent/70'}`}
                  >
                    🎙 Voice
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-secondary/70 uppercase tracking-wider mb-2">Translation Language</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {['English', 'Telugu', 'Hindi', 'Tamil', 'Kannada', 'Malayalam'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${activeLang === lang ? 'bg-secondary text-white border-secondary shadow-sm' : 'text-secondary bg-accent/35'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-accent rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-secondary">AI Diagnostic Scope</h4>
                <p className="text-[10px] text-secondary/80 leading-relaxed">Analyzing symptoms yields advice and recommended specialists. In critical emergencies, please use the SOS tab to trigger dispatch.</p>
              </div>
            </div>

            {/* Chat Box */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-clay border border-accent/30 flex flex-col h-[500px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-accent/20 flex justify-between items-center">
                <span className="font-bold text-dark text-sm">Consulting AI Doctor ({activeLang})</span>
                <button onClick={() => setChatHistory([{ sender: 'bot', text: 'Diagnostic history cleared. Describe your symptoms.' }])} className="text-xs text-red-500 font-bold hover:underline">Reset</button>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 p-4 overflow-y-auto bg-accent/10 flex flex-col gap-3">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[80%] p-3 rounded-2xl text-xs shadow-sm font-semibold leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-secondary text-white rounded-tr-none' 
                          : 'bg-white border border-accent/30 text-dark rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isDoctorLoading && (
                  <div className="text-xs text-secondary/60 italic">Gemini is analyzing symptoms...</div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-accent/20">
                {isVoiceOn ? (
                  <button 
                    onMouseDown={() => setChatMessage("Speaking symptoms: Mild headache and body pain for 2 days.")}
                    onMouseUp={handleSendChat}
                    className="w-full py-3 bg-secondary text-white rounded-xl font-bold shadow hover:bg-[#00a892] transition-colors animate-pulse text-xs"
                  >
                    🎤 HOLD & SPEAK SYMPTOMS
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type symptoms (e.g. fever, headache since yesterday)..."
                      className="flex-1 bg-accent/30 border-none px-4 py-2 rounded-xl text-xs focus:ring-2 focus:ring-secondary shadow-inner"
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendChat(); }}
                    />
                    <button onClick={handleSendChat} className="px-5 py-2 bg-secondary text-white font-bold rounded-xl shadow-md hover:bg-[#00a892]">
                      Send
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEDLENS OCR SCANNER */}
        {activeTab === 'medlens' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input and OCR Box */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-4">
              <h3 className="text-sm font-bold text-dark">Report OCR Scanner</h3>
              <div>
                <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-2">Select Report Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Prescription', 'Blood Report', 'X-Ray Report', 'CT Report'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setReportType(type)}
                      className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${reportType === type ? 'bg-secondary text-white border-secondary shadow-md' : 'text-secondary bg-accent/35 hover:bg-accent/60'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-2">Simulate OCR Text Input</label>
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  className="w-full h-44 p-3 bg-accent/20 border-none rounded-xl text-xs focus:ring-2 focus:ring-secondary resize-none shadow-inner"
                  placeholder="Paste clinical report notes or simulated OCR readout here..."
                />
              </div>

              <button 
                onClick={handleMedLensAnalyze}
                disabled={isLensLoading}
                className="w-full py-3 bg-secondary text-white font-bold rounded-xl shadow-md hover:bg-[#00a892] disabled:opacity-50 text-xs"
              >
                {isLensLoading ? 'Analyzing OCR report with Gemini...' : '🔬 RUN OCR ANALYZER'}
              </button>
            </div>

            {/* Analysis Results */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
              <h3 className="text-sm font-bold text-dark mb-4">Gemini Analysis Output</h3>

              {medlensResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-accent/30 border border-secondary/20 rounded-xl">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">AI Report Summary</h4>
                    <p className="text-xs text-dark leading-relaxed">{medlensResult.summary}</p>
                  </div>

                  <div className="p-4 bg-accent/35 border border-secondary/30 rounded-xl">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Abnormal Findings</h4>
                    <ul className="list-disc pl-4 text-xs text-dark space-y-1">
                      {medlensResult.abnormal_values?.map((val: string, idx: number) => (
                        <li key={idx}>{val}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-accent/25 border border-secondary/25 rounded-xl">
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Recommendations</h4>
                    <ul className="list-disc pl-4 text-xs text-dark space-y-1">
                      {medlensResult.recommendations?.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>

                  <button 
                    onClick={() => {
                      alert("Report successfully saved directly to your Digital Health Records (EMR).");
                      setMedlensResult(null);
                    }}
                    className="w-full py-2.5 bg-secondary text-white rounded-xl font-bold hover:bg-[#00a892] transition-colors text-xs"
                  >
                    💾 SAVE TO HEALTH RECORDS
                  </button>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-center border-2 border-dashed border-accent/35 rounded-xl">
                  <span className="text-4xl mb-2">📄</span>
                  <p className="text-xs text-secondary/60">Load a report on the left and run analysis to populate findings.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BOOK APPOINTMENT */}
        {activeTab === 'appointments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Form */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
              <h3 className="text-sm font-bold text-dark mb-4">Appointment Booking</h3>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-secondary/80 font-bold mb-1">Select Facility</label>
                    <select 
                      value={bookingForm.hospital}
                      onChange={(e) => setBookingForm({...bookingForm, hospital: e.target.value})}
                      className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option>City General Hospital</option>
                      <option>Saint Jude's Specialist</option>
                      <option>Community Health Center Block B</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-secondary/80 font-bold mb-1">Select Doctor</label>
                    <select 
                      value={bookingForm.doctor}
                      onChange={(e) => setBookingForm({...bookingForm, doctor: e.target.value})}
                      className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="1">Dr. Sarah Connor (Cardiology)</option>
                      <option value="2">Dr. Bruce Banner (Pathology)</option>
                      <option value="3">Dr. Stephen Strange (Neurology)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-secondary/80 font-bold mb-1">Date</label>
                    <input 
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})}
                      className="w-full text-xs px-3 py-2 border rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-secondary/80 font-bold mb-1">Live Appointment Slots</label>
                    <div className="grid grid-cols-4 gap-2">
                      {slots.length === 0 && <p className="text-xs text-secondary/70 col-span-4">No slots generated for this date.</p>}
                      {slots.map((s: any) => {
                        let colorClass = 'bg-accent/40 text-secondary border-accent';
                        if (s.status === 'Full') colorClass = 'bg-red-50 border-red-200 text-red-500 opacity-50 cursor-not-allowed';
                        else if (s.status === 'Partially Available') colorClass = 'bg-yellow-50 border-yellow-300 text-yellow-700';
                        else colorClass = 'bg-green-50 border-green-300 text-green-700';
                        
                        const isSelected = selectedSlotId === s.id;
                        
                        return (
                          <button
                            type="button"
                            key={s.id}
                            disabled={s.status === 'Full'}
                            onClick={() => { setSelectedSlotId(s.id); setBookingForm({...bookingForm, time: s.start_time}); }}
                            className={`p-2 border rounded-xl flex flex-col items-center justify-center transition-all ${isSelected ? 'ring-2 ring-secondary shadow-md' : 'shadow-sm'} ${colorClass}`}
                          >
                            <span className="font-bold text-xs">{s.start_time.substring(0,5)}</span>
                            <span className="text-[9px] mt-0.5">{s.status === 'Full' ? 'Slot Full' : `${s.remaining_count} seats left`}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-secondary/80 font-bold mb-1">Reason for Consultation</label>
                  <textarea 
                    value={bookingForm.reason}
                    onChange={(e) => setBookingForm({...bookingForm, reason: e.target.value})}
                    className="w-full text-xs h-20 p-3 bg-accent/20 border-none rounded-xl focus:ring-2 focus:ring-secondary resize-none shadow-inner"
                    placeholder="Short description of your issues..."
                    required
                  />
                </div>

                <button type="submit" className="w-full py-3 bg-secondary text-white font-bold rounded-xl shadow-md hover:bg-[#00a892] transition-colors text-xs">
                  💳 PROCEED TO PAYMENT
                </button>
              </form>
            </div>

            {/* Queue & Status tracking */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
              <h3 className="text-sm font-bold text-dark">Active Visits & Queue Tracker</h3>

              {queueState ? (
                <div className="space-y-4">
                  <div className="p-5 bg-accent border border-secondary/20 rounded-2xl relative overflow-hidden">
                    <span className="absolute top-0 right-0 px-3 py-1 bg-secondary text-white text-[10px] font-bold rounded-bl-xl uppercase">Live Queue</span>
                    <p className="text-[10px] text-secondary/60 font-bold">REGISTRATION SLIP</p>
                    <h4 className="text-lg font-extrabold text-dark mt-1">{queueState.ticket}</h4>

                    <div className="grid grid-cols-2 gap-4 mt-4 border-t border-accent/20 pt-4 text-xs">
                      <div>
                        <span className="text-secondary/65 font-medium">Hospital</span>
                        <p className="font-bold text-dark">{queueState.hospital}</p>
                      </div>
                      <div>
                        <span className="text-secondary/65 font-medium">Doctor</span>
                        <p className="font-bold text-dark">{queueState.doctor}</p>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-white rounded-xl flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] text-secondary/60 block font-bold">QUEUE POSITION</span>
                        <span className="text-lg font-black text-secondary">#{queueState.queuePosition}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-secondary/60 block font-bold">EST. WAIT TIME</span>
                        <span className="text-xs font-bold text-dark">{queueState.waitTime}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setQueueState(null)} className="w-full py-2 border border-accent/40 text-secondary rounded-xl text-xs hover:bg-accent/40 font-bold">
                    Cancel Visit Ticket
                  </button>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-accent/35 rounded-xl">
                  <span className="text-4xl mb-2">⏱</span>
                  <p className="text-xs text-secondary/60">No active appointment queue. Complete a booking to receive tracking.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: EMERGENCY SOS */}
        {activeTab === 'emergency_sos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* SOS Dispatch Button */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-1 flex flex-col items-center justify-center text-center space-y-4">
              <h3 className="text-sm font-bold text-dark uppercase tracking-wider">Critical Trigger</h3>
              
              <div 
                onClick={handleTriggerSOS}
                className={`w-40 h-40 rounded-full flex flex-col items-center justify-center cursor-pointer shadow-lg transition-transform duration-300 transform active:scale-95 ${
                  sosStatus === 'triggered' 
                    ? 'bg-secondary ring-8 ring-accent animate-pulse text-white' 
                    : 'bg-accent/35 hover:bg-accent/70 border-4 border-secondary text-secondary'
                }`}
              >
                <span className="text-3xl">🚨</span>
                <span className="font-extrabold text-sm mt-1">{sosStatus === 'triggered' ? 'SOS SENT' : 'TRIGGER SOS'}</span>
              </div>

              <p className="text-xs text-secondary/80 leading-relaxed px-4">
                {sosStatus === 'triggered' 
                  ? 'Sharing location... Nearby ambulance is on their way.' 
                  : 'Tap button above to alert hospital dispatch, share live GPS track, and page standard ambulance response.'}
              </p>

              {sosStatus === 'triggered' && (
                <button onClick={() => setSosStatus('idle')} className="px-4 py-1.5 bg-accent/40 text-secondary hover:bg-accent/70 rounded-lg text-[10px] font-bold">
                  Cancel Alarm
                </button>
              )}
            </div>

            {/* Maps & Emergency list */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-sm font-bold text-dark mb-4">Location Sharing Status</h3>
                
                {/* Mock GPS coordinate tracker */}
                <div className="p-4 bg-accent/25 border border-accent/15 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-secondary/70">Live GPS Coordinates</span>
                    <span className="font-bold text-secondary">17.3850° N, 78.4867° E</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-secondary/70">Accuracy Radius</span>
                    <span className="font-bold text-dark">5 meters</span>
                  </div>
                  <div className="h-4 bg-accent/50 rounded-full overflow-hidden relative">
                    <div className="h-full bg-secondary w-2/3 animate-pulse rounded-full" />
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-4">
                <h3 className="text-sm font-bold text-dark">Emergency Dispatches</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 border border-accent/30 rounded-xl hover:shadow-sm">
                    <div>
                      <h4 className="font-bold text-xs text-dark">Central Ambulance Center (102)</h4>
                      <p className="text-[10px] text-secondary/70">Public emergency line • Active 24/7</p>
                    </div>
                    <button className="px-3 py-1 bg-secondary hover:bg-[#00a892] text-white rounded-lg text-xs font-bold shadow-md">Call Now</button>
                  </div>
                  <div className="flex justify-between items-center p-3 border border-accent/30 rounded-xl hover:shadow-sm">
                    <div>
                      <h4 className="font-bold text-xs text-dark">City Hospital Emergency Room</h4>
                      <p className="text-[10px] text-secondary/70">Direct ward desk • 2.4 km</p>
                    </div>
                    <button className="px-3 py-1 bg-secondary hover:bg-[#00a892] text-white rounded-lg text-xs font-bold shadow-md">Call Now</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DIGITAL HEALTH RECORDS (EMR) */}
        {activeTab === 'digital_emr' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            {/* Header & Filter options */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-dark">Digital Health Records (EMR)</h3>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Filter by diagnosis, doctor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 border bg-accent/30 text-dark rounded-xl text-xs outline-none focus:ring-2 focus:ring-secondary w-60 shadow-inner"
                />
                <button 
                  onClick={() => alert("Print layout simulation active...")}
                  className="px-3 py-1.5 border border-accent/40 text-secondary hover:bg-accent/40 rounded-xl text-xs font-bold"
                >
                  Print Log
                </button>
              </div>
            </div>

            {/* Prescriptions & Reports logs */}
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-secondary/65 uppercase tracking-wider mb-3">Prescription History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                        <th className="py-2.5 px-4 font-semibold">Medication</th>
                        <th className="py-2.5 px-4 font-semibold">Instructions</th>
                        <th className="py-2.5 px-4 font-semibold">Prescribing Doctor</th>
                        <th className="py-2.5 px-4 font-semibold">Date Issued</th>
                        <th className="py-2.5 px-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-dark">
                      {[
                        { drug: 'Amoxicillin 250mg', dose: '1-0-1 After Food', doc: 'Dr. Connor', date: '2026-06-25' },
                        { drug: 'Paracetamol 500mg', dose: '1-1-1 SOS Fever', doc: 'Dr. Connor', date: '2026-06-25' },
                        { drug: 'Lipitor 10mg', dose: '0-0-1 Nightly', doc: 'Dr. Banner', date: '2026-05-10' }
                      ].filter(p => p.drug.toLowerCase().includes(searchTerm.toLowerCase()) || p.doc.toLowerCase().includes(searchTerm.toLowerCase())).map((p, idx) => (
                        <tr key={idx} className="border-b border-accent/15 hover:bg-accent/10">
                          <td className="py-2.5 px-4 font-bold text-dark">{p.drug}</td>
                          <td className="py-2.5 px-4 text-secondary/70">{p.dose}</td>
                          <td className="py-2.5 px-4 font-semibold">{p.doc}</td>
                          <td className="py-2.5 px-4 text-secondary/70">{p.date}</td>
                          <td className="py-2.5 px-4"><button onClick={() => alert("Downloading PDF Prescription...")} className="text-secondary hover:underline font-bold">Download PDF</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-secondary/65 uppercase tracking-wider mb-3">Lab Diagnostic Reports</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-accent/15 text-secondary/70 text-xs">
                        <th className="py-2.5 px-4 font-semibold">Report Name</th>
                        <th className="py-2.5 px-4 font-semibold">Source</th>
                        <th className="py-2.5 px-4 font-semibold">Flagged Status</th>
                        <th className="py-2.5 px-4 font-semibold">Date Completed</th>
                        <th className="py-2.5 px-4 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-dark">
                      {[
                        { name: 'Complete Blood Count (CBC)', src: 'MedLens Upload', flag: 'High WBC', date: '2026-07-02' },
                        { name: 'Lipid Profile', src: 'City Gen Lab', flag: 'Elevated Cholesterol', date: '2026-05-11' },
                        { name: 'Chest X-Ray', src: 'St. Jude Radiology', flag: 'Normal Clear', date: '2026-04-15' }
                      ].filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase())).map((r, idx) => (
                        <tr key={idx} className="border-b border-accent/15 hover:bg-accent/10">
                          <td className="py-2.5 px-4 font-bold text-dark">{r.name}</td>
                          <td className="py-2.5 px-4 text-secondary/70">{r.src}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.flag.includes('Normal') ? 'bg-accent text-secondary' : 'bg-red-100 text-red-700'}`}>
                              {r.flag}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-secondary/70">{r.date}</td>
                          <td className="py-2.5 px-4 flex gap-2">
                            <button onClick={() => alert(`Reviewing details for ${r.name}`)} className="text-secondary hover:underline font-bold">Review</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Appointment Payment Modal Dialog */}
      {isPaymentOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm border border-accent/30 shadow-2xl">
            <h3 className="text-base font-extrabold text-dark mb-2">Simulate Consultation Fee</h3>
            <p className="text-xs text-secondary/80 mb-4">You are booking an appointment with {bookingForm.doctor} at {bookingForm.hospital}.</p>
            
            <div className="p-3 bg-accent/20 rounded-xl mb-4 border border-accent/15 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-secondary/70">Consultation Charges</span>
                <span className="font-bold text-dark">₹300.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-secondary/70">Booking Service Tax</span>
                <span className="font-bold text-dark">₹18.00</span>
              </div>
              <div className="flex justify-between border-t border-accent/30 pt-2 font-bold">
                <span className="text-dark">Grand Total</span>
                <span className="text-secondary">₹318.00</span>
              </div>
            </div>

            <div className="flex gap-2.5 justify-end">
              <button 
                onClick={() => setIsPaymentOpen(false)}
                className="px-4 py-2 border border-accent/40 rounded-xl text-xs font-bold text-secondary hover:bg-accent/40"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow hover:bg-[#00a892]"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
