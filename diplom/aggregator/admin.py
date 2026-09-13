from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.conf import settings
from .models import Venue, Seat, Film, Session, Ticket, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'full_name', 'is_staff', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительно', {'fields': ('full_name', 'role')}),
    )


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('name', 'rows_count', 'seats_per_row')

    search_fields = ('name',)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not change:
            Seat.objects.bulk_create([
                Seat(venue=obj, row_number=r, seat_number=s)
                for r in range(1, obj.rows_count + 1)
                for s in range(1, obj.seats_per_row + 1)
            ])

    def _sync_seats(self, obj):
        existing = {
            (s.row_number, s.seat_number): s
            for s in Seat.objects.filter(venue=obj)
        }
        to_create = []
        for r in range(1, obj.rows_count + 1):
            for s in range(1, obj.seats_per_row + 1):
                if (r, s) not in existing:
                    to_create.append(Seat(venue=obj, row_number=r, seat_number=s))
        if to_create:
            Seat.objects.bulk_create(to_create)


@admin.register(Seat)
class SeatAdmin(admin.ModelAdmin):
    list_display = ('venue', 'row_number', 'seat_number', 'type')
    list_filter = ('venue', 'type')
    search_fields = ('venue__name',)


@admin.register(Film)
class FilmAdmin(admin.ModelAdmin):
    list_display = ('title', 'duration_minutes', 'rating')
    search_fields = ('title', 'description')


@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('film', 'venue', 'starts_at', 'price_regular', 'price_vip')
    list_filter = ('venue', 'film', ('starts_at', admin.DateFieldListFilter))
    date_hierarchy = 'starts_at'
    autocomplete_fields = ('film', 'venue')
    search_fields = ('film__title', 'venue__name')


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('booking_code', 'session', 'seat', 'status', 'price_paid', 'created_at')
    list_filter = ('status', 'session__film', 'session__venue')
    search_fields = ('booking_code',)
    readonly_fields = ('booking_code', 'qr_image_path', 'created_at', 'qr_preview')
    autocomplete_fields = ('session', 'seat', 'user')

    def qr_preview(self, obj):
        if obj.qr_image_path:
            return format_html('<img src="{}{}" width="150" />',
                               settings.MEDIA_URL, obj.qr_image_path)
        return '—'
    qr_preview.short_description = 'QR-код'