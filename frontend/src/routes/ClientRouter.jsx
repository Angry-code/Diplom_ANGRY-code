import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/client/HomePage';
import HallPage from '../pages/client/HallPage';
import TicketPage from '../pages/client/TicketPage';
import MyTicketsPage from '../pages/client/MyTicketsPage';
import LoginPage from '../pages/client/LoginPage';
import RegisterPage from '../pages/client/RegisterPage';

export default function ClientRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sessions/:id" element={<HallPage />} />
      <Route path="/tickets/:code" element={<TicketPage />} />
      <Route path="/my-tickets" element={<MyTicketsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
}