from rest_framework import serializers
from .models import Event, Category, EventParticipation

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]

class EventSerializer(serializers.ModelSerializer):
    host_username = serializers.CharField(source="host.username", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "host", "host_username",
            "title", "description",
            "category", "category_name",
            "start_time", "end_time",
            "location_name", "address", "lat", "lng",
            "capacity", "is_public",
            "is_cancelled",
            "created_at",
        ]
        read_only_fields = ["host", "created_at"]

class EventParticipationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = EventParticipation
        fields = ["id", "event", "user", "user_username", "status", "created_at"]
        read_only_fields = ["event", "user", "created_at"]
