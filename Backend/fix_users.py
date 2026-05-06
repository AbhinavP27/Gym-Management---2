import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gym_backend.settings')
django.setup()

from django.contrib.auth.models import User

def fix_users():
    print("Syncing usernames to emails...")
    users = User.objects.all()
    for user in users:
        if user.email and user.username != user.email:
            old_username = user.username
            user.username = user.email
            user.save()
            print(f"Updated {old_username} -> {user.username}")
    
    # Ensure admin user specifically
    admin, created = User.objects.get_or_create(
        email='admin@urbangrind.com',
        defaults={'username': 'admin@urbangrind.com', 'is_staff': True, 'is_superuser': True}
    )
    if created or admin.username != 'admin@urbangrind.com':
        admin.username = 'admin@urbangrind.com'
        admin.set_password('admin123')
        admin.save()
        print("Ensured admin: admin@urbangrind.com / admin123")

    print("Sync completed!")

if __name__ == '__main__':
    fix_users()
