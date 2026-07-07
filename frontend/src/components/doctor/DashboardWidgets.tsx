import React from 'react';
import {
  UsersIcon,
  CheckCircleIcon,
  UserMinusIcon,
  BoltIcon,
  CheckBadgeIcon,
  ClockIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BellIcon,
  BeakerIcon,
  DocumentTextIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

const ClayCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-[22px] shadow-clay border border-accent/20 hover:shadow-clay-hover hover:-translate-y-0.5 transition-all duration-300 p-6 ${className}`}>
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: AI Health Summary
export function AIHealthSummary() {
  const metrics: any[] = [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {metrics.length === 0 && <div className="text-secondary/70 p-4">No Data Available</div>}
      {metrics.map((m, idx) => (
        <ClayCard key={idx} className="flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${m.bg}`}>
              <m.icon className={`w-6 h-6 ${m.color}`} />
            </div>
            <div className={`flex items-center space-x-1 text-sm font-bold px-2 py-1 rounded-full ${m.up ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
              {m.up ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
              <span>{m.trend}</span>
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-black text-dark tracking-tight">{m.value}</h3>
            <p className="text-sm font-medium text-secondary/70 mt-1">{m.label}</p>
          </div>
          {/* Decorative mini gradient line */}
          <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary/50 to-secondary/50 w-0 group-hover:w-full transition-all duration-500"></div>
        </ClayCard>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Today's Doctor Summary
export function DoctorSummary() {
  const stats: any[] = [];

  return (
    <ClayCard>
      <div className="flex items-center space-x-2 mb-6">
        <ChartPieIcon className="w-6 h-6 text-primary" />
        <h2 className="text-lg font-bold text-dark">Today's Doctor Summary</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.length === 0 && <div className="text-secondary/70 p-4 col-span-4">No Data Available</div>}
        {stats.map((s, idx) => (
          <div key={idx} className="p-4 rounded-xl bg-accent/5 border border-accent/10 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-black text-dark">{s.value}</p>
            <p className="text-xs font-medium text-secondary/70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </ClayCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3 & 4: Live OPD Load & 7-Day Forecast (Mocked layout for charts)
export function OPDLoadAndForecast() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ClayCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <UsersIcon className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold text-dark">Live OPD Load</h2>
          </div>
          <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full">Peak: 11:00 AM</span>
        </div>
        <div className="h-48 w-full bg-accent/5 rounded-xl border border-accent/10 flex items-center justify-center relative overflow-hidden">
          {/* Mock Line Chart */}
          <svg className="w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 100 100">
            <path d="M0,80 Q10,70 20,80 T40,60 T60,90 T80,40 T100,50 L100,100 L0,100 Z" fill="url(#opd-grad)" />
            <path d="M0,80 Q10,70 20,80 T40,60 T60,90 T80,40 T100,50" fill="none" stroke="var(--color-primary)" strokeWidth="2" />
            <defs>
              <linearGradient id="opd-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.5" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <p className="absolute text-sm font-bold text-secondary/50">Hourly Forecast Chart</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div><p className="text-sm text-secondary/70">Current Queue</p><p className="text-xl font-bold text-dark">12</p></div>
          <div><p className="text-sm text-secondary/70">Predicted</p><p className="text-xl font-bold text-dark">45</p></div>
          <div><p className="text-sm text-secondary/70">Est. Wait</p><p className="text-xl font-bold text-red-500">22m</p></div>
        </div>
      </ClayCard>

      <ClayCard>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="w-6 h-6 text-secondary" />
            <h2 className="text-lg font-bold text-dark">7-Day Patient Footfall</h2>
          </div>
          <span className="text-xs font-bold bg-green-500/10 text-green-600 px-3 py-1 rounded-full">94% Confidence</span>
        </div>
        <div className="space-y-3">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-accent/5 transition-colors border border-transparent hover:border-accent/10">
              <span className="w-10 font-bold text-dark">{day}</span>
              <div className="flex-1 px-4">
                <div className="h-2 w-full bg-accent/20 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${idx === 1 ? 'bg-red-500 w-4/5' : idx === 3 ? 'bg-orange-500 w-3/5' : 'bg-primary w-2/5'}`}></div>
                </div>
              </div>
              <span className="w-12 text-right font-bold text-sm text-dark">{40 + (idx * 5)}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-secondary/80 bg-accent/10 p-3 rounded-xl border border-accent/20">
          <strong className="text-dark">AI Suggestion:</strong> High demand expected on Tuesday. Recommend opening 2 extra tele-consultation slots.
        </p>
      </ClayCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 10 & 11: AI Insights & Alert Center
