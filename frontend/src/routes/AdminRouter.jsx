import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminPanelPage from '../pages/admin/AdminPanelPage';

function RequireAdmin({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p style={{ padding: '2rem' }}>Загрузка…</p>;
  }
  if (!user || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function AdminRouter() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />
      <Route
        path=""
        element={
          <RequireAdmin>
            <AdminPanelPage />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}