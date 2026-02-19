# accounts/views.py

# Add these imports at the top if they're not already there
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import FriendRequest
from .serializers import FriendRequestSerializer, UserBasicSerializer, UserDetailedSerializer

User = get_user_model()

# ... your existing views ...

# Add these two new functions:

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user and return JWT tokens."""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    password2 = request.data.get('password2')
    
    if not username or not email or not password:
        return Response(
            {'error': 'Please provide username, email, and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if password != password2:
        return Response(
            {'password2': ['Passwords do not match']},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'username': ['This username is already taken']},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {'email': ['This email is already registered']},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )
    
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT tokens."""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Please provide username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        },
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
        }
    }, status=status.HTTP_200_OK)


# Friend Management Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_friends(request):
    """Get all friends of the current user."""
    user = request.user
    friends = user.friends.all()
    serializer = UserBasicSerializer(friends, many=True)
    return Response({'friends': serializer.data, 'count': friends.count()})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users_for_adding(request):
    """Get all users except current user and their friends."""
    user = request.user
    # Get all users except the current user and their existing friends
    users = User.objects.exclude(id=user.id).exclude(friends=user).exclude(
        id__in=user.friend_requests_sent.filter(status='pending').values_list('to_user_id', flat=True)
    )
    
    search_query = request.query_params.get('search', '')
    if search_query:
        users = users.filter(username__icontains=search_query)
    
    serializer = UserBasicSerializer(users, many=True)
    return Response({'users': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_friend_request(request):
    """Send a friend request."""
    to_user_id = request.data.get('to_user_id')
    
    if not to_user_id:
        return Response(
            {'error': 'to_user_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        to_user = User.objects.get(id=to_user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check if already friends
    if request.user.friends.filter(id=to_user_id).exists():
        return Response(
            {'error': 'Already friends with this user'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if request already exists
    existing_request = FriendRequest.objects.filter(
        from_user=request.user,
        to_user=to_user
    ).first()
    
    if existing_request:
        if existing_request.status == 'pending':
            return Response(
                {'error': 'Friend request already sent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        existing_request.delete()
    
    friend_request = FriendRequest.objects.create(
        from_user=request.user,
        to_user=to_user,
        status='pending'
    )
    
    serializer = FriendRequestSerializer(friend_request)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pending_requests(request):
    """Get all pending friend requests for the current user."""
    incoming = FriendRequest.objects.filter(to_user=request.user, status='pending')
    serializer = FriendRequestSerializer(incoming, many=True)
    return Response({'pending_requests': serializer.data, 'count': incoming.count()})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_friend_request(request, request_id):
    """Accept a friend request."""
    try:
        friend_request = FriendRequest.objects.get(id=request_id)
    except FriendRequest.DoesNotExist:
        return Response(
            {'error': 'Friend request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if friend_request.to_user != request.user:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if friend_request.status != 'pending':
        return Response(
            {'error': f'Cannot accept {friend_request.status} request'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Add both users as friends
    friend_request.from_user.friends.add(friend_request.to_user)
    friend_request.to_user.friends.add(friend_request.from_user)
    
    friend_request.status = 'accepted'
    friend_request.save()
    
    serializer = FriendRequestSerializer(friend_request)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_friend_request(request, request_id):
    """Reject a friend request."""
    try:
        friend_request = FriendRequest.objects.get(id=request_id)
    except FriendRequest.DoesNotExist:
        return Response(
            {'error': 'Friend request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if friend_request.to_user != request.user:
        return Response(
            {'error': 'Unauthorized'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if friend_request.status != 'pending':
        return Response(
            {'error': f'Cannot reject {friend_request.status} request'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    friend_request.status = 'rejected'
    friend_request.save()
    
    serializer = FriendRequestSerializer(friend_request)
    return Response(serializer.data)


@api_view(['POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def manage_friend(request, friend_id):
    """Remove a friend (DELETE) or get friend details (GET)."""
    try:
        friend = User.objects.get(id=friend_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'DELETE':
        # Remove friend relationship
        if request.user.friends.filter(id=friend_id).exists():
            request.user.friends.remove(friend)
            friend.friends.remove(request.user)
            return Response({'message': 'Friend removed successfully'})
        else:
            return Response(
                {'error': 'Not friends with this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    return Response(UserDetailedSerializer(friend).data)

