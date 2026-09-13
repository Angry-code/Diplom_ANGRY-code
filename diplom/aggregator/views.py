
from django.shortcuts import render, get_object_or_404
from django.db import transaction
from django.http import HttpResponseRedirect
from django.urls import reverse
from aggregator.models import Session, Seat, Ticket
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

    return render(request, 'cinema/session_detail.html', {
        'session': session,
        'seats': seats,
        'booked_seat_ids': booked_seat_ids,
    })

def session_list(request):
    # select_related экономит запросы к БД (подтягивает film и venue сразу)
    sessions = Session.objects.select_related('film', 'venue').order_by('starts_at')
    return render(request, 'aggregator/session_list.html', {'sessions': sessions})

@transaction.atomic
def book_ticket(request, session_id, seat_id):
    if request.method != 'POST':
        return HttpResponseRedirect(reverse('session_detail', args=[session_id]))
    try:
        session = Session.objects.select_for_update().get(pk=session_id)
        seat = Seat.objects.select_for_update().get(pk=seat_id)
    except (Session.DoesNotExist, Seat.DoesNotExist):
        # Обработка случая, если сеанс или место не найдены
        return HttpResponseRedirect(reverse('session_list')) 
     
    if Ticket.objects.filter(session=session, seat=seat, status='active').exists():
        return HttpResponseRedirect(reverse('session_detail', args=[session.id]))

    import uuid
    booking_code = uuid.uuid4().hex[:12] # Генерируем 12-символьный уникальный код

    try:
        ticket = Ticket.objects.create(
            session=session,
            seat=seat,
            booking_code=f"T{session.id}{seat.id}",
            price_paid=session.price_vip if seat.type == 'vip' else session.price_regular,
            status='active',
        )

        ticket.generate_qr_code()

        return HttpResponseRedirect(reverse('session_detail', args=[session.id]))
    except Exception as e:
        print(f"Ошибка при бронировании билета: {e}") 
        return HttpResponseRedirect(reverse('session_detail', args=[session.id])) # Или другая страница с сообщением об ошибке