from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsHostOrReadOnly(BasePermission):
    """
    Anyone can read public events.
    Only the host can update/delete.
    """

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return getattr(obj, "host", None) == request.user
