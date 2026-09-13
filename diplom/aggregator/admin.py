from django.contrib import admin

from .models import Venue, Seat, Film, Session, Ticket, User

@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('name', 'rows_count', 'seats_per_row')

@admin.register(Film)
class FilmAdmin(admin.ModelAdmin):
    list_display = ('title', 'duration_minutes', 'rating')
    search_fields = ('title', 'description') # Поля для поиска

@admin.register(Session)
class SessionAdmin(admin.ModelAdmin):
    list_display = ('film', 'venue', 'starts_at', 'price_regular', 'price_vip')
    list_filter = ('venue', 'starts_at')

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('booking_code', 'session', 'seat', 'status', 'price_paid')
    list_filter = ('status', 'session')

admin.site.register(User)
admin.site.register(Seat)
# Register your models here.
