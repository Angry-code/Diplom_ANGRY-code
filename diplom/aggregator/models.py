from django.db import models
from django.db.models import CheckConstraint, Q, F
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import qrcode
from PIL import Image
from django.conf import settings
import os

# Create your models here.
class User(AbstractUser):
    full_name = models.CharField(max_length=255, blank=True, null=True)
    is_admin = models.BooleanField(default=False)

    def __str__(self):
        return self.email

class Venue(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    rows_count = models.PositiveIntegerField()
    seats_per_row = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name} ({self.rows_count}×{self.seats_per_row})"

class Seat(models.Model):
    TYPES = [
        ('regular', 'Обычное'),
        ('vip', 'VIP'),
    ]

    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='seats')
    row_number = models.PositiveIntegerField()
    seat_number = models.PositiveIntegerField()
    type = models.CharField(max_length=20, choices=TYPES, default='regular')

    class Meta:
        unique_together = ('venue', 'row_number', 'seat_number')

    def __str__(self):
        return f"{self.venue.name} — ряд {self.row_number}, место {self.seat_number} ({self.type})"

class Film(models.Model):
    title = models.CharField(max_length=255)
    duration_minutes = models.PositiveIntegerField()
    description = models.TextField(blank=True, null=True)
    poster_url = models.URLField(blank=True, null=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
            

    def __str__(self):
        return self.title

class Session(models.Model):
    film = models.ForeignKey(Film, on_delete=models.CASCADE, related_name='sessions')
    venue = models.ForeignKey(Venue, on_delete=models.CASCADE, related_name='sessions')
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    price_regular = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_vip = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        constraints = [
            #CheckConstraint(
                #check=Q(ends_at__gt=F('starts_at')),
                #name='valid_time_range',
            #),
            models.UniqueConstraint(
                fields=['venue', 'starts_at'],
                name='unique_venue_time',
            ),
        ]

    def __str__(self):
        return f"{self.film.title} — {self.starts_at} ({self.venue.name})"

class Ticket(models.Model):
    STATUSES = [
        ('active', 'Активен'),
        ('used', 'Использован'),
        ('cancelled', 'Отменён'),
    ]

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name='tickets')
    seat = models.ForeignKey(Seat, on_delete=models.PROTECT)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    booking_code = models.CharField(max_length=64, unique=True)
    
    qr_image_path = models.CharField(max_length=512, blank=True, null=True) 
    price_paid = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=30, choices=STATUSES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Билет {self.booking_code} — {self.session}"

    def generate_qr_code(self):
        qr_data = f"Booking Code: {self.booking_code}\n" \
            f"Session: {self.session.film.title} at {self.session.starts_at.strftime('%Y-%m-%d %H:%M')}\n" \
            f"Venue: {self.session.venue.name}\n" \
            f"Seat: Row {self.seat.row_number}, Seat {self.seat.seat_number} ({self.seat.type})"

        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=8,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Определяем путь для сохранения QR-кода
        
        media_root = getattr(settings, 'MEDIA_ROOT', 'media') # Получаем MEDIA_ROOT из настроек, по умолчанию 'media'
        qr_dir = os.path.join(media_root, 'qr_codes')
        if not os.path.exists(qr_dir):
            os.makedirs(qr_dir)

        filename = f"ticket_{self.booking_code}_qr.png"
        filepath = os.path.join(qr_dir, filename)
        img.save(filepath)

        # Сохраняем путь к файлу в модели
        
        self.qr_image_path = os.path.join('qr_codes', filename) # Сохраняем относительный путь
        self.save() # Сохраняем модель с путем к QR-коду