import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ClientRouter from './routes/ClientRouter';
import AdminRouter from './routes/AdminRouter';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Админка: /admin/* */}
          <Route path="/admin/*" element={<AdminRouter />} />

          {/* Клиент: всё остальное */}
          <Route path="/*" element={<ClientRouter />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}