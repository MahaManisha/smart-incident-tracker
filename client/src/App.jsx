import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import IncidentKnowledgeBasePage from './pages/IncidentKnowledgeBasePage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/Profile';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Default Redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/incidents"
        element={
          <PrivateRoute>
            <IncidentsPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/incidents/create"
        element={
          <PrivateRoute>
            <CreateIncidentPage />
          </PrivateRoute>
        }
      />

      <Route
        path="/incidents/:id"
        element={
          <PrivateRoute>
            <IncidentDetailPage />
          </PrivateRoute>
        }
      />

      {/* Knowledge Base Route - ADMIN and RESPONDER only */}
      <Route
        path="/knowledge-base"
        element={
          <PrivateRoute>
            <IncidentKnowledgeBasePage />
          </PrivateRoute>
        }
      />

      <Route
        path="/users"
        element={
          <PrivateRoute>
            <UsersPage />
          </PrivateRoute>
        }
      />

      {/* 404 Not Found */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;