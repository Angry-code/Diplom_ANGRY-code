import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ClientHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="page-header">
      <Link to="/" className="page-header__title">
        Идём<span> в </span>кино
      </Link>

      <nav className="page-header__nav">
        <NavLink to="/" end className="page-header__link">
          Афиша
        </NavLink>

        {isAuthenticated ? (
          <>
            <NavLink to="/my-tickets" className="page-header__link">
              Мои билеты
            </NavLink>
            <span className="page-header__user">
              {user.full_name || user.email}
            </span>
            <button
              type="button"
              className="page-header__button"
              onClick={onLogout}
            >
              Выйти
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="page-header__link">
              Войти
            </NavLink>
            <NavLink to="/register" className="page-header__link">
              Регистрация
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}