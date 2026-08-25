import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './ui';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { WorkspaceOverview } from './pages/WorkspaceOverview';
import { ProjectDetail } from './pages/ProjectDetail';
import { DiscussionDetail } from './pages/DiscussionDetail';
import { MeetingList } from './pages/MeetingList';
import { MeetingDetail } from './pages/MeetingDetail';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public, full-bleed routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated app shell */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="workspaces/:workspaceId" element={<WorkspaceOverview />} />
                <Route path="workspaces/:workspaceId/meetings" element={<MeetingList />} />
                <Route
                  path="workspaces/:workspaceId/meetings/:meetingId"
                  element={<MeetingDetail />}
                />
                <Route
                  path="workspaces/:workspaceId/projects/:projectId"
                  element={<ProjectDetail />}
                />
                <Route
                  path="workspaces/:workspaceId/projects/:projectId/discussions/:discussionId"
                  element={<DiscussionDetail />}
                />
              </Route>
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
