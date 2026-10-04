import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../../api/client';
import { mediaUrl } from '../../api/config';
import '../../styles/client.css';
import ClientHeader from '../../components/client/ClientHeader';

export default function TicketPage() {
  const { code } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.get(`tickets/${code}/`)
      .then((r) => setTicket(r.data))
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) return <Page><p className="loading">Загрузка билета…</p></Page>;
  if (error) return <Page><p className="loading">Билет не найден: {error}</p></Page>;
  if (!ticket) return null;

  const startTime = new Date(ticket.session.starts_at).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Page>
      <section className="ticket">
        <header className="tichet__check">
          <h2 className="ticket__check-title">Электронный билет</h2>
        </header>

        <div className="ticket__info-wrapper">
          <p className="ticket__info">
            На фильм:{' '}
            <span className="ticket__details ticket__title">
              {ticket.session.film.title}
            </span>
          </p>
          <p className="ticket__info">
            Место:{' '}
            <span className="ticket__details ticket__chairs">
              ряд {ticket.seat.row_number}, место {ticket.seat.seat_number}
            </span>
          </p>
          <p className="ticket__info">
            В зале:{' '}
            <span className="ticket__details ticket__hall">
              {ticket.session.venue.name}
            </span>
          </p>
          <p className="ticket__info">
            Начало сеанса:{' '}
            <span className="ticket__details ticket__start">{startTime}</span>
          </p>
          <p className="ticket__info">
            Стоимость:{' '}
            <span className="ticket__details ticket__cost">
              {ticket.price_paid}
            </span>{' '}
            рублей
          </p>
          <p className="ticket__info">
            Код бронирования:{' '}
            <span className="ticket__details">{ticket.booking_code}</span>
          </p>

          {ticket.qr_url ? (
            <img
              className="ticket__info-qr"
              src={mediaUrl(ticket.qr_url)}
              alt={`QR-код для билета ${ticket.booking_code}`}
            />
          ) : (
            <p className="ticket__hint">QR-код пока не готов.</p>
          )}

          <p className="ticket__hint">
            Покажите QR-код нашему контролёру для подтверждения бронирования.
          </p>
          <p className="ticket__hint">Приятного просмотра!</p>

          <p style={{ marginTop: '2rem', textAlign: 'center' }}>
            <Link to="/" className="acceptin-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
              На главную
            </Link>
          </p>
        </div>
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