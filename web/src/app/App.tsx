import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AppShell } from './AppShell';
import { ThemeProvider } from '../theme/ThemeProvider';
import { LandingPage } from '../pages/LandingPage';
import { ProblemsPage } from '../pages/ProblemsPage';
import { StudioPage } from '../pages/StudioPage';
import { RoadmapPage } from '../pages/RoadmapPage';
import { ProgressPage } from '../pages/ProgressPage';
import { HistoryPage } from '../pages/HistoryPage';
import { ProfilePage } from '../pages/ProfilePage';

function LegacyStudioRedirect() {
  const location = useLocation();
  return <Navigate to={`/studio/two-sum${location.search}`} replace />;
}

export function AppRoutes() {
  return (
    <ThemeProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/problems" element={<ProblemsPage />} />
          <Route path="/studio" element={<LegacyStudioRedirect />} />
          <Route path="/studio/:problemId" element={<StudioPage />} />
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
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