export function InsightsAndAlerts() {
  const alerts: any[] = [];

  const insights: any[] = [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ClayCard>
        <div className="flex items-center space-x-2 mb-6">
          <SparklesIcon className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-bold text-dark">AI Insights Panel</h2>
        </div>
        <ul className="space-y-4">
          {insights.map((insight, idx) => (
            <li key={idx} className="flex items-start space-x-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/10">
              <SparklesIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-dark">{insight}</span>
            </li>
          ))}
        </ul>
      </ClayCard>

      <ClayCard>
        <div className="flex items-center space-x-2 mb-6">
          <BellIcon className="w-6 h-6 text-red-500" />
          <h2 className="text-lg font-bold text-dark">Alert Center</h2>
        </div>
        <ul className="space-y-3">
          {alerts.map((alert, idx) => (
            <li key={idx} className={`flex items-start space-x-3 p-4 rounded-xl border border-white ${alert.bg}`}>
              <alert.icon className={`w-5 h-5 ${alert.color} shrink-0 mt-0.5`} />
              <span className={`text-sm font-bold ${alert.color}`}>{alert.text}</span>
            </li>
          ))}
        </ul>
      </ClayCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 12: Quick Actions
export function QuickActions() {
  const actions = [
    { label: "Start Consultation", icon: VideoCameraIcon, color: "text-white", bg: "bg-gradient-to-r from-primary to-secondary text-white border-transparent" },
    { label: "Generate Prescription", icon: PencilSquareIcon, color: "text-primary", bg: "bg-white border-primary/20 text-dark hover:bg-primary/5" },
    { label: "Order Lab Test", icon: BeakerIcon, color: "text-secondary", bg: "bg-white border-secondary/20 text-dark hover:bg-secondary/5" },
    { label: "View EMR", icon: DocumentTextIcon, color: "text-dark", bg: "bg-white border-accent/20 text-dark hover:bg-accent/10" },
    { label: "Emergency Admission", icon: BoltIcon, color: "text-red-600", bg: "bg-red-500/10 border-red-500/20 text-red-700 hover:bg-red-500/20" },
  ];

  return (
    <ClayCard>
      <h2 className="text-lg font-bold text-dark mb-6">Quick Actions</h2>
      <div className="flex flex-wrap gap-4">
        {actions.map((action, idx) => (
          <button key={idx} className={`flex items-center space-x-2 px-6 py-3 rounded-2xl border font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${action.bg}`}>
            <action.icon className={`w-5 h-5 ${action.color}`} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </ClayCard>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 13: Doctor Performance
export function DoctorPerformance() {
  return (
    <ClayCard>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <CheckBadgeIcon className="w-6 h-6 text-green-500" />
          <h2 className="text-lg font-bold text-dark">Performance Metrics</h2>
        </div>
        <span className="text-sm font-bold text-secondary/70">This Week</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div>
          <p className="text-sm font-medium text-secondary/70">Avg Consultation Time</p>
          <p className="text-2xl font-black text-dark mt-1">12m 30s</p>
          <p className="text-xs font-bold text-green-500 mt-1 flex items-center"><ArrowTrendingDownIcon className="w-3 h-3 mr-1" /> -1m 15s</p>
        </div>
        <div>
          <p className="text-sm font-medium text-secondary/70">AI Reports Reviewed</p>
          <p className="text-2xl font-black text-dark mt-1">42</p>
          <p className="text-xs font-bold text-green-500 mt-1 flex items-center"><ArrowTrendingUpIcon className="w-3 h-3 mr-1" /> +8 this week</p>
        </div>
        <div>
          <p className="text-sm font-medium text-secondary/70">Patient Satisfaction</p>
          <p className="text-2xl font-black text-dark mt-1">4.9/5.0</p>
          <p className="text-xs font-bold text-secondary mt-1">Based on 120 reviews</p>
        </div>
      </div>
    </ClayCard>
  );
}
