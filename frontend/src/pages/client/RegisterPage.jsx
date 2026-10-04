import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/client.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register({
        email: form.email.trim(),
        username: form.username.trim(),
        full_name: form.full_name.trim(),
        password: form.password,
      });
      navigate('/');
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Не удалось зарегистрироваться.';
      if (data && typeof data === 'object') {
        // Собираем ошибки полей в одну строку
        msg = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join('\n');
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <header className="page-header">
        <h1 className="page-header__title">
          Идём<span>в</span>кино
        </h1>
      </header>

      <main className="login-main">
        <form className="login-form" onSubmit={onSubmit}>
          <h2 className="login-form__title">Регистрация</h2>

          {error && <p className="login-form__error">{error}</p>}

          <label className="login-form__field">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={onChange('email')}
              required
              autoComplete="email"
            />
          </label>

          <label className="login-form__field">
            <span>Имя пользователя</span>
            <input
              type="text"
              value={form.username}
              onChange={onChange('username')}
              required
            />
          </label>

          <label className="login-form__field">
            <span>Полное имя</span>
            <input
              type="text"
              value={form.full_name}
              onChange={onChange('full_name')}
            />
          </label>

          <label className="login-form__field">
            <span>Пароль (минимум 8 символов)</span>
            <input
              type="password"
              value={form.password}
              onChange={onChange('password')}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <button
            type="submit"
            className="login-form__submit"
            disabled={busy}
          >
            {busy ? 'Регистрируем…' : 'Зарегистрироваться'}
          </button>

          <p className="login-form__hint">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </form>
      </main>
    </div>
  );
}