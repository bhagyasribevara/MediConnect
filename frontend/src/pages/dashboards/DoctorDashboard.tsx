import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

// Icons as inline SVGs
const OverviewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
  </svg>
);
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 18H8.25c-4.321 0-7.78-3.534-7.78-7.78 0-4.246 3.46-7.78 7.78-7.78h1.839c1.921 0 3.73.486 5.312 1.343m0 0A10.748 10.748 0 0118 8v1.238c0 1.932-.782 3.682-2.046 4.954m-3.908-10.85a10.72 10.72 0 00-4.887 0m0 0a8.966 8.966 0 01-2.073-1.033m0 0a8.966 8.966 0 01-1.077 2.073" />
  </svg>
);
const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0112 3m0 0c2.917 0 5.747.294 8.5.862m-21 1.402v13.11c0 1.135.845 2.098 1.976 2.192a48.423 48.423 0 001.123.08" />
  </svg>
);
const LensIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
  </svg>
);
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-full h-full">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const doctorTabs = [
  { id: 'overview', label: 'Doctor Overview', icon: <OverviewIcon /> },
  { id: 'patients', label: 'Patient EMR Records', icon: <UsersIcon /> },
  { id: 'consultation', label: 'Consultation & Prescription', icon: <ClipboardIcon /> },
  { id: 'medlens_review', label: 'Review AI Reports', icon: <LensIcon /> },
  { id: 'schedules', label: 'Duty Schedule', icon: <CalendarIcon /> },
];

