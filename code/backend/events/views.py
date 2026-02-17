from django.shortcuts import render

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db import transaction

from .models import Event, Category, EventParticipation
from .serializers import EventSerializer, CategorySerializer
from .permissions import IsHostOrReadOnly


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.order_by("name")
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]


class EventViewSet(viewsets.ModelViewSet):
    serializer_class = EventSerializer
    permission_classes = [IsHostOrReadOnly]

    def get_queryset(self):
        # Public list/detail for public events
        # If authenticated, you can also see events you host even if private
        user = self.request.user
        qs = Event.objects.all().order_by("-created_at")

        if user.is_authenticated:
            return qs.filter(is_public=True) | qs.filter(host=user)
        return qs.filter(is_public=True)

    def get_permissions(self):
        # Anyone can GET list/detail (public events)
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        # Must be logged in to create/update/delete/join/leave
        if self.action in ["create", "update", "partial_update", "destroy", "join", "leave"]:
            return [IsAuthenticated(), IsHostOrReadOnly()] if self.action in ["update", "partial_update", "destroy"] else [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(host=self.request.user)

    @action(detail=True, methods=["post"], url_path="join", permission_classes=[IsAuthenticated])
    @transaction.atomic
    def join(self, request, pk=None):
        event = self.get_object()

        current_count = EventParticipation.objects.filter(event=event).exclude(status="CANCELLED").count()
        if current_count >= event.capacity:
            return Response({"detail": "Event is full."}, status=status.HTTP_400_BAD_REQUEST)

        participation, created = EventParticipation.objects.get_or_create(
            event=event,
            user=request.user,
            defaults={"status": "JOINED"},
        )

        if not created and participation.status != "CANCELLED":
            return Response({"detail": "Already joined/booked."}, status=status.HTTP_400_BAD_REQUEST)

        participation.status = "JOINED"
        participation.save()

        return Response({"detail": "Joined event."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="leave", permission_classes=[IsAuthenticated])
    @transaction.atomic
    def leave(self, request, pk=None):
        event = self.get_object()

        try:
            participation = EventParticipation.objects.get(event=event, user=request.user)
        except EventParticipation.DoesNotExist:
            return Response({"detail": "You are not a participant."}, status=status.HTTP_400_BAD_REQUEST)

        participation.status = "CANCELLED"
        participation.save()
        return Response({"detail": "Left event."}, status=status.HTTP_200_OK)
