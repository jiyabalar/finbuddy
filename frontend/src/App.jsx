import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import { Login, Register } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Budget from './pages/Budget';
import Goals from './pages/Goals';
import Insights from './pages/Insights';
import Notifications from './pages/Notifications';
import FinnyPage from './pages/FinnyPage';
import Settings from './pages/Settings';
import DevOps from './pages/DevOps';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/finny" element={<FinnyPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/devops" element={<DevOps />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
