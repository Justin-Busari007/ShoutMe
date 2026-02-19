from django.urls import path
from .views import (
    register, login, get_friends, get_users_for_adding,
    send_friend_request, get_pending_requests, accept_friend_request,
    reject_friend_request, manage_friend
)
from . import views

urlpatterns = [
    path("auth/register/", register),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    
    # Friends endpoints
    path('friends/', get_friends, name='get_friends'),
    path('users/available/', get_users_for_adding, name='available_users'),
    path('friend-request/send/', send_friend_request, name='send_friend_request'),
    path('friend-requests/pending/', get_pending_requests, name='pending_requests'),
    path('friend-request/<int:request_id>/accept/', accept_friend_request, name='accept_request'),
    path('friend-request/<int:request_id>/reject/', reject_friend_request, name='reject_request'),
    path('friend/<int:friend_id>/', manage_friend, name='manage_friend'),
]