export default function DoctorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

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
  const [reportsToReview, setReportsToReview] = useState<any[]>([
    { id: 101, patientName: 'Aarav Kumar', reportType: 'Blood Report', uploadDate: '2026-07-02', ocrText: 'Glucose: 155 mg/dL (High Fasting), Hemoglobin: 14 g/dL', summary: 'Fasting glucose is significantly elevated, indicating insulin resistance.', abnormal: ['Fasting Glucose: 155 mg/dL (High)'], recommendations: ['Restrict refined sugar intake.', 'Perform HbA1c test for confirmation.'] },
    { id: 102, patientName: 'Priya Sharma', reportType: 'Lipid Panel', uploadDate: '2026-07-01', ocrText: 'Cholesterol Total: 240 mg/dL (Elevated), LDL: 160 mg/dL (High)', summary: 'Total and LDL cholesterol are high, indicating risk of cardiovascular strain.', abnormal: ['Total Cholesterol: 240 mg/dL (Elevated)', 'LDL Cholesterol: 160 mg/dL (High)'], recommendations: ['Prescribe low-fat Mediterranean diet.', 'Begin low-dose Statin therapy.'] }
  ]);

  // Schedules state
  const [availability, setAvailability] = useState(true);
  const [leaveForm, setLeaveForm] = useState({ date: '', reason: '' });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['doctorMetrics'],
    queryFn: async () => {
      const res = await api.get('/dashboard/doctor');
      return res.data.metrics;
    }
  });

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

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Leave request for date ${leaveForm.date} submitted for Hospital Admin approval.`);
    setLeaveForm({ date: '', reason: '' });
  };

  return (
    <DashboardLayout 
      title="Doctor Clinical Workspace" 
      role="Doctor" 
      tabs={doctorTabs} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
    >
      <div className="space-y-6">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Appointments Today</h3>
                <p className="text-3xl font-extrabold text-secondary mt-1">{isLoading ? '...' : metrics?.todays_appointments || 0}</p>
                <span className="text-[10px] text-secondary/60 font-medium">Out of 15 scheduled slots</span>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Pending Reports</h3>
                <p className="text-3xl font-extrabold text-orange-500 mt-1">{isLoading ? '...' : metrics?.pending_reports || 0}</p>
                <span className="text-[10px] text-secondary/60 font-medium">Require MedLens validation</span>
              </div>
              <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30">
                <h3 className="text-xs font-bold text-secondary mb-1 uppercase tracking-wider">Emergency Patients</h3>
                <p className="text-3xl font-extrabold text-red-500 mt-1">1</p>
                <span className="text-[10px] text-red-400 font-bold">⚠️ ICU bed requested</span>
              </div>
              <div className="p-6 bg-secondary text-white rounded-2xl shadow-clay border border-secondary flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold mb-1 uppercase tracking-wider">Consultation Load</h3>
                  <p className="text-sm font-semibold mt-2">{isLoading ? '...' : metrics?.ai_insights}</p>
                </div>
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
                      <th className="py-2.5 px-4 font-semibold">Gender/Age</th>
                      <th className="py-2.5 px-4 font-semibold">Chief Complaint</th>
                      <th className="py-2.5 px-4 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-dark">
                    <tr className="border-b border-accent/15 hover:bg-accent/10">
                      <td className="py-2.5 px-4 font-bold text-secondary">MC-2940</td>
                      <td className="py-2.5 px-4 font-bold">Patient Demo</td>
                      <td className="py-2.5 px-4">Male • 32y</td>
                      <td className="py-2.5 px-4 text-secondary/70">Elevated blood pressure, cholesterol review</td>
                      <td className="py-2.5 px-4">
                        <button 
                          onClick={() => {
                            setSelectedPatient({ name: 'Patient Demo', age: '32', gender: 'Male', history: 'Diagnosed with Hypertension in 2024. Drug allergies: Penicillin.' });
                            setActiveTab('consultation');
                          }}
                          className="px-3 py-1 bg-secondary text-white rounded-lg font-bold shadow hover:bg-[#00a892] transition-colors"
                        >
                          Start Visit
                        </button>
                      </td>
                    </tr>
                    <tr className="border-b border-accent/15 hover:bg-accent/10">
                      <td className="py-2.5 px-4 font-bold text-secondary">MC-2941</td>
                      <td className="py-2.5 px-4 font-bold">Rohan Sen</td>
                      <td className="py-2.5 px-4">Male • 45y</td>
                      <td className="py-2.5 px-4 text-secondary/70">Persistent dry cough, fever</td>
                      <td className="py-2.5 px-4">
                        <button 
                          onClick={() => {
                            setSelectedPatient({ name: 'Rohan Sen', age: '45', gender: 'Male', history: 'Non-smoker. Recurrent bronchitis.' });
                            setActiveTab('consultation');
                          }}
                          className="px-3 py-1 bg-secondary text-white rounded-lg font-bold shadow hover:bg-[#00a892]"
                        >
                          Start Visit
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PATIENT EMR RECORDS */}
        {activeTab === 'patients' && (
          <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-dark">Central EMR Database</h3>
              <input 
                type="text" 
                placeholder="Search patient by name, ID..." 
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                className="px-3 py-1.5 border border-accent/40 bg-accent/20 text-dark rounded-xl text-xs outline-none focus:ring-2 focus:ring-secondary w-64 shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 border-r border-accent/30 pr-6 space-y-3">
                <p className="text-[10px] font-bold text-secondary/60 uppercase tracking-wider">Patient Records Search Results</p>
                
                {[
                  { name: 'Patient Demo', age: '32', gender: 'Male', id: 'P-98402' },
                  { name: 'Rohan Sen', age: '45', gender: 'Male', id: 'P-98403' },
                  { name: 'Shreya Patel', age: '28', gender: 'Female', id: 'P-98404' }
                ].filter(p => p.name.toLowerCase().includes(patientSearch.toLowerCase())).map((p, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedPatient({ ...p, history: 'Hypertension, High Cholesterol, Penicillin allergy.' })}
                    className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${selectedPatient?.name === p.name ? 'bg-accent border-secondary/30' : 'bg-accent/20 border-accent/15'}`}
                  >
                    <h4 className="font-bold text-xs text-dark">{p.name}</h4>
                    <p className="text-[10px] text-secondary/60 mt-1">{p.id} • {p.gender} • {p.age} years</p>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-2 space-y-4">
                {selectedPatient ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-accent/20 border border-accent/15 rounded-xl">
                      <h4 className="font-bold text-xs text-dark mb-2">Clinical Profile: {selectedPatient.name}</h4>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-secondary/70 font-medium">Record ID</span>
                          <p className="font-bold">{selectedPatient.id || 'P-98402'}</p>
                        </div>
                        <div>
                          <span className="text-secondary/70 font-medium">Gender/Age</span>
                          <p className="font-bold">{selectedPatient.gender} • {selectedPatient.age}y</p>
                        </div>
                        <div>
                          <span className="text-secondary/70 font-medium">Allergies</span>
                          <p className="font-bold text-red-500">Penicillin</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border border-accent/35 rounded-xl space-y-2">
                      <h4 className="font-bold text-xs text-dark">Medical History</h4>
                      <p className="text-xs text-secondary/80 leading-relaxed">{selectedPatient.history}</p>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setActiveTab('consultation')} className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow hover:bg-[#00a892]">
                        Prescribe & Diagnose
                      </button>
                      <button onClick={() => alert("Downloading EMR history PDF...")} className="px-4 py-2 border border-accent/40 rounded-xl text-xs font-bold text-secondary hover:bg-accent/40">
                        Export EMR (PDF)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-accent/35 rounded-xl">
                    <span className="text-4xl mb-2">📁</span>
                    <p className="text-xs text-secondary/60">Select a patient profile from the directory to review their medical file.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CONSULTATION & PRESCRIPTION */}
        {activeTab === 'consultation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Consultation Intake */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-2 space-y-6">
              <div className="flex justify-between items-center border-b border-accent/20 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-dark">Clinical Prescription Editor</h3>
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
                    className="px-3 py-1.5 bg-accent text-secondary rounded-xl text-xs font-bold flex items-center gap-1 hover:opacity-90 disabled:opacity-50"
                  >
                    ✨ AI Autocomplete
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1">Clinical Diagnosis</label>
                  <input 
                    type="text"
                    value={consultationForm.diagnosis}
                    onChange={(e) => setConsultationForm({...consultationForm, diagnosis: e.target.value})}
                    placeholder="Enter final diagnosis..."
                    className="w-full text-xs px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1">Prescription Details</label>
                  <textarea 
                    value={consultationForm.prescriptionText}
                    onChange={(e) => setConsultationForm({...consultationForm, prescriptionText: e.target.value})}
                    placeholder="Type drug dosage, duration, schedule (e.g. Tab. Paracetamol 500mg 1-0-1)..."
                    className="w-full text-xs h-32 p-3 bg-accent/20 border-none rounded-xl focus:ring-2 focus:ring-secondary resize-none shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1">Lab Referrals</label>
                    <select 
                      value={consultationForm.labTests}
                      onChange={(e) => setConsultationForm({...consultationForm, labTests: e.target.value})}
                      className="w-full text-xs px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option>None</option>
                      <option>CBC (Complete Blood Count)</option>
                      <option>Fast Glucose & HbA1c</option>
                      <option>Lipid Panel Profile</option>
                      <option>Chest X-Ray</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1">Follow-up Date</label>
                    <input 
                      type="date"
                      value={consultationForm.followUp}
                      onChange={(e) => setConsultationForm({...consultationForm, followUp: e.target.value})}
                      className="w-full text-xs px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1">Lifestyle Advice / Remarks</label>
                  <input 
                    type="text"
                    value={consultationForm.advice}
                    onChange={(e) => setConsultationForm({...consultationForm, advice: e.target.value})}
                    placeholder="General advice (diet, activity)..."
                    className="w-full text-xs px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <button 
                  onClick={() => {
                    alert("Prescription submitted, logged, and synchronized with Patient EMR.");
                    setConsultationForm({ diagnosis: '', prescriptionText: '', labTests: 'None', followUp: '', advice: '' });
                  }}
                  className="w-full py-3 bg-secondary text-white font-bold rounded-xl shadow-md hover:bg-[#00a892] transition-colors text-xs"
                >
                  🚀 SUBMIT CONSULTATION RECORD
                </button>
              </div>
            </div>

            {/* AI Diagnosis recommendations */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6 lg:col-span-1">
              <h3 className="text-sm font-bold text-dark">AI Diagnostic Assistant</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-accent/40 border border-secondary/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Suggested Diagnosis</h4>
                  <p className="text-xs text-dark font-semibold">Based on chief complaint, AI suggests checking for **Viral Bronchitis** or **Upper Respiratory Infection**.</p>
                </div>

                <div className="p-4 bg-accent/30 border border-secondary/20 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">Risk Factors</h4>
                  <ul className="list-disc pl-4 text-xs text-dark space-y-1">
                    <li>Mild dehydration</li>
                    <li>Slight risk of secondary pneumonia due to cough duration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REVIEW AI REPORTS */}
        {activeTab === 'medlens_review' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List to review */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-1 space-y-4">
              <h3 className="text-sm font-bold text-dark">Pending Lab Reports ({reportsToReview.length})</h3>
              <div className="space-y-3">
                {reportsToReview.length === 0 ? (
                  <p className="text-xs text-secondary/60 italic">No reports pending review.</p>
                ) : (
                  reportsToReview.map((rep) => (
                    <div 
                      key={rep.id} 
                      onClick={() => setSelectedReport(rep)}
                      className={`p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all ${selectedReport?.id === rep.id ? 'bg-accent border-secondary/30' : 'bg-accent/20 border-accent/15'}`}
                    >
                      <h4 className="font-bold text-xs text-dark">{rep.patientName}</h4>
                      <p className="text-[10px] text-secondary/60 mt-1">{rep.reportType} • {rep.uploadDate}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Review Pane */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 lg:col-span-2">
              <h3 className="text-sm font-bold text-dark mb-4">MedLens Verification Pane</h3>

              {selectedReport ? (
                <div className="space-y-4">
                  <div className="p-3 bg-accent/20 border border-accent/15 rounded-xl text-xs space-y-1">
                    <p className="font-bold">Raw OCR Document Readout</p>
                    <p className="text-[10px] text-secondary/60 font-mono bg-white p-2.5 rounded border border-accent/20">{selectedReport.ocrText}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-accent/35 border border-secondary/20 rounded-xl">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">AI Report Summary</p>
                      <p className="text-xs text-dark">{selectedReport.summary}</p>
                    </div>
                    <div className="p-3 bg-accent/20 border border-secondary/25 rounded-xl">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-1">Abnormal Findings</p>
                      <ul className="list-disc pl-4 text-xs text-dark space-y-0.5">
                        {selectedReport.abnormal.map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 border border-accent/35 rounded-xl">
                    <label className="block text-xs font-bold text-secondary/60 uppercase tracking-wider mb-1">Adjust Recommendations</label>
                    <textarea 
                      value={selectedReport.recommendations.join('\n')}
                      onChange={(e) => {
                        const recs = e.target.value.split('\n');
                        setSelectedReport({...selectedReport, recommendations: recs});
                      }}
                      className="w-full text-xs h-24 p-3 bg-accent/20 border-none rounded-xl focus:ring-2 focus:ring-secondary resize-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApproveReport(selectedReport.id)}
                      className="px-4 py-2 bg-secondary text-white rounded-xl text-xs font-bold shadow hover:bg-[#00a892]"
                    >
                      Approve & Log Report
                    </button>
                    <button 
                      onClick={() => setSelectedReport(null)}
                      className="px-4 py-2 border border-accent/40 rounded-xl text-xs font-bold text-secondary hover:bg-accent/40"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-center border-2 border-dashed border-accent/35 rounded-xl">
                  <span className="text-4xl mb-2">📋</span>
                  <p className="text-xs text-secondary/60">Select a pending lab report from the list to review, edit, and approve.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: DUTY SCHEDULE */}
        {activeTab === 'schedules' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Availability and working hours config */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-6">
              <h3 className="text-sm font-bold text-dark">Active Duty Status</h3>
              
              <div className="flex items-center justify-between p-4 bg-accent/20 rounded-2xl border border-accent/15">
                <div>
                  <span className="text-xs font-bold text-dark">Consultation Availability Status</span>
                  <p className="text-[10px] text-secondary/60">Toggle off to pause bookings for today</p>
                </div>
                <button 
                  onClick={() => setAvailability(!availability)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${availability ? 'bg-secondary text-white hover:bg-[#00a892]' : 'bg-red-500 text-white hover:bg-red-600'}`}
                >
                  {availability ? 'ONLINE AVAILABILITY: ON' : 'OFFLINE: PAUSED'}
                </button>
              </div>

              <div>
                <span className="text-xs font-bold text-secondary/60 uppercase tracking-wider block mb-2">Current Rota Hours</span>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-dark">
                  <div className="p-3 bg-accent/20 border border-accent/15 rounded-xl">
                    <p className="text-secondary/60 text-[10px]">Start Shift</p>
                    <p className="text-sm mt-1">09:00 AM</p>
                  </div>
                  <div className="p-3 bg-accent/20 border border-accent/15 rounded-xl">
                    <p className="text-secondary/60 text-[10px]">End Shift</p>
                    <p className="text-sm mt-1">05:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Requests form */}
            <div className="p-6 bg-white rounded-2xl shadow-clay border border-accent/30 space-y-4">
              <h3 className="text-sm font-bold text-dark">Request Leave / Out of Office</h3>
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-secondary/60 mb-1">Select Leave Date</label>
                  <input 
                    type="date"
                    value={leaveForm.date}
                    onChange={(e) => setLeaveForm({...leaveForm, date: e.target.value})}
                    className="w-full text-xs px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary/60 mb-1">Reason for Absence</label>
                  <input 
                    type="text"
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    placeholder="Medical, Personal, Seminar..."
                    className="w-full text-xs px-3 py-2 border border-accent/40 rounded-xl bg-white outline-none focus:ring-2 focus:ring-secondary"
                    required
                  />
                </div>

                <button type="submit" className="w-full py-2.5 bg-secondary hover:bg-[#00a892] text-white font-bold rounded-xl shadow-md text-xs transition-colors">
                  Submit Leave Request
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
