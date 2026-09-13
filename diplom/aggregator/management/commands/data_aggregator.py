from django.core.management.base import BaseCommand
from aggregator.models import Venue, Seat, Film, Session
import datetime

class Command(BaseCommand):
    help = "Создаёт тестовые данные для кинотеатра"

    def handle(self, *args, **options):
        # логика создания тестовых данных
        venue, _ = Venue.objects.get_or_create(
            name="Зал №1",
            defaults={"rows_count": 10, "seats_per_row": 12}
        )
        # ... и так далее
        self.stdout.write(self.style.SUCCESS("Тестовые данные созданы"))