import { useEffect, useState } from 'react';
import client from '../../api/client';
import '../../styles/admin.css';

const EMPTY_FORM = {
  title: '',
  duration_minutes: 90,
  description: '',
  poster_url: '',
  rating: '',
};

export default function FilmManager() {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadFilms = () => {
    setLoading(true);
    client.get('films/')
      .then((r) => setFilms(r.data.results ?? r.data))
      .catch((err) => setError(err.response?.data?.detail || err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFilms();
  }, []);

  const onChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const onEdit = (film) => {
    setEditingId(film.id);
    setForm({
      title: film.title ?? '',
      duration_minutes: film.duration_minutes ?? 90,
      description: film.description ?? '',
      poster_url: film.poster_url ?? '',
      rating: film.rating ?? '',
    });
    setError(null);
  };

  const onCancel = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title.trim(),
        duration_minutes: Number(form.duration_minutes) || 90,
        description: form.description || '',
        poster_url: form.poster_url || '',
        rating: form.rating === '' ? null : Number(form.rating),
      };

      if (editingId) {
        await client.patch(`films/${editingId}/`, payload);
      } else {
        await client.post('films/', payload);
      }
      onCancel();
      loadFilms();
    } catch (err) {
      const detail = err.response?.data
        ? JSON.stringify(err.response.data)
        : err.message;
      setError(`Не удалось сохранить: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (film) => {
    if (!window.confirm(`Удалить фильм «${film.title}»?`)) return;
    try {
      await client.delete(`films/${film.id}/`);
      loadFilms();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  };

  if (loading) return <p>Загрузка фильмов…</p>;

  return (
    <div className="film-manager">
      <p className="conf-step__paragraph">
        Добавляйте, редактируйте и удаляйте фильмы.
      </p>

      {error && <p className="explanation-text">Ошибка: {error}</p>}

      {/* Форма */}
      <form className="film-manager__form" onSubmit={onSubmit}>
        <div className="film-manager__row">
          <label>
            Название
            <input
              type="text"
              className="conf-step__input"
              value={form.title}
              onChange={(e) => onChange('title', e.target.value)}
              required
              maxLength={200}
            />
          </label>
          <label>
            Длительность, мин
            <input
              type="number"
              min={1}
              step={1}
              className="conf-step__input"
              value={form.duration_minutes}
              onChange={(e) => onChange('duration_minutes', e.target.value)}
              required
            />
          </label>
          <label>
            Рейтинг (0–10)
            <input
              type="number"
              min={0}
              max={10}
              step={0.1}
              className="conf-step__input"
              value={form.rating}
              onChange={(e) => onChange('rating', e.target.value)}
            />
          </label>
        </div>

        <label className="film-manager__full">
          URL постера
          <input
            type="url"
            className="conf-step__input"
            placeholder="https://..."
            value={form.poster_url}
            onChange={(e) => onChange('poster_url', e.target.value)}
          />
        </label>

        <label className="film-manager__full">
          Описание
          <textarea
            className="conf-step__input"
            rows={3}
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
          />
        </label>

        <div className="conf-step__buttons">
          <button
            type="submit"
            className="conf-step__button conf-step__button-accent"
            disabled={saving}
          >
            {saving ? 'Сохраняем…' : editingId ? 'Сохранить изменения' : 'Добавить фильм'}
          </button>
          {editingId && (
            <button
              type="button"
              className="conf-step__button conf-step__button-regular"
              onClick={onCancel}
            >
              Отмена
            </button>
          )}
        </div>
      </form>

      {/* Список фильмов */}
      <table className="film-manager__table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Название</th>
            <th>Длит., мин</th>
            <th>Рейтинг</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {films.map((f) => (
            <tr key={f.id}>
              <td>{f.id}</td>
              <td>{f.title}</td>
              <td>{f.duration_minutes}</td>
              <td>{f.rating ?? '—'}</td>
              <td className="film-manager__actions">
                <button
                  type="button"
                  className="conf-step__button conf-step__button-regular"
                  onClick={() => onEdit(f)}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="conf-step__button conf-step__button-regular"
                  onClick={() => onDelete(f)}
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}