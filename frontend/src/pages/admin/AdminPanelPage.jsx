import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ConfStep from '../../components/admin/ConfStep';
import '../../styles/admin.css';
import HallManager from '../../components/admin/HallManager';
import HallConfigurator from '../../components/admin/HallConfigurator';
import PriceConfigurator from '../../components/admin/PriceConfigurator';
import FilmManager from '../../components/admin/FilmManager';
import TicketViewer from '../../components/admin/TicketViewer';

export default function AdminPanelPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1 className="admin-header__title">
          Идём<span>в</span>кино — админка
        </h1>
        <div className="admin-header__user">
          <span>{user?.email}</span>
          <button type="button" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </header>

      <main className="admin-main">
        <ConfStep title="Управление залами" defaultOpen>
          <HallManager />
        </ConfStep>

        <ConfStep title="Конфигурация залов">
          <HallConfigurator />
        </ConfStep>

        <ConfStep title="Конфигурация цен">
          <PriceConfigurator />
        </ConfStep>

        <ConfStep title="Управление фильмами">
          <FilmManager />
        </ConfStep>

        <ConfStep title="Просмотр броней">
          <TicketViewer />
        </ConfStep>

      </main>
    </div>
  );
}