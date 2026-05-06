import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gym_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile, Notification
from api.email_utils import send_ad_email

print("--- Testing Ad Email ---")
send_ad_email("Summer Promo!", "Get 50% off all plans this summer.", ["test@example.com"])

print("\n--- Testing Notification Email via Signals ---")
# Create a dummy user
user, created = User.objects.get_or_create(username='emailtestuser', email='emailtestuser@example.com')

# Create a notification for the user to trigger the signal
Notification.objects.create(
    user=user,
    title="Test Notification",
    message="This is a test notification to verify the signal works."
)

print("\nTests completed. You should see email outputs printed above.")
