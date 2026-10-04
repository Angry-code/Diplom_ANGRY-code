from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.db import transaction
from django.shortcuts import get_object_or_404
from aggregator.models import Film, Session, Seat, Ticket, Venue
from .serializers import (
    FilmSerializer,
    VenueSerializer,
    SessionSerializer,
    SeatSerializer,
    TicketSerializer,
    BookTicketSerializer,)
from .permissions import IsAdminRole


class FilmViewSet(viewsets.ModelViewSet):
    queryset = Film.objects.all().order_by('title')
    serializer_class = FilmSerializer
    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminRole()]


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminRole()]


class SessionViewSet(viewsets.ModelViewSet):
    queryset = Session.objects.select_related('film', 'venue').order_by('starts_at')
    serializer_class = SessionSerializer
    pagination_class = None
    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'seats'):
            return [AllowAny()]
        return [IsAdminRole()]

    @action(detail=True, methods=['get'])
    def seats(self, request, pk=None):
        """Карта зала + занятые места. Аналог session_detail."""
        session = self.get_object()
        seats = Seat.objects.filter(venue=session.venue).order_by('row_number', 'seat_number')
        booked = set(
            Ticket.objects.filter(session=session, status='active')
            .values_list('seat_id', flat=True)
        )
        return Response({
            'session': SessionSerializer(session).data,
            'seats': SeatSerializer(seats, many=True).data,
            'booked_seat_ids': list(booked),
            'rows_count': session.venue.rows_count,
            'seats_per_row': session.venue.seats_per_row,
        })


class BookTicketView(APIView):
    """POST /api/v1/tickets/book/ — аналог book_ticket."""
    permission_classes = [AllowAny]  # гость тоже может бронировать

    @transaction.atomic
    def post(self, request):
        serializer = BookTicketSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            session = Session.objects.select_for_update().get(pk=data['session_id'])
            seat = Seat.objects.select_for_update().get(
                pk=data['seat_id'], venue=session.venue
            )
        except (Session.DoesNotExist, Seat.DoesNotExist):
            return Response({'detail': 'Сеанс или место не найдены'},
                            status=status.HTTP_404_NOT_FOUND)

        if Ticket.objects.filter(session=session, seat=seat, status='active').exists():
            return Response({'detail': 'Место уже занято'},
                            status=status.HTTP_409_CONFLICT)

        import uuid
        ticket = Ticket.objects.create(
            session=session, seat=seat,
            user=request.user if request.user.is_authenticated else None,
            booking_code=uuid.uuid4().hex,
            price_paid=session.price_vip if seat.type == 'vip' else session.price_regular,
            status='active',
        )
        ticket.generate_qr_code()
        return Response(TicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


class MyTicketsView(generics.ListAPIView):
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return (Ticket.objects.filter(user=self.request.user)
                .select_related('session__film', 'session__venue', 'seat')
                .order_by('-created_at'))


class TicketByCodeView(generics.RetrieveAPIView):
    """GET /api/v1/tickets/<booking_code>/ — для просмотра по коду (гость)."""
    serializer_class = TicketSerializer
    permission_classes = [AllowAny]
    lookup_field = 'booking_code'
    queryset = Ticket.objects.select_related('session__film', 'session__venue', 'seat')

class SeatViewSet(viewsets.ModelViewSet):
    queryset = Seat.objects.select_related('venue').all()
    serializer_class = SeatSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        venue_id = self.request.query_params.get('venue')
        if venue_id:
            qs = qs.filter(venue_id=venue_id)
        return qs
class TicketViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/v1/tickets/ — все билеты (только admin).
    GET /api/v1/tickets/<booking_code>/ — один билет (уже есть отдельным view).
    Поддерживает фильтры: ?session=<id>&status=<active|canceled>.
    """
    serializer_class = TicketSerializer
    permission_classes = [IsAdminRole]
    lookup_field = 'booking_code'
    pagination_class = None

    def get_queryset(self):
        qs = (Ticket.objects
              .select_related('session__film', 'session__venue', 'seat', 'user')
              .order_by('-created_at'))

        session_id = self.request.query_params.get('session')
        if session_id:
            qs = qs.filter(session_id=session_id)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs    