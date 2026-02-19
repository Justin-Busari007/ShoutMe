from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import FriendRequest

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords must match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class UserBasicSerializer(serializers.ModelSerializer):
    """Basic user info for displaying in friend lists"""
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'bio', 'interests')


class UserDetailedSerializer(serializers.ModelSerializer):
    """Detailed user info including friend count"""
    friends_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'bio', 'interests', 'friends_count')
    
    def get_friends_count(self, obj):
        return obj.friends.count()


class FriendRequestSerializer(serializers.ModelSerializer):
    from_user = UserBasicSerializer(read_only=True)
    to_user = UserBasicSerializer(read_only=True)
    from_user_id = serializers.IntegerField(write_only=True, required=False)
    to_user_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = FriendRequest
        fields = ('id', 'from_user', 'from_user_id', 'to_user', 'to_user_id', 'status', 'created_at', 'updated_at')
        read_only_fields = ('created_at', 'updated_at')
