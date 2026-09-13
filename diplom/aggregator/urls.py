from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

app_name = 'aggregator'

urlpatterns = [
    path('', views.home, name='home'),
    path('films/', views.film_list, name='film_list'),
    path('films/<int:pk>/', views.film_detail, name='film_detail'),
    path('sessions/', views.session_list, name='session_list'),
    path('sessions/<int:pk>/', views.session_detail, name='session_detail'),
    path('sessions/<int:session_id>/book/<int:seat_id>/', views.book_ticket, name='book_ticket'),
    path('tickets/<str:booking_code>/', views.ticket_detail, name='ticket_detail'),
    path('my-tickets/', views.my_tickets, name='my_tickets'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)