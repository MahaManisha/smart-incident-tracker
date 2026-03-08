import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './components/common/PrivateRoute';
import RedirectWithToast from './components/common/RedirectWithToast';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import IncidentsPage from './pages/IncidentsPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import CreateIncidentPage from './pages/CreateIncidentPage';
import IncidentKnowledgeBasePage from './pages/IncidentKnowledgeBasePage';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/Profile';
import TeamsPage from './pages/TeamsPage';
import ChatPage from './pages/ChatPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SLAConfigPage from './pages/SLAConfigPage';
import EscalationPolicyPage from './pages/EscalationPolicyPage';
import IncidentTemplatesPage from './pages/IncidentTemplatesPage';
import ServicesPage from './pages/ServicesPage';
import ServiceMapPage from './pages/ServiceMapPage';
import OnCallPage from './pages/OnCallPage';
import SubmitDocumentationPage from './pages/SubmitDocumentationPage';
import NotFoundPage from './pages/NotFoundPage';
import SettingsPage from './pages/SettingsPage';
import MyDocumentsPage from './pages/MyDocumentsPage';
import LandingPage from './pages/LandingPage';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Landing Page Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Default Redirect to Dashboard handled post-login, or catch-all if needed */}        {/* Protected Routes */}
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
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/reporter/my-documents"
          element={
            <PrivateRoute roles={['REPORTER', 'RESPONDER', 'ADMIN']}>
              <MyDocumentsPage />
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

        <Route
          path="/teams"
          element={
            <PrivateRoute>
              <TeamsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <PrivateRoute roles={['ADMIN']}>
              <AnalyticsPage />
            </PrivateRoute>
          }
        />

        {/* SLA Configuration Route - ADMIN Only via Sidebar Logic, but enforced here too if needed by PrivateRoute roles */}
        <Route
          path="/sla-config"
          element={
            <PrivateRoute roles={['ADMIN']}>
              <SLAConfigPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/escalation-config"
          element={
            <PrivateRoute roles={['ADMIN']}>
              <EscalationPolicyPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/oncall"
          element={
            <PrivateRoute roles={['ADMIN', 'RESPONDER']}>
              <OnCallPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/incident-templates"
          element={
            <PrivateRoute roles={['ADMIN']}>
              <IncidentTemplatesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/services"
          element={
            <PrivateRoute roles={['ADMIN', 'RESPONDER']}>
              <ServicesPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/service-map"
          element={
            <PrivateRoute roles={['ADMIN', 'RESPONDER']}>
              <ServiceMapPage />
            </PrivateRoute>
          }
        />

        {/* Redirect standalone documentation creation to dashboard */}
        <Route
          path="/documentation/new"
          element={<RedirectWithToast to="/dashboard" message="Please create documentation directly from the Incident Detail page." />}
        />
        <Route
          path="/documentation"
          element={<RedirectWithToast to="/dashboard" message="Access documentation via specific accidents." />}
        />
        <Route
          path="/submit-document"
          element={<RedirectWithToast to="/dashboard" message="Please create documentation directly from the Incident Detail page." />}
        />

        {/* Note: Documentation is now embedded in the Incident Detail page.
            Legacy routes removed to enforce incident-centric workflow.
        */}

        <Route
          path="/teams/:teamId/chat"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />

        {/* 404 Not Found - Must be last */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;