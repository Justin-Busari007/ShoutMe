from django.urls import path
from .views import register, login
from . import views

urlpatterns = [
    path("auth/register/", register),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
]
