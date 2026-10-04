from datetime import datetime, timedelta, time
from decimal import Decimal
import random

from django.core.management.base import BaseCommand
from django.utils import timezone

from aggregator.models import Film, Venue, Session


# Как часто ставить сеансы (шаг сетки в минутах)
SLOT_STEP = 15
# Рабочий день кинотеатра
DAY_START = time(9, 0)
DAY_END = time(23, 30)


class Command(BaseCommand):
    help = 'Создать сеансы на N дней вперёд, автоматически разнося по слотам'

    def add_arguments(self, parser):
        parser.add_argument('--days', type=int, default=7)
        parser.add_argument('--clear', action='store_true')
        parser.add_argument('--seed', type=int, default=42,
                            help='Seed для воспроизводимости')

    def handle(self, *args, **options):
        random.seed(options['seed'])
        days = options['days']

        if options['clear']:
            deleted, _ = Session.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Удалено сеансов: {deleted}'))

        films = list(Film.objects.all())
        venues = list(Venue.objects.all())

        if not films or not venues:
            self.stdout.write(self.style.ERROR('Нет фильмов или залов'))
            return

        today = timezone.localdate()
        created = 0

        # Сколько сеансов каждого фильма в день в каждом зале (минимум)
        TARGET_PER_FILM_PER_DAY = 2

        for day_offset in range(days):
            current_date = today + timedelta(days=day_offset)

            # Сдвигаем очередь фильмов на каждый день,
            # чтобы у всех фильмов в разные дни были утренние/вечерние сеансы
            day_films = films[day_offset % len(films):] + films[:day_offset % len(films)]

            for venue in venues:
                # Квота: сколько сеансов каждого фильма хотим поставить в этом зале сегодня
                quota = {film.id: TARGET_PER_FILM_PER_DAY for film in films}

                slots = self._build_day_slots(DAY_START, DAY_END, SLOT_STEP)

                # Проходим по слотам слева направо.
                # На каждом слоте выбираем фильм с наибольшим "остатком квоты",
                # который влезает по времени.
                for slot_time in sorted(slots.keys()):
                    if slots[slot_time]:
                        continue

                    # Кандидаты: фильмы с остатком квоты > 0, влезающие по времени,
                    # отсортированные по остатку квоты (убывание), затем по очереди дня
                    candidates = []
                    for film in day_films:
                        if quota[film.id] <= 0:
                            continue
                        duration = film.duration_minutes or 120
                        start_dt = datetime.combine(current_date, slot_time)
                        end_dt = start_dt + timedelta(minutes=duration)
                        if end_dt.time() > DAY_END:
                            continue
                        # проверим, что все слоты до end свободны
                        if not self._is_free(slots, slot_time, duration, SLOT_STEP):
                            continue
                        candidates.append((quota[film.id], film, duration))

                    if not candidates:
                        continue

                    candidates.sort(key=lambda x: -x[0])
                    _, film, duration = candidates[0]

                    self._mark_busy(slots, slot_time, duration, SLOT_STEP)
                    quota[film.id] -= 1

                    start_dt = datetime.combine(current_date, slot_time)
                    starts_at = timezone.make_aware(start_dt)
                    ends_at = starts_at + timedelta(minutes=duration)

                    Session.objects.create(
                        venue=venue,
                        film=film,
                        starts_at=starts_at,
                        ends_at=ends_at,
                        price_regular=Decimal('250.00'),
                        price_vip=Decimal('350.00'),
                    )
                    created += 1

        self.stdout.write(self.style.SUCCESS(f'Создано сеансов: {created}'))
        # отчёт по фильмам
        for film in films:
            cnt = Session.objects.filter(film=film).count()
            self.stdout.write(f'  {film.title} → {cnt}')

    @staticmethod
    def _is_free(slots, start_time, duration, step):
        current = datetime.combine(datetime.today(), start_time)
        end = current + timedelta(minutes=duration)
        while current < end:
            if current.time() in slots and slots[current.time()]:
                return False
            current += timedelta(minutes=step)
        return True
    
    @staticmethod
    def _build_day_slots(start, end, step):
        slots = {}
        current = datetime.combine(datetime.today(), start)
        end_dt = datetime.combine(datetime.today(), end)
        while current <= end_dt:
            slots[current.time()] = False
            current += timedelta(minutes=step)
        return slots

    @staticmethod
    def _mark_busy(slots, start_time, duration, step):
        current = datetime.combine(datetime.today(), start_time)
        end = current + timedelta(minutes=duration)
        while current < end:
            if current.time() in slots:
                slots[current.time()] = True
            current += timedelta(minutes=step)