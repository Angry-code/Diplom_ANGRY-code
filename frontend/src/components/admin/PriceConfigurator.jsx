import { useEffect, useMemo, useState } from 'react';
import client from '../../api/client';
import '../../styles/admin.css';

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

export default function PriceConfigurator() {
  const [venues, setVenues] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [original, setOriginal] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedMsg, setSavedMsg] = useState(null);

  // Загрузка залов и сеансов
  useEffect(() => {
    Promise.all([client.get('venues/'), client.get('sessions/')])
      .then(([vRes, sRes]) => {
        const vList = vRes.data.results ?? vRes.data;
        const sList = sRes.data.results ?? sRes.data;
        setVenues(vList);
        setSessions(sList);
        setOriginal(sList);
        if (vList.length > 0) setSelectedVenueId(vList[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  // Фильтр сеансов по залу + сортировка по времени
  const venueSessions = useMemo(() => {
    if (!selectedVenueId) return [];
    return sessions
      .filter((s) => s.venue.id === selectedVenueId)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }, [sessions, selectedVenueId]);

  // Группировка по дате
  const byDate = useMemo(() => {
    const map = {};
    venueSessions.forEach((s) => {
      const d = s.starts_at.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });
    return Object.entries(map);
  }, [venueSessions]);

  const onChangePrice = (id, field, value) => {
    setSavedMsg(null);
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const hasChanges = sessions.some((s) => {
    const orig = original.find((o) => o.id === s.id);
    if (!orig) return false;
    return (
      String(orig.price_regular) !== String(s.price_regular) ||
      String(orig.price_vip) !== String(s.price_vip)
    );
  });

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const changed = sessions.filter((s) => {
        const orig = original.find((o) => o.id === s.id);
        if (!orig) return false;
        return (
          String(orig.price_regular) !== String(s.price_regular) ||
          String(orig.price_vip) !== String(s.price_vip)
        );
      });

      for (const s of changed) {
        await client.patch(`sessions/${s.id}/`, {
          price_regular: String(s.price_regular),
          price_vip: String(s.price_vip),
        });
      }

      setOriginal(sessions);
      setSavedMsg(`Сохранено сеансов: ${changed.length}`);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setError(`Не удалось сохранить: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    setSessions(original);
    setSavedMsg(null);
  };

  if (loading) return <p>Загрузка…</p>;

  return (
    <div className="price-configurator">
      <p className="conf-step__paragraph">
        Выберите зал и задайте цены на обычные и VIP-места для каждого сеанса.
      </p>

      {/* Селектор зала */}
      <ul className="conf-step__selectors-box">
        {venues.map((v) => (
          <li key={v.id}>
            <input
              type="radio"
              name="price-venue"
              className="conf-step__radio"
              id={`price-venue-${v.id}`}
              checked={selectedVenueId === v.id}
              onChange={() => setSelectedVenueId(v.id)}
            />
            <label
              className="conf-step__selector"
              htmlFor={`price-venue-${v.id}`}
            >
              {v.name}
            </label>
          </li>
        ))}
      </ul>

      {error && <p className="explanation-text">Ошибка: {error}</p>}
      {savedMsg && (
        <p className="conf-step__wrapper__save-status">{savedMsg}</p>
      )}

      {selectedVenue && venueSessions.length === 0 && (
        <p>У выбранного зала нет сеансов.</p>
      )}

      {byDate.map(([date, items]) => (
        <div key={date} className="price-configurator__day">
          <h3 className="conf-step__seances-title">{fmtDate(date)}</h3>
          <table className="price-configurator__table">
            <thead>
              <tr>
                <th>Время</th>
                <th>Фильм</th>
                <th>Обычная, ₽</th>
                <th>VIP, ₽</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{fmtTime(s.starts_at)}</td>
                  <td>{s.film.title}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      className="conf-step__input price-configurator__input"
                      value={s.price_regular}
                      onChange={(e) =>
                        onChangePrice(s.id, 'price_regular', e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      step={10}
                      className="conf-step__input price-configurator__input"
                      value={s.price_vip}
                      onChange={(e) =>
                        onChangePrice(s.id, 'price_vip', e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div className="conf-step__buttons">
        <button
          type="button"
          className="conf-step__button conf-step__button-accent"
          disabled={!hasChanges || saving}
          onClick={onSave}
        >
          {saving ? 'Сохраняем…' : 'Сохранить'}
        </button>
        <button
          type="button"
          className="conf-step__button conf-step__button-regular"
          disabled={!hasChanges || saving}
          onClick={onCancel}
        >
          Отмена
        </button>
      </div>
    </div>
  );
}