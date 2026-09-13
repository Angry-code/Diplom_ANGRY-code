
from django.shortcuts import render, get_object_or_404
from django.db import transaction
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from aggregator.models import Session, Seat, Ticket, Film
import qrcode
from django.conf import settings
import os
# Create your views here.

def home(request):
    return render(request, 'aggregator/home.html')

def session_detail(request, pk):
    session = get_object_or_404(Session.objects.select_related('film', 'venue'), pk=pk)
    seats = Seat.objects.filter(venue=session.venue).order_by('row_number', 'seat_number')

    # Получаем множество занятых мест для этого сеанса
    booked_seat_ids = set(
        Ticket.objects.filter(session=session, status='active')
        .values_list('seat_id', flat=True)
    )

    return render(request, 'aggregator/session_detail.html', {
        'session': session,
        'seats': seats,
        'booked_seat_ids': booked_seat_ids,
    })

def session_list(request):
    # select_related экономит запросы к БД (подтягивает film и venue сразу)
    sessions = Session.objects.select_related('film', 'venue').order_by('starts_at')
    return render(request, 'aggregator/session_list.html', {'sessions': sessions})

def film_list(request):
    films = Film.objects.all().order_by('title')
    return render(request, 'aggregator/film_list.html', {'films': films})


def film_detail(request, pk):
    film = get_object_or_404(Film, pk=pk)
    sessions = (
        Session.objects
        .filter(film=film)
        .select_related('venue')
        .order_by('starts_at')
    )
    return render(request, 'aggregator/film_detail.html', {
        'film': film,
        'sessions': sessions,
    })

def ticket_detail(request, booking_code):
    ticket = get_object_or_404(
        Ticket.objects.select_related('session__film', 'session__venue', 'seat'),
        booking_code=booking_code,
    )
    return render(request, 'aggregator/view_ticket.html', {'ticket': ticket})

@login_required
def my_tickets(request):
    tickets = (
        Ticket.objects
        .filter(user=request.user)
        .select_related('session__film', 'session__venue', 'seat')
        .order_by('-created_at')
    )
    return render(request, 'aggregator/my_tickets.html', {'tickets': tickets})

@transaction.atomic
def book_ticket(request, session_id, seat_id):
    if request.method != 'POST':
        return HttpResponseRedirect(reverse('session_detail', args=[session_id]))
    try:
        session = Session.objects.select_for_update().get(pk=session_id)
        seat = Seat.objects.select_for_update().get(pk=seat_id, venue=session.venue)
    except (Session.DoesNotExist, Seat.DoesNotExist):
        # Обработка случая, если сеанс или место не найдены
        return HttpResponseRedirect(reverse('session_list')) 
     
    if Ticket.objects.filter(session=session, seat=seat, status='active').exists():
        return HttpResponseRedirect(reverse('session_detail', args=[session.id]))

    import uuid
    
    try:
        ticket = Ticket.objects.create(
            session=session,
            seat=seat,
            user=request.user if request.user.is_authenticated else None,
            booking_code=uuid.uuid4().hex,
            price_paid=session.price_vip if seat.type == 'vip' else session.price_regular,
            status='active',
        )

        ticket.generate_qr_code()

        return HttpResponseRedirect(reverse('ticket_detail', args=[ticket.booking_code]))

    except Exception as e:
        print(f"Ошибка при бронировании билета: {e}") 
        return HttpResponseRedirect(reverse('session_detail', args=[session.id]))
