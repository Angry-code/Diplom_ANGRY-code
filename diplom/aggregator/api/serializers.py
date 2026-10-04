from rest_framework import serializers
from aggregator.models import User, Venue, Seat, Film, Session, Ticket
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=False,
        min_length=8,
        allow_blank=False,
    )

    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'full_name', 'role', 'password')
        read_only_fields = ('role',)

    def validate(self, attrs):
        # При создании пароль обязателен
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'Пароль обязателен'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        # create_user сам хеширует пароль
        return User.objects.create_user(password=password, **validated_data)


class SeatSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    class Meta:
        model = Seat
        fields = ('id', 'row_number', 'seat_number', 'type', 'type_display')


class VenueSerializer(serializers.ModelSerializer):
    seats = SeatSerializer(many=True, read_only=True)
    class Meta:
        model = Venue
        fields = ('id', 'name', 'description', 'rows_count', 'seats_per_row', 'seats')


class FilmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Film
        fields = ('id', 'title', 'duration_minutes', 'description', 'poster_url', 'rating')


class SessionSerializer(serializers.ModelSerializer):
    film = FilmSerializer(read_only=True)
    film_id = serializers.PrimaryKeyRelatedField(
        queryset=Film.objects.all(), source='film', write_only=True
    )
    venue = VenueSerializer(read_only=True)
    venue_id = serializers.PrimaryKeyRelatedField(
        queryset=Venue.objects.all(), source='venue', write_only=True
    )
    class Meta:
        model = Session
        fields = ('id', 'film', 'film_id', 'venue', 'venue_id',
                  'starts_at', 'ends_at', 'price_regular', 'price_vip')


class SeatMapSerializer(serializers.Serializer):
    """Для эндпоинта /sessions/<id>/seats/ — карта зала."""
    # реализуем в view, здесь просто структура ответа


class TicketSerializer(serializers.ModelSerializer):
    session = SessionSerializer(read_only=True)
    seat = SeatSerializer(read_only=True)
    qr_url = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    class Meta:
        model = Ticket
        fields = ('id', 'booking_code', 'session', 'seat', 'price_paid',
                  'status', 'status_display', 'qr_url', 'created_at')
        read_only_fields = ('booking_code', 'price_paid', 'status', 'created_at')


class BookTicketSerializer(serializers.Serializer):
    """Входные данные для бронирования."""
    session_id = serializers.IntegerField()
    seat_id = serializers.IntegerField()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Расширенный JWT-логин: помимо access/refresh, отдаёт профиль пользователя.
    """
    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'full_name': self.user.full_name,
            'role': self.user.role,
        }
        return data    