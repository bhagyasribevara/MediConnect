import React from 'react';
import { 
  ArrowUpIcon, 
  ArrowDownIcon, 
  VideoCameraIcon, 
  DocumentMagnifyingGlassIcon,
  BeakerIcon,
  PencilSquareIcon,
  ArrowRightCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const ClayCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-[22px] shadow-clay border border-accent/20 transition-all duration-300 p-6 ${className}`}>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: AI Priority Queue
export function AIPriorityQueue({ onPatientClick }: { onPatientClick?: (patient: any) => void }) {
  const priorityPatients = [
    { id: 1, priority: 'Red', name: 'John Doe', riskScore: 92, symptoms: 'Severe Chest Pain, SOB', waitTime: '5m', rec: 'Immediate ECG & Consult', status: 'Waiting' },
    { id: 2, priority: 'Orange', name: 'Sarah Smith', riskScore: 78, symptoms: 'High Fever, BP 180/110', waitTime: '12m', rec: 'Administer Antipyretic', status: 'Vitals Taken' },
    { id: 3, priority: 'Green', name: 'Mike Johnson', riskScore: 34, symptoms: 'Mild cough, sore throat', waitTime: '25m', rec: 'Routine Consult', status: 'Waiting' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Red': return 'bg-red-500/20 text-red-700 border-red-500/30';
      case 'Orange': return 'bg-orange-500/20 text-orange-700 border-orange-500/30';
      case 'Green': return 'bg-green-500/20 text-green-700 border-green-500/30';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <ClayCard>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-dark">AI Priority Queue</h2>
        <button className="text-sm font-bold text-primary hover:underline">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-accent/20">
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider">Priority</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider">Patient</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider">Risk Score</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider">Symptoms</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider">Wait Time</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider">AI Recommendation</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {priorityPatients.map((patient) => (
              <tr 
                key={patient.id} 
                className="border-b border-accent/10 hover:bg-accent/5 transition-colors cursor-pointer group"
                onClick={() => onPatientClick && onPatientClick(patient)}
              >
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getPriorityColor(patient.priority)}`}>
                    {patient.priority}
                  </span>
                </td>
                <td className="py-3 px-4 font-bold text-dark group-hover:text-primary transition-colors">{patient.name}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-1.5 bg-accent/20 rounded-full w-16">
                      <div className={`h-full rounded-full ${patient.riskScore > 80 ? 'bg-red-500' : patient.riskScore > 60 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${patient.riskScore}%` }}></div>
                    </div>
                    <span className="text-xs font-bold text-dark">{patient.riskScore}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-secondary truncate max-w-[150px]">{patient.symptoms}</td>
                <td className="py-3 px-4 text-sm font-medium text-red-500">{patient.waitTime}</td>
                <td className="py-3 px-4 text-sm text-secondary truncate max-w-[200px]">{patient.rec}</td>
                <td className="py-3 px-4">
                  <span className="text-xs font-medium bg-accent/10 px-2 py-1 rounded-md text-secondary/80">
                    {patient.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ClayCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Patient Consultation Queue
export function ConsultationQueue({ queue = [], updateQueueStatus, onPatientClick }: { queue: any[], updateQueueStatus?: (id: number, status: string) => void, onPatientClick?: (patient: any) => void }) {
  
  const normalizedQueue = queue.length > 0 ? queue.map((item: any) => ({
    queue_id: item.queue_id || item.id || Math.random(),
    appointment: item.appointment || {
      id: item.appointment_id,
      token_number: item.queue_number ? `A-${item.queue_number}` : 'N/A',
      patient: { 
        full_name: item.patient_name || 'Unknown', 
        age: 30, 
        gender: 'Unknown' 
      },
      symptoms: item.symptoms || 'Not specified',
      priority: 'Normal',
      status: (item.status || 'waiting').toLowerCase().replace(' ', '_')
    }
  })) : [
    { queue_id: 101, appointment: { id: 1, token_number: 'A-01', patient: { full_name: 'Robert Fox', age: 45, gender: 'Male' }, symptoms: 'Back pain, fever', priority: 'Normal', appointment_date: '2026-07-05T10:00:00Z', status: 'waiting' } },
    { queue_id: 102, appointment: { id: 2, token_number: 'A-02', patient: { full_name: 'Jane Cooper', age: 32, gender: 'Female' }, symptoms: 'Migraine', priority: 'High', appointment_date: '2026-07-05T10:15:00Z', status: 'in_progress' } },
  ];

  return (
    <ClayCard className="overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-lg font-bold text-dark">Patient Consultation Queue</h2>
        <div className="flex space-x-2">
          <input type="text" placeholder="Search queue..." className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
          <select className="bg-accent/5 border border-accent/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 text-secondary">
            <option>All Status</option>
            <option>Waiting</option>
            <option>In Progress</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-accent/5 border-y border-accent/10">
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase">Token</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase">Patient Info</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase">Symptoms / Vitals</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase">Status</th>
              <th className="py-3 px-4 text-xs font-bold text-secondary uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {normalizedQueue.map((item) => (
              <tr key={item.queue_id} className="border-b border-accent/10 hover:bg-accent/5 transition-colors group">
                <td className="py-4 px-4 font-bold text-primary">{item.appointment.token_number}</td>
                <td className="py-4 px-4 cursor-pointer" onClick={() => onPatientClick && onPatientClick(item.appointment.patient)}>
                  <p className="font-bold text-dark group-hover:text-primary transition-colors">{item.appointment.patient.full_name}</p>
                  <p className="text-xs text-secondary">{item.appointment.patient.age} yrs • {item.appointment.patient.gender}</p>
                </td>
                <td className="py-4 px-4">
                  <p className="text-sm text-dark truncate max-w-[200px]">{item.appointment.symptoms}</p>
                  <p className="text-xs text-secondary mt-0.5">BP: 120/80 • HR: 72</p>
                </td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    item.appointment.status === 'in_progress' ? 'bg-blue-500/10 text-blue-600' :
                    item.appointment.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                    'bg-orange-500/10 text-orange-600'
                  }`}>
                    {item.appointment.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20" title="Start Visit">
                      <VideoCameraIcon className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="View EMR">
                      <DocumentMagnifyingGlassIcon className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20" title="MedLens Report">
                      <DocumentTextIcon className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" title="Lab Orders">
                      <BeakerIcon className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20" title="Prescribe">
                      <PencilSquareIcon className="w-5 h-5" />
                    </button>
                    <button className="p-1.5 rounded-lg bg-gray-500/10 text-gray-600 hover:bg-gray-500/20" title="Refer Patient">
                      <ArrowRightCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ClayCard>
  );
}
