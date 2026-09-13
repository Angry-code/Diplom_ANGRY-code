#import os
#import sys
#from pathlib import Path

# 1. Определяем путь к папке проекта (где лежит manage.py)
#BASE_DIR = Path(__file__).resolve().parent.parent # scripts → корень проекта

# Добавляем корень проекта в sys.path, чтобы Django мог импортировать приложения
#if str(BASE_DIR) not in sys.path:
    #sys.path.insert(0, str(BASE_DIR))

#diplom_path = BASE_DIR
#if not diplom_path.exists():
    #raise FileNotFoundError(f"Папка 'diplom' не найдена по пути: {diplom_path}")

# Убеждаемся, что в папке diplom есть settings.py
#settings_path = diplom_path / "settings.py"
#if not settings_path.exists():
    #raise FileNotFoundError(f"Файл settings.py не найден: {settings_path}")

# 2. Указываем, где лежат настройки: папка diplom, файл settings.py
#os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

#import django
#django.setup()

from aggregator.models import Venue, Seat, Film, Session, Ticket
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
def run():
    # Залы и места
    venues = []
    for i in range(1, 3):
        venue, _ = Venue.objects.get_or_create(
            name=f'Зал №{i}',
            defaults={
                'description': f'Зал для демонстрации дипломной системы',
                'rows_count': 5,
                'seats_per_row': 6,
            }
        )
        venues.append(venue)

        for row in range(1, venue.rows_count + 1):
            for seat_num in range(1, venue.seats_per_row + 1):
                seat_type = 'vip' if row <= 2 else 'regular'
                Seat.objects.get_or_create(
                    venue=venue,
                    row_number=row,
                    seat_number=seat_num,
                    defaults={'type': seat_type}
                )

    # Фильмы
    films_data = [
        {'title': 'Звёздные войны XXIII: Атака клонированных клонов', 'duration_minutes': 130},
        {'title': 'Миссия выполнима', 'duration_minutes': 120},
        {'title': 'Серая пантера', 'duration_minutes': 90},
        {'title': 'Движение вбок', 'duration_minutes': 95},
        {'title': 'Кот Да Винчи', 'duration_minutes': 100},
        {'title': 'Хищник', 'duration_minutes': 101}
    ]
    film_objects = []
    for f in films_data:
        film, _ = Film.objects.get_or_create(title=f['title'], defaults={'duration_minutes': f['duration_minutes']})
        film_objects.append(film)

    # Сеансы
    sessions = []
    base_time = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)

    for venue in venues:
        for film in film_objects:
            for offset in [0, 4, 8]:
                starts_at = base_time + timedelta(hours=offset)
                ends_at = starts_at + timedelta(minutes=film.duration_minutes)

                session, created = Session.objects.get_or_create(
                    film=film,
                    venue=venue,
                    starts_at=starts_at,
                    defaults={
                        'ends_at': ends_at,
                        'price_regular': 250,
                        'price_vip': 300,
                    }
                )
                if created:
                    sessions.append(session)

    print(f"Залы: {len(venues)}, фильмы: {len(film_objects)}, сеансы: {len(sessions)}")

    # Билеты
    tickets_created = 0
    all_seats = list(Seat.objects.all())
    for session in sessions[:10]:
        count = min(3, len(all_seats))
        chosen_seats = sorted(all_seats, key=lambda x: (x.row_number, x.seat_number))[:count]
        for seat in chosen_seats:
            booking_code = f"TKT-{session.id}-{seat.row_number}-{seat.seat_number}"
            ticket, created = Ticket.objects.get_or_create(
                session=session,
                seat=seat,
                booking_code=booking_code,
                defaults={
                    'price_paid': 350 if seat.type == 'vip' else 250,
                    'status': 'active',
                }
            )
            if created:
                tickets_created += 1

    print(f"Билеты: {tickets_created}")

#if __name__ == '__main__':
    #run()