import { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';
import '../../styles/admin.css';

const fmtDate = (iso) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

export default function TicketViewer() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFilm, setFilterFilm] = useState('');

  useEffect(() => {
    client.get('admin/tickets/')
      .then((r) => setTickets(r.data.results ?? r.data))
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, []);

  const films = useMemo(() => {
    const map = new Map();
    tickets.forEach((t) => {
      const film = t.session?.film;
      if (film) map.set(film.id, film.title);
    });
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [tickets]);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterFilm && String(t.session?.film?.id) !== filterFilm) return false;
      return true;
    });
  }, [tickets, filterStatus, filterFilm]);

  if (loading) return <p>Загрузка броней…</p>;

  return (
    <div className="ticket-viewer">
      <p className="conf-step__paragraph">
        Все бронирования. Всего: <strong>{tickets.length}</strong>.
      </p>

      {error && <p className="explanation-text">Ошибка: {error}</p>}

      <div className="ticket-viewer__filters">
        <label>
          Статус
          <select
            className="conf-step__input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Все</option>
            <option value="active">Активные</option>
            <option value="canceled">Отменённые</option>
          </select>
        </label>

        <label>
          Фильм
          <select
            className="conf-step__input"
            value={filterFilm}
            onChange={(e) => setFilterFilm(e.target.value)}
          >
            <option value="">Все</option>
            {films.map((f) => (
              <option key={f.id} value={String(f.id)}>{f.title}</option>
            ))}
          </select>
        </label>
      </div>

      <table className="film-manager__table ticket-viewer__table">
        <thead>
          <tr>
            <th>Код</th>
            <th>Фильм</th>
            <th>Зал</th>
            <th>Ряд/место</th>
            <th>Сеанс</th>
            <th>Цена</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((t) => (
            <tr key={t.id}>
              <td><code>{t.booking_code}</code></td>
              <td>{t.session?.film?.title ?? '—'}</td>
              <td>{t.session?.venue?.name ?? '—'}</td>
              <td>{t.seat?.row_number} / {t.seat?.seat_number}</td>
              <td>{t.session?.starts_at ? fmtDate(t.session.starts_at) : '—'}</td>
              <td>{t.price_paid} ₽</td>
              <td>{t.status_display ?? t.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {filtered.length === 0 && (
        <p className="conf-step__paragraph">Ничего не найдено.</p>
      )}
    </div>
  );
}