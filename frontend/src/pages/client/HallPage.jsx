import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import HallScheme from '../../components/client/HallScheme';
import ClientHeader from '../../components/client/ClientHeader';
import '../../styles/client.css';

export default function HallPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    client.get(`sessions/${id}/seats/`)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Page><p className="loading">Загрузка зала…</p></Page>;
  if (error) return <Page><p className="loading">Ошибка: {error}</p></Page>;

  const { session, seats, booked_seat_ids } = data;

  const handleConfirm = async (selected) => {
    setBooking(true);
    try {
      const results = [];
      for (const seat of selected) {
        const { data: ticket } = await client.post('tickets/book/', {
          session_id: session.id,
          seat_id: seat.id,
        });
        results.push(ticket);
      }
      navigate(`/tickets/${results[0].booking_code}`);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      alert(`Не удалось забронировать: ${detail}`);
    } finally {
      setBooking(false);
    }
  };

  return (
    <Page>
      <section className="buying">
        <div className="buying__info">
          <div className="buying__info-description">
            <h2 className="buying__info-title">{session.film.title}</h2>
            <p className="buying__info-start">
              Начало сеанса:{' '}
              {new Date(session.starts_at).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="buying__info-hall">{session.venue.name}</p>
          </div>
          <div className="buying__info-hint">
            <p>Тапните дважды,<br />чтобы увеличить</p>
          </div>
        </div>

        <HallScheme
          seats={seats}
          bookedSeatIds={booked_seat_ids}
          priceRegular={session.price_regular}
          priceVip={session.price_vip}
          onConfirm={handleConfirm}
        />

        {booking && (
          <p className="loading" style={{ color: '#fff' }}>Бронируем…</p>
        )}
      </section>
    </Page>
  );
}

function Page({ children }) {
  return (
    <div>
      <ClientHeader />
      <main>{children}</main>
    </div>
  );
}