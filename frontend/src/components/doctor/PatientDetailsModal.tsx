import React from 'react';
import { 
  XMarkIcon, 
  SparklesIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  BeakerIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface PatientDetailsModalProps {
  patient: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientDetailsModal({ patient, isOpen, onClose }: PatientDetailsModalProps) {
  if (!isOpen || !patient) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 transition-opacity" 
        onClick={onClose}
      />
      
      {/* Side Drawer */}
      <div className={`fixed right-0 top-0 h-screen w-full max-w-2xl bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-accent/20 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-black text-xl shadow-md">
              {patient.full_name ? patient.full_name.charAt(0) : 'P'}
            </div>
            <div>
              <h2 className="text-2xl font-black text-dark tracking-tight">{patient.full_name || 'Patient Name'}</h2>
              <p className="text-sm font-medium text-secondary/80">
                {patient.age} yrs • {patient.gender} • ID: {patient.id || 'N/A'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5 transition-colors text-secondary"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-accent/5">
          
          {/* AI Summary Banner */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-5 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden group">
            <div className="flex items-center space-x-2 mb-3">
              <SparklesIcon className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-dark">AI Clinical Summary</h3>
            </div>
            <p className="text-sm text-dark leading-relaxed">
              Patient presents with acute chest pain and shortness of breath. Elevated heart rate observed. High risk of cardiovascular event. Recommend immediate ECG and cardiology consult. Avoid NSAIDs due to prior gastric ulcer history.
            </p>
            {/* Decorative shine */}
            <div className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 group-hover:left-[200%] transition-all duration-1000"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Vitals */}
            <div className="bg-white p-5 rounded-[22px] border border-accent/20 shadow-clay">
              <div className="flex items-center space-x-2 mb-4">
                <HeartIcon className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-dark">Current Vitals</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent/5 p-3 rounded-xl border border-accent/10">
                  <p className="text-xs text-secondary mb-1">Blood Pressure</p>
                  <p className="font-black text-dark text-lg">140/90 <span className="text-[10px] text-red-500 font-bold ml-1">HIGH</span></p>
                </div>
                <div className="bg-accent/5 p-3 rounded-xl border border-accent/10">
                  <p className="text-xs text-secondary mb-1">Heart Rate</p>
                  <p className="font-black text-dark text-lg">98 <span className="text-[10px] text-orange-500 font-bold ml-1">ELEVATED</span></p>
                </div>
                <div className="bg-accent/5 p-3 rounded-xl border border-accent/10">
                  <p className="text-xs text-secondary mb-1">Temperature</p>
                  <p className="font-black text-dark text-lg">98.6°F</p>
                </div>
                <div className="bg-accent/5 p-3 rounded-xl border border-accent/10">
                  <p className="text-xs text-secondary mb-1">SpO2</p>
                  <p className="font-black text-dark text-lg">97%</p>
                </div>
              </div>
            </div>

            {/* Alerts & Allergies */}
            <div className="bg-white p-5 rounded-[22px] border border-accent/20 shadow-clay">
              <div className="flex items-center space-x-2 mb-4">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-dark">Allergies & Alerts</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-700">
                  <p className="text-xs font-bold uppercase mb-1">Allergies</p>
                  <p className="text-sm font-medium">Penicillin, Peanuts</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl text-orange-700">
                  <p className="text-xs font-bold uppercase mb-1">Medical Alerts</p>
                  <p className="text-sm font-medium">History of Gastric Ulcers (2024)</p>
                </div>
              </div>
            </div>
            
          </div>

          {/* Medical History Timeline */}
          <div className="bg-white p-6 rounded-[22px] border border-accent/20 shadow-clay">
            <div className="flex items-center space-x-2 mb-6">
              <ClockIcon className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-dark">Medical Timeline</h3>
            </div>
            
            <div className="relative border-l-2 border-accent/20 ml-3 space-y-6">
              
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary"></span>
                <p className="text-xs font-bold text-primary mb-1">Yesterday, 10:00 AM</p>
                <div className="bg-accent/5 p-4 rounded-xl border border-accent/10">
                  <p className="font-bold text-dark text-sm mb-2">Lab Test: Lipid Panel</p>
                  <p className="text-sm text-secondary">Results reviewed. High LDL noted.</p>
                  <button className="mt-2 text-xs font-bold text-primary flex items-center hover:underline">
                    <BeakerIcon className="w-3 h-3 mr-1" /> View Report
                  </button>
                </div>
              </div>

              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-secondary"></span>
                <p className="text-xs font-bold text-secondary mb-1">Dec 12, 2025</p>
                <div className="bg-accent/5 p-4 rounded-xl border border-accent/10">
                  <p className="font-bold text-dark text-sm mb-2">Consultation: Dr. Smith</p>
                  <p className="text-sm text-secondary">Follow-up for hypertension. Prescribed Amlodipine 5mg.</p>
                  <button className="mt-2 text-xs font-bold text-primary flex items-center hover:underline">
                    <DocumentTextIcon className="w-3 h-3 mr-1" /> View Prescription
                  </button>
                </div>
              </div>

            </div>
          </div>
          
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 border-t border-accent/20 bg-white flex space-x-4">
          <button className="flex-1 bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5">
            Start Consultation
          </button>
          <button 
            onClick={onClose}
            className="flex-1 bg-accent/10 text-dark py-3 rounded-xl font-bold hover:bg-accent/20 transition-all"
          >
            Close
          </button>
        </div>

      </div>
    </>
  );
}
