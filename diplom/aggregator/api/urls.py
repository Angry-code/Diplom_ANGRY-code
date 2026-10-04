from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, auth_views

router = DefaultRouter()
router.register('films', views.FilmViewSet)
router.register('venues', views.VenueViewSet)
router.register('sessions', views.SessionViewSet)
router.register('seats', views.SeatViewSet)
router.register('admin/tickets', views.TicketViewSet, basename='admin-tickets')

urlpatterns = [
    path('', include(router.urls)),

    # auth
    path('auth/register/', auth_views.RegisterView.as_view()),
    path('auth/login/', auth_views.MyTokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/me/', auth_views.MeView.as_view()),

    # tickets (публичные и мои)
    path('tickets/book/', views.BookTicketView.as_view()),
    path('tickets/my/', views.MyTicketsView.as_view()),
    path('tickets/<str:booking_code>/', views.TicketByCodeView.as_view()),
]