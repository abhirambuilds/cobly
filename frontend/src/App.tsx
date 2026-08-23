import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DashboardLayout } from './layouts/DashboardLayout';
import { DashboardHome } from './pages/DashboardHome';
import { WorkspaceOverview } from './pages/WorkspaceOverview';
import { ProjectDetail } from './pages/ProjectDetail';
import { DiscussionDetail } from './pages/DiscussionDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="workspaces/:workspaceId" element={<WorkspaceOverview />} />
                <Route path="workspaces/:workspaceId/projects/:projectId" element={<ProjectDetail />} />
                <Route path="workspaces/:workspaceId/projects/:projectId/discussions/:discussionId" element={<DiscussionDetail />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
