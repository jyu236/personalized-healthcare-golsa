import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PatientDashboard from './components/PatientDashboard';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/patient/:patientId" element={<PatientDashboard />} />
          <Route path="/" element={<Navigate to="/patient/1" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 