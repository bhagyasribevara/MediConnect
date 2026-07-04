/**
 * MediConnect 360 — AI Prediction API Service
 * =============================================
 * Dedicated API service for all AI/ML prediction endpoints.
 */

import api from './api';

// ─── Appointment Predictions ────────────────────────────────────
export const predictNoShow = (patientData: Record<string, any>) =>
  api.post('/predict/appointments', patientData);

export const getAppointmentLoad = (date?: string) =>
  api.get('/predict/appointments/load', { params: date ? { date } : {} });

export const getFootfall = (days: number = 7) =>
  api.get('/predict/appointments/footfall', { params: { days } });

// ─── Medicine Predictions ───────────────────────────────────────
export const getMedicineDemand = (medicineData: Record<string, any>) =>
  api.post('/predict/medicine/demand', medicineData);

export const getLowStock = () =>
  api.get('/predict/medicine/lowstock');

export const getExpiryRisk = () =>
  api.get('/predict/medicine/expiry');

// ─── Symptom / Disease Predictions ──────────────────────────────
export const predictDisease = (symptoms: string[]) =>
  api.post('/predict/symptoms', { symptoms });

export const getSymptomsList = () =>
  api.get('/predict/symptoms/list');

export const getDiseaseInfo = (disease: string) =>
  api.get(`/predict/symptoms/info/${encodeURIComponent(disease)}`);

// ─── District / Outbreak Predictions ────────────────────────────
export const predictOutbreak = (data: Record<string, any>) =>
  api.post('/predict/outbreak', data);

export const predictBedOccupancy = (data: Record<string, any>) =>
  api.post('/predict/bed', data);

export const predictPatientLoad = (data: Record<string, any>) =>
  api.post('/predict/patientload', data);

export const getAnalytics = (state?: string) =>
  api.get(state ? `/predict/analytics/${encodeURIComponent(state)}` : '/predict/analytics');

export const predictHospitalLoad = (data: Record<string, any>) =>
  api.post('/predict/hospital-load', data);

// ─── Model Management ───────────────────────────────────────────
export const getModelStatus = () =>
  api.get('/models/status');

export const retrainModel = (modelName: string) =>
  api.post(`/models/retrain/${modelName}`);

export const retrainAllModels = () =>
  api.post('/models/retrain/all');

export const getTrainingLogs = () =>
  api.get('/models/logs');
