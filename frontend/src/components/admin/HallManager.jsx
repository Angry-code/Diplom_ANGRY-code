import { useEffect, useState } from 'react';
import client from '../../api/client';
import '../../styles/admin.css';

export default function HallManager() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: '',
    rows_count: 5,
    seats_per_row: 6,
  });

  const load = () => {
    setLoading(true);
    client.get('venues/')
      .then(({ data }) => setVenues(data.results ?? data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const onChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onAdd = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await client.post('venues/', {
        name: form.name.trim(),
        description: '',
        rows_count: Number(form.rows_count),
        seats_per_row: Number(form.seats_per_row),
      });
      setForm({ name: '', rows_count: 5, seats_per_row: 6 });
      setShowAdd(false);
      load();
    } catch (err) {
      const detail = err.response?.data;
      const msg = typeof detail === 'object'
        ? Object.entries(detail).map(([k, v]) => `${k}: ${v}`).join('; ')
        : err.message;
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Удалить зал? Все места и сеансы этого зала тоже удалятся.')) return;
    try {
      await client.delete(`venues/${id}/`);
      load();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      alert(`Не удалось удалить: ${detail}`);
    }
  };

  return (
    <div className="hall-manager">
      <p className="conf-step__paragraph">
        Управление залами — добавление и удаление.
      </p>

      {loading && <p>Загрузка…</p>}
      {error && <p className="explanation-text">Ошибка: {error}</p>}

      {!loading && (
        <>
          <ul className="conf-step__list hall-manager__list">
            {venues.map((v) => (
              <li key={v.id} className="hall-manager__item">
                <span>
                  <strong>{v.name}</strong> — {v.rows_count}×{v.seats_per_row}
                </span>
                <button
                  type="button"
                  className="conf-step__button conf-step__button-trash"
                  title="Удалить зал"
                  onClick={() => onDelete(v.id)}
                  aria-label={`Удалить ${v.name}`}
                />
              </li>
            ))}
            {venues.length === 0 && (
              <li><em>Залов пока нет.</em></li>
            )}
          </ul>

          <div className="conf-step__buttons">
            {!showAdd ? (
              <button
                type="button"
                className="conf-step__button conf-step__button-regular"
                onClick={() => setShowAdd(true)}
              >
                Добавить зал
              </button>
            ) : (
              <form className="hall-manager__form" onSubmit={onAdd}>
                <label className="conf-step__label conf-step__label-fullsize">
                  Название зала
                  <input
                    className="conf-step__input"
                    type="text"
                    value={form.name}
                    onChange={onChange('name')}
                    placeholder="Зал №3"
                    required
                  />
                </label>

                <label className="conf-step__label conf-step__label-fullsize">
                  Рядов
                  <input
                    className="conf-step__input"
                    type="number"
                    min={1}
                    max={20}
                    value={form.rows_count}
                    onChange={onChange('rows_count')}
                    required
                  />
                </label>

                <label className="conf-step__label conf-step__label-fullsize">
                  Мест в ряду
                  <input
                    className="conf-step__input"
                    type="number"
                    min={1}
                    max={20}
                    value={form.seats_per_row}
                    onChange={onChange('seats_per_row')}
                    required
                  />
                </label>

                <div className="conf-step__buttons">
                  <button
                    type="submit"
                    className="conf-step__button conf-step__button-accent"
                    disabled={busy}
                  >
                    {busy ? 'Сохраняем…' : 'Сохранить'}
                  </button>
                  <button
                    type="button"
                    className="conf-step__button conf-step__button-regular"
                    onClick={() => { setShowAdd(false); setError(null); }}
                    disabled={busy}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}