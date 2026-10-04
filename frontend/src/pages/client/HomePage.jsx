import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import DateNav, { getWeekDays } from '../../components/client/DateNav';
import ClientHeader from '../../components/client/ClientHeader';
import '../../styles/client.css';

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(() => getWeekDays()[0].iso);
  const [films, setFilms] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      client.get('films/'),
      client.get('sessions/'),
    ])
      .then(([filmsRes, sessionsRes]) => {
        setFilms(filmsRes.data.results ?? filmsRes.data);
        setSessions(sessionsRes.data.results ?? sessionsRes.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const sessionsByFilm = useMemo(() => {
    const map = {};
    sessions
      .filter((s) => s.starts_at.slice(0, 10) === selectedDate)
      .forEach((s) => {
        const id = s.film.id;
        if (!map[id]) map[id] = [];
        map[id].push(s);
      });
    return map;
  }, [sessions, selectedDate]);

  if (loading) return <Page><p className="loading">Загрузка…</p></Page>;
  if (error)   return <Page><p className="loading">Ошибка: {error}</p></Page>;

  return (
    <Page>
      <DateNav selectedDate={selectedDate} onSelect={setSelectedDate} />

      {films.map((film) => (
        <MovieCard
          key={film.id}
          film={film}
          sessions={sessionsByFilm[film.id] || []}
        />
      ))}

      {films.length === 0 && (
        <p className="loading">Фильмов пока нет.</p>
      )}
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

function MovieCard({ film, sessions }) {
  const byHall = {};
  sessions.forEach((s) => {
    const hall = s.venue.name;
    if (!byHall[hall]) byHall[hall] = [];
    byHall[hall].push(s);
  });

  return (
    <section className="movie">
      <div className="movie__info">
        <div className="movie__poster">
          <img
            className="movie__poster-image"
            alt={film.title}
            src={film.poster_url || '/images/client/poster1.jpg'}
          />
        </div>
        <div className="movie__description">
          <h2 className="movie__title">{film.title}</h2>
          <p className="movie__synopsis">{film.description || 'Описание отсутствует.'}</p>
          <p className="movie__data">
            <span className="movie__data-duration">{film.duration_minutes} минут</span>
            {film.rating && (
              <span className="movie__data-origin"> · Рейтинг {film.rating}</span>
            )}
          </p>
        </div>
      </div>

      {Object.entries(byHall).map(([hallName, hallSessions]) => (
        <div className="movie-seances__hall" key={hallName}>
          <h3 className="movie-seances__hall-title">{hallName}</h3>
          <ul className="movie-seances__list">
            {hallSessions
              .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
              .map((s) => (
                <li className="movie-seances__time-block" key={s.id}>
                  <Link className="movie-seances__time" to={`/sessions/${s.id}`}>
                    {new Date(s.starts_at).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </section>
  );
}