1) ИдёмВКино — дипломный проект

Веб-приложение для бронирования билетов в кинотеатр. 
Клиент выбирает фильм,сеанс и место, получает электронный билет с QR-кодом. 
Администратор управляет залами, конфигурацией мест, ценами, фильмами и бронями.

2) Используемые технологии:

**Backend:**
- Python 3.12, Django 6.1
- Django REST Framework 3.18
- PostgreSQL (psycopg2-binary)
- SimpleJWT — JWT-аутентификация
- qrcode + Pillow — генерация QR-кодов
- python-dotenv — конфигурация через `.env`

**Frontend:**
- React 19 + Vite 8
- React Router 7
- axios — HTTP-клиент с авто-обновлением access-токена (refresh)


- Python 3.12+
- Node.js 20+
- PostgreSQL 14+ (запущенный сервер)

3) 
 1. Backend (Django)

```powershell
cd diplom

# Создание и активация виртуального окружения (один раз)
python -m venv ..\venv
..\venv\Scripts\Activate.ps1

# Установка зависимостей (один раз)
pip install -r ..\requirements.txt

# Настройка окружения
copy .env.example .env
# → необходимо открыть .env и заполнить своими значениями:
#   DJANGO_SECRET_KEY, DB_USER, DB_PASSWORD

# Миграции
python manage.py migrate

# Генерация сеансов на 7 дней вперёд
python manage.py generate_sessions --clear --days 7

# Запуск
python manage.py runserver
```

Backend: **http://127.0.0.1:8000**

2. Frontend (React + Vite)

```powershell
cd frontend

# Установка зависимостей (один раз)
npm install

# Запуск dev-сервера
npm run dev
```

Frontend: **http://localhost:5173**

Тестовые пользователи

| Email            | Пароль        | Роль  | Доступ                           |
| ---------------- | ------------- | ----- | -------------------------------- |
| 'admin@admin.ru' | 'admin12345'  | admin | Django admin + '/admin' + клиент |
| 'test2@test.ru'  | 'qwerty12345' | guest | Только клиент                    |

Роли:
- **admin** — доступ к Django admin ('/admin/') и React-админке ('/admin')
- **guest** — обычный пользователь (бронирование, мои билеты)

---

4) API-эндпоинты

Все эндпоинты под префиксом '/api/v1/'.

| Метод  | URL                        | Назначение                       | Доступ |
| ------ | -------------------------- | -------------------------------- | ------ |
| GET    | '/films/'                  | Список фильмов                   | все    |
| POST   | '/films/'                  | Создать фильм                    | admin  |
| PATCH  | '/films/<id>/'             | Изменить фильм                   | admin  |
| DELETE | '/films/<id>/'             | Удалить фильм                    | admin  |
| GET    | '/venues/'                 | Список залов (пагинация вкл.)    | все    |
| POST   | '/venues/'                 | Создать зал                      | admin  |
| DELETE | '/venues/<id>/'            | Удалить зал                      | admin  |
| GET    | '/sessions/'               | Список сеансов (пагинация откл.) | все    |
| POST   | '/sessions/'               | Создать сеанс                    | admin  |
| PATCH  | '/sessions/<id>/'          | Изменить сеанс (цены и т.п.)     | admin  |
| DELETE | '/sessions/<id>/'          | Удалить сеанс                    | admin  |
| GET    | '/sessions/<id>/seats/'    | Карта зала (занятые места)       | все    |
| GET    | '/seats/?venue=<id>'       | Места зала                       | все    |
| PATCH  | '/seats/<id>/'             | Сменить тип места (regular/vip)  | admin  |
| POST   | '/tickets/book/'           | Бронирование билета              | все    |
| GET    | '/tickets/<booking_code>/' | Билет по коду брони              | все    |
| GET    | '/tickets/my/'             | Мои билеты (пагинация вкл.)      | JWT    |
| GET    | '/admin/tickets/'          | Все билеты (без пагинации)       | admin  |
| POST   | '/auth/register/'          | Регистрация                      | все    |
| POST   | '/auth/login/'             | JWT-логин (возвращает user)      | все    |
| GET    | '/auth/me/'                | Профиль по токену                | JWT    |
| POST   | '/auth/refresh/'           | Обновление access-токена         | все    |

