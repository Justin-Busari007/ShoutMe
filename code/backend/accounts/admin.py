from django.contrib import admin
from .models import User, FriendRequest

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'get_friends_count')
    search_fields = ('username', 'email')
    
    def get_friends_count(self, obj):
        return obj.friends.count()
    get_friends_count.short_description = 'Friends'


@admin.register(FriendRequest)
class FriendRequestAdmin(admin.ModelAdmin):
    list_display = ('from_user', 'to_user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('from_user__username', 'to_user__username')
    readonly_fields = ('created_at', 'updated_at')
