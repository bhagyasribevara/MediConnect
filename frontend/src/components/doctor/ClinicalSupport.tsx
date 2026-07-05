import React from 'react';
import { 
  SparklesIcon, 
  BeakerIcon, 
  DocumentTextIcon, 
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ArrowDownTrayIcon,
  VideoCameraIcon,
  ArrowRightCircleIcon
} from '@heroicons/react/24/outline';

const ClayCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-[22px] shadow-clay border border-accent/20 transition-all duration-300 p-6 ${className}`}>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: AI Clinical Decision Support
export function AIClinicalDecision() {
  const patient = {
    name: 'Emily Chen',
    prediction: 'Acute Bronchitis',
    confidence: 89,
    specialist: 'Pulmonologist',
    tests: ['Chest X-Ray', 'CBC'],
    emergencyLevel: 'Moderate',
    medicineAlerts: 'Avoid Penicillin',
    allergyAlerts: 'Dust, Penicillin',
    interactionWarning: 'None',
    admission: 'Not Required',
  };

  return (
    <ClayCard>
      <div className="flex items-center space-x-2 mb-6">
        <SparklesIcon className="w-6 h-6 text-primary" />
        <h2 className="text-lg font-bold text-dark">AI Clinical Decision Support</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-black text-dark mb-1">{patient.name}</h3>
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{patient.prediction}</span>
            <span className="text-xs font-bold text-green-600 bg-green-500/10 px-2 py-1 rounded-full">{patient.confidence}% Confidence</span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between border-b border-accent/10 pb-2">
              <span className="text-sm text-secondary">Suggested Specialist</span>
              <span className="text-sm font-bold text-dark">{patient.specialist}</span>
            </div>
            <div className="flex justify-between border-b border-accent/10 pb-2">
              <span className="text-sm text-secondary">Recommended Tests</span>
              <span className="text-sm font-bold text-dark">{patient.tests.join(', ')}</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-sm text-secondary">Admission Recommendation</span>
              <span className="text-sm font-bold text-dark">{patient.admission}</span>
            </div>
          </div>
        </div>

        <div className="bg-accent/5 p-4 rounded-xl border border-accent/10 space-y-3">
          <div className="flex items-start space-x-3 text-orange-600">
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Allergy Alerts</p>
              <p className="text-xs">{patient.allergyAlerts}</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-red-600">
            <ShieldExclamationIcon className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Medicine Alerts</p>
              <p className="text-xs">{patient.medicineAlerts}</p>
            </div>
          </div>

          <div className="pt-4 flex space-x-3">
            <button className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-primary to-secondary text-white py-2 rounded-xl font-bold hover:shadow-md transition-all">
              <VideoCameraIcon className="w-5 h-5" />
              <span>Start Consult</span>
            </button>
            <button className="flex-1 flex items-center justify-center space-x-2 bg-white border border-accent/20 text-dark py-2 rounded-xl font-bold hover:bg-accent/5 transition-all">
              <ArrowRightCircleIcon className="w-5 h-5 text-secondary" />
              <span>Refer</span>
            </button>
          </div>
        </div>
      </div>
    </ClayCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: MedLens AI Reports
export function MedLensReports({ reports = [] }: { reports?: any[] }) {
  const defaultReports = [
    { id: 101, patient: 'Aarav Kumar', type: 'Blood Report', date: 'Today, 09:30 AM', status: 'Pending Review', abnormal: 'Glucose: 155 mg/dL', critical: true },
    { id: 102, patient: 'Priya Sharma', type: 'Lipid Panel', date: 'Today, 08:15 AM', status: 'Reviewed', abnormal: 'LDL: 160 mg/dL', critical: false },
  ];

  const data = reports.length > 0 ? reports : defaultReports;

  return (
    <ClayCard>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <DocumentTextIcon className="w-6 h-6 text-purple-500" />
          <h2 className="text-lg font-bold text-dark">MedLens AI Reports</h2>
        </div>
        <span className="text-xs font-bold bg-purple-500/10 text-purple-600 px-3 py-1 rounded-full">3 Pending</span>
      </div>

      <div className="space-y-4">
        {data.map((r, idx) => (
          <div key={idx} className={`p-4 rounded-xl border transition-all ${r.critical ? 'bg-red-500/5 border-red-500/20' : 'bg-white border-accent/20 hover:border-primary/30'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-bold text-dark">{r.patient}</h4>
                <p className="text-xs text-secondary">{r.type} • {r.date}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${r.status === 'Reviewed' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                {r.status}
              </span>
            </div>
            
            {r.abnormal && (
              <div className="mt-3 text-sm bg-white/50 p-2 rounded-lg border border-red-500/10 text-red-600 flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span><span className="font-bold">Abnormal:</span> {r.abnormal}</span>
              </div>
            )}
            
            <button className="mt-4 w-full py-2 bg-purple-500/10 text-purple-700 rounded-lg text-sm font-bold hover:bg-purple-500/20 transition-colors">
              Open Report Analysis
            </button>
          </div>
        ))}
      </div>
    </ClayCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: Lab Reports
export function LabReports() {
  const labs = [
    { id: 1, patient: 'Michael Brown', test: 'Complete Blood Count (CBC)', status: 'Completed', date: '2026-07-05', critical: false },
    { id: 2, patient: 'Emily Chen', test: 'Chest X-Ray', status: 'Pending', date: '2026-07-05', critical: false },
    { id: 3, patient: 'John Doe', test: 'ECG', status: 'Completed', date: '2026-07-05', critical: true },
  ];

  return (
    <ClayCard>
      <div className="flex items-center space-x-2 mb-6">
        <BeakerIcon className="w-6 h-6 text-blue-500" />
        <h2 className="text-lg font-bold text-dark">Lab Reports</h2>
      </div>

      <div className="space-y-3">
        {labs.map((lab) => (
          <div key={lab.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/5 border border-transparent hover:border-accent/10 transition-colors">
            <div>
              <p className="font-bold text-dark text-sm flex items-center space-x-2">
                <span>{lab.patient}</span>
                {lab.critical && <span className="w-2 h-2 rounded-full bg-red-500" title="Critical Result"></span>}
              </p>
              <p className="text-xs text-secondary">{lab.test}</p>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase mb-1 ${lab.status === 'Completed' ? 'bg-green-500/10 text-green-600' : 'bg-orange-500/10 text-orange-600'}`}>
                {lab.status}
              </span>
              {lab.status === 'Completed' && (
                <button className="text-primary hover:text-secondary transition-colors" title="Download Report">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </ClayCard>
  );
}