---

Функциональность:

Клиент

- Афиша фильмов на главной ('/')
- Выбор даты через карусель 'DateNav' (7 дней вперёд)
- Интерактивная карта зала ('/sessions/:id') с типами мест:
  regular / vip / disabled
- Бронирование билета (одним кликом)
- Электронный билет с QR-кодом ('/tickets/:code')
- Список «Мои билеты» ('/my-tickets', только для авторизованных)
- Регистрация и логин ('/register', '/login')
- Авто-обновление access-токена при истечении (refresh)

Администратор — React-админка ('/admin')

- **Управление залами** — создание/удаление залов ('HallManager')
- **Конфигурация залов** — настройка мест через сетку ('HallConfigurator')
- **Конфигурация цен** — установка цен на сеансы ('PriceConfigurator')
- **Управление фильмами** — CRUD фильмов ('FilmManager')
- **Просмотр броней** — таблица билетов с фильтрами ('TicketViewer')

Администратор — Django admin ('/admin/')

Django admin используется для задач, где важны табличная структура, фильтрация и поиск:

- **Films** — CRUD фильмов + поиск
- **Venues** — CRUD залов, автосоздание мест при создании зала
- **Seats** — управление местами с фильтрацией по залу и типу
- **Sessions** — расписание: CRUD с 'date_hierarchy' и 'list_filter'
- **Tickets** — просмотр броней с **QR-preview** прямо в списке
- **Пользователи** — кастомный 'UserAdmin' (роль, ФИО)
- **Token Blacklist** — управление JWT-токенами

Разделение обосновано следующим:
- React-админка даёт **визуально сложные** интерфейсы (сетка зала, drag&drop цен)
- Django admin — **табличные** операции с фильтрами и поиском из коробки.

---

Структура проекта

```
Diplom_ANGRY-code/
├── diplom/                              # Backend (Django)
│   ├── aggregator/
│   │   ├── api/                         # DRF-слой
│   │   │   ├── serializers.py
│   │   │   ├── views.py                 # FilmViewSet, VenueViewSet,
│   │   │   │                            # SessionViewSet, SeatViewSet,
│   │   │   │                            # BookTicketView, MyTicketsView,
│   │   │   │                            # TicketByCodeView, TicketViewSet
│   │   │   ├── urls.py
│   │   │   ├── permissions.py           # IsAdminRole
│   │   │   └── auth_views.py            # Register, MyTokenObtainPair, Me
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── generate_sessions.py # Генератор сеансов
│   │   ├── migrations/
│   │   ├── models.py                    # User, Venue, Seat, Film, Session, Ticket
│   │   └── admin.py                     # Django admin (все модели + QR-preview)
│   ├── media/qr_codes/                  # QR-коды билетов (не в git)
│   ├── settings.py
│   ├── urls.py
│   ├── .env                             # в gitignore
│   └── .env.example
│
├── frontend/                            # Frontend (React + Vite)
│   ├── public/
│   │   ├── images/                      # Статика (постеры-заглушки, фоны)
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js                # axios + JWT + refresh
│   │   │   └── config.js                # API_BASE, mediaUrl
│   │   ├── components/
│   │   │   ├── admin/                   # HallManager, HallConfigurator,
│   │   │   │                            # PriceConfigurator, FilmManager,
│   │   │   │                            # TicketViewer, ConfStep
│   │   │   └── client/                  # ClientHeader, DateNav,
│   │   │                                # HallScheme, MovieCard
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/                   # AdminLoginPage, AdminPanelPage
│   │   │   └── client/                  # HomePage, HallPage, TicketPage,
│   │   │                                # MyTicketsPage, LoginPage, RegisterPage
│   │   ├── routes/
│   │   │   ├── AdminRouter.jsx          # RequireAdmin
│   │   │   └── ClientRouter.jsx
│   │   └── styles/
│   └── package.json
│
├── requirements.txt
├── .gitignore
└── README.md


