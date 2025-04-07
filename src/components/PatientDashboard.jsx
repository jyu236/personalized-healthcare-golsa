import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import HealthChatbot from './HealthChatbot';
import './PatientDashboard.css';

const PatientDashboard = () => {
  const { patientId } = useParams();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('PatientId:', patientId);
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data for patient:', patientId);
      const response = await axios.get(`/api/patient-health-summary/${patientId}`);
      console.log('Received data:', response.data);
      setPatientData(response.data);
    } catch (err) {
      console.error('Error details:', err);
      setError('Failed to fetch patient data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading patient data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome, {patientData.first_name} {patientData.last_name}</h1>
      </div>
      
      <div className="dashboard-content">
        <div className="health-summary-section">
          <div className="health-metrics">
            <h2>Health Summary</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Vital Signs</h3>
                <p>Age: {patientData.patient_age}</p>
                <p>Gender: {patientData.patient_gender}</p>
                <p>Height: {patientData.patient_height} cm</p>
                <p>Weight: {patientData.patient_weight} kg</p>
                <p>Blood Pressure: {patientData.vital_systolic_bp}/{patientData.vital_diastolic_bp} mmHg</p>
                <p>Heart Rate: {patientData.vital_heart_rate} bpm</p>
                <p>Temperature: {patientData.vital_temperature}°C</p>
                <p>BMI: {patientData.vital_bmi}</p>
              </div>
              <div className="metric-card">
                <h3>Blood Work</h3>
                <p>Glucose: {patientData.cad_glucose} mg/dL</p>
                <p>Cholesterol: {patientData.blood_tc} mg/dL</p>
                <p>HDL: {patientData.blood_hdl} mg/dL</p>
                <p>LDL: {patientData.blood_ldl} mg/dL</p>
              </div>
              <div className="metric-card">
                <h3>Conditions</h3>
                <p>Diabetes: {patientData.cad_diabetes ? 'Yes' : 'No'}</p>
                <p>Hypertension: {patientData.ckd_hypertension ? 'Yes' : 'No'}</p>
                <p>CAD: {patientData.ckd_cad ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="chatbot-section">
          <HealthChatbot patientData={patientData} />
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard; 