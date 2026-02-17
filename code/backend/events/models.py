from django.db import models
from django.conf import settings


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Event(models.Model):
    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="hosted_events",
    )

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    location_name = models.CharField(max_length=200)
    address = models.CharField(max_length=300)
    lat = models.FloatField()
    lng = models.FloatField()

    capacity = models.PositiveIntegerField(default=50)
    is_public = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class EventParticipation(models.Model):
    STATUS_CHOICES = [
        ("JOINED", "JOINED"),
        ("BOOKED", "BOOKED"),
        ("CANCELLED", "CANCELLED"),
    ]

    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="participants",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="event_participations",
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="JOINED",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "user")

    def __str__(self):
        return f"{self.user} -> {self.event} ({self.status})"