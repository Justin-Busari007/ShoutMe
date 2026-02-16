from django.db import models

# Create your models here.


from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    bio = models.TextField(blank=True)
    interests = models.TextField(blank=True)
    #profile_image = models.ImageField(upload_to='profiles/', blank=True, null=True)

