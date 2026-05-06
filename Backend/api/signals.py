from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from .email_utils import send_notification_email

@receiver(post_save, sender=Notification)
def send_email_on_notification_create(sender, instance, created, **kwargs):
    if created and instance.user.email:
        send_notification_email(
            instance.user.email,
            instance.title,
            instance.message
        )
