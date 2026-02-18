from django.shortcuts import render
from math import sin, cos, sqrt, atan2, radians

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Q, Count

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
        """
        Supports:
          /api/events/?lat=..&lng=..&radius=..   (radius in KM)
        Also respects:
          - unauth users: public events only
          - auth users: public events + events they host (even if private)
        """
        user = self.request.user
        qs = Event.objects.all().order_by("-created_at")

        if user.is_authenticated:
            qs = qs.filter(Q(is_public=True) | Q(host=user))
        else:
            qs = qs.filter(is_public=True)

        # Radius filtering
        lat = self.request.query_params.get("lat")
        lng = self.request.query_params.get("lng")
        radius = self.request.query_params.get("radius")  # km

        if lat and lng and radius:
            try:
                lat = float(lat)
                lng = float(lng)
                radius_km = float(radius)

                # Earth geometry approximations:
                # 1 deg latitude ~ 111 km
                lat_delta = radius_km / 111.0

                # 1 deg longitude ~ 111 * cos(latitude) km
                lng_delta = radius_km / (111.0 * max(cos(radians(lat)), 0.00001))

                # Bounding box filter first (fast in SQL)
                qs = qs.filter(
                    lat__gte=lat - lat_delta,
                    lat__lte=lat + lat_delta,
                    lng__gte=lng - lng_delta,
                    lng__lte=lng + lng_delta,
                )

                # Then precise Haversine filter in Python (accurate)
                def haversine_km(lat1, lon1, lat2, lon2):
                    R = 6371.0
                    dlat = radians(lat2 - lat1)
                    dlon = radians(lon2 - lon1)
                    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
                    c = 2 * atan2(sqrt(a), sqrt(1 - a))
                    return R * c

                # Evaluate queryset after SQL bounding box
                filtered = []
                for e in qs:
                    dist = haversine_km(lat, lng, float(e.lat), float(e.lng))
                    if dist <= radius_km:
                        filtered.append(e.id)

                qs = qs.filter(id__in=filtered).order_by("-created_at")

            except ValueError:
                # If user passes nonsense values, ignore radius filtering
                pass

        return qs

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

    def retrieve(self, request, *args, **kwargs):
        """
        Get event details with host info, attendee count, and full attendee list.
        Enhanced response with all data needed by frontend.
        """
        event = self.get_object()
        serializer = self.get_serializer(event)
        
        # Get active attendees (JOINED or BOOKED, not CANCELLED)
        attendees = EventParticipation.objects.filter(
            event=event
        ).exclude(
            status='CANCELLED'
        ).select_related('user')
        
        # Build attendee list
        attendee_list = [
            {
                'id': p.user.id,
                'username': p.user.username,
            }
            for p in attendees
        ]
        
        # Build enhanced response
        data = serializer.data
        
        # Add host information
        data['host_id'] = event.host.id
        data['host_name'] = event.host.username
        
        # Add attendee information
        data['attendee_count'] = attendees.count()
        data['attendees'] = attendee_list
        
        # Category as string (for frontend color mapping)
        data['category'] = event.category.name if event.category else 'Other'
        
        # Check if current user has joined (for frontend button state)
        if request.user.is_authenticated:
            data['is_joined'] = EventParticipation.objects.filter(
                event=event,
                user=request.user
            ).exclude(
                status='CANCELLED'
            ).exists()
        else:
            data['is_joined'] = False
        
        return Response(data)

    def list(self, request, *args, **kwargs):
        """
        Enhanced list response with attendee counts for map markers.
        """
        queryset = self.filter_queryset(self.get_queryset())
        
        # Annotate with attendee count
        queryset = queryset.annotate(
            attendee_count=Count(
                'participants',
                filter=Q(participants__status__in=['JOINED', 'BOOKED'])
            )
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            # Add category as string and attendee_count to each event
            data = serializer.data
            for i, event in enumerate(page):
                data[i]['category'] = event.category.name if event.category else 'Other'
                data[i]['attendee_count'] = event.attendee_count
                data[i]['host_name'] = event.host.username
            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data
        for i, event in enumerate(queryset):
            data[i]['category'] = event.category.name if event.category else 'Other'
            data[i]['attendee_count'] = event.attendee_count
            data[i]['host_name'] = event.host.username
        return Response(data)

    @action(detail=True, methods=["post"], url_path="join", permission_classes=[IsAuthenticated])
    @transaction.atomic
    def join(self, request, pk=None):
        """
        Join an event with capacity and permission checks.
        """
        event = self.get_object()
        user = request.user

        # Hosts cannot join their own events
        if event.host == user:
            return Response(
                {"error": "Hosts cannot join their own events."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check capacity
        current_count = EventParticipation.objects.filter(
            event=event
        ).exclude(
            status="CANCELLED"
        ).count()
        
        if current_count >= event.capacity:
            return Response(
                {"error": "This event is at full capacity."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get or create participation
        participation, created = EventParticipation.objects.get_or_create(
            event=event,
            user=user,
            defaults={"status": "JOINED"},
        )

        # Check if already joined
        if not created and participation.status != "CANCELLED":
            return Response(
                {"error": "You have already joined this event."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If was cancelled before, re-join
        participation.status = "JOINED"
        participation.save()

        return Response(
            {
                "message": "Successfully joined the event!",
                "participation_id": participation.id,
                "status": participation.status
            },
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"], url_path="leave", permission_classes=[IsAuthenticated])
    @transaction.atomic
    def leave(self, request, pk=None):
        """
        Leave an event (soft delete - change status to CANCELLED).
        """
        event = self.get_object()
        user = request.user

        try:
            participation = EventParticipation.objects.get(
                event=event,
                user=user
            )
        except EventParticipation.DoesNotExist:
            return Response(
                {"error": "You have not joined this event."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if already cancelled
        if participation.status == "CANCELLED":
            return Response(
                {"error": "You have already left this event."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Soft delete: change status to CANCELLED
        participation.status = "CANCELLED"
        participation.save()

        return Response(
            {"message": "You have successfully left the event."},
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        """
        Only host can delete their own event.
        """
        event = self.get_object()
        
        if event.host != request.user:
            return Response(
                {"error": "Only the event host can delete this event."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Only host can edit their own event.
        """
        event = self.get_object()
        
        if event.host != request.user:
            return Response(
                {"error": "Only the event host can edit this event."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """
        Only host can edit their own event (PATCH).
        """
        event = self.get_object()
        
        if event.host != request.user:
            return Response(
                {"error": "Only the event host can edit this event."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().partial_update(request, *args, **kwargs)