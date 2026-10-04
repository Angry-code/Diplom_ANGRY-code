import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import '../../styles/client.css';
import ClientHeader from '../../components/client/ClientHeader';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.get('tickets/my/')
      .then((r) => {
        // /tickets/my/ пагинирован: {count, next, previous, results}
        const data = r.data;
        setTickets(Array.isArray(data) ? data : (data.results ?? []));
      })
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <ClientHeader />
      <main className="my-tickets">
        <h2 className="my-tickets__title">Мои билеты</h2>

        {loading && <p className="loading">Загрузка билетов…</p>}
        {error && <p className="loading">Ошибка: {error}</p>}

        {!loading && !error && tickets.length === 0 && (
          <p className="my-tickets__empty">
            У вас пока нет билетов. <Link to="/">Выбрать фильм</Link>
          </p>
        )}

        {!loading && !error && tickets.length > 0 && (
          <ul className="my-tickets__list">
            {tickets.map((t) => (
              <li key={t.id} className="my-tickets__item">
                <Link to={`/tickets/${t.booking_code}`} className="my-tickets__link">
                  <span className="my-tickets__film">{t.session.film.title}</span>
                  <span className="my-tickets__hall">
                    {t.session.venue.name} • ряд {t.seat.row_number}, место {t.seat.seat_number}
                  </span>
                  <span className="my-tickets__date">
                    {new Date(t.session.starts_at).toLocaleString('ru-RU', {
                      day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className="my-tickets__code">Код: {t.booking_code}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}