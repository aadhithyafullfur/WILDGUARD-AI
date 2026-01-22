import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WildguardDashboard from './pages/dashboard/WildguardDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <Routes>
          <Route path="/*" element={<WildguardDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;