import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gym_backend.settings')
django.setup()

from api.serializers import TrainerSerializer
from django.contrib.auth.models import User

data = {
    "name": "Test Trainer",
    "email": "testtrainer@example.com",
    "specialization": "Bodybuilding",
    "password": "password123"
}

serializer = TrainerSerializer(data=data)
if serializer.is_valid():
    try:
        trainer = serializer.save()
        print(f"Successfully created trainer: {trainer}")
    except Exception as e:
        print(f"Error during save: {e}")
else:
    print(f"Validation errors: {serializer.errors}")
