from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    message = 'Только администратор может выполнять это действие.'
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated
                    and request.user.role == 'admin')