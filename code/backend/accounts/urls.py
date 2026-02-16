from django.urls import path
from .views import register, me

urlpatterns = [
    path("auth/register/", register),
    path("me/", me),
]
