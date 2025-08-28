import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Scan from './pages/Scan.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}


