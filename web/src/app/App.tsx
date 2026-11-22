import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { LandingPage } from '../pages/LandingPage';
import { StudioPage } from '../pages/StudioPage';
import { RoadmapPage } from '../pages/RoadmapPage';
import { ProgressPage } from '../pages/ProgressPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/studio" element={<StudioPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
        <Route path="/progress" element={<ProgressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
