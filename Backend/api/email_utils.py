from django.core.mail import send_mail, send_mass_mail
from django.conf import settings

def send_registration_email(user_email, name, role):
    subject = f"Welcome to our Gym, {name}!"
    message = f"Hi {name},\n\nWelcome to our Gym Management System. We are thrilled to have you as a new {role}!\n\nBest Regards,\nGym Management"
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user_email],
        fail_silently=False,
    )

def send_plan_assignment_email(member_email, member_name, plan_name):
    subject = "Your Membership Plan has been Updated"
    message = f"Hi {member_name},\n\nYou have been successfully assigned to the {plan_name} plan. We hope you enjoy our services!\n\nBest Regards,\nGym Management"
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [member_email],
        fail_silently=False,
    )

def send_trainer_assignment_email(member_email, member_name, trainer_name):
    subject = "Trainer Assigned to You"
    message = f"Hi {member_name},\n\nGood news! {trainer_name} has been assigned as your new trainer. They will reach out to you soon to get started.\n\nBest Regards,\nGym Management"
    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [member_email],
        fail_silently=False,
    )

def send_notification_email(user_email, title, message):
    subject = f"New Notification: {title}"
    email_message = f"You have a new system notification:\n\nTitle: {title}\nMessage: {message}\n\nPlease log in to the dashboard to see more details."
    send_mail(
        subject,
        email_message,
        settings.DEFAULT_FROM_EMAIL,
        [user_email],
        fail_silently=False,
    )

def send_ad_email(subject, message, recipient_list):
    """
    Sends a promotional email to a list of recipients.
    Uses send_mass_mail for efficiency.
    """
    messages = [
        (subject, message, settings.DEFAULT_FROM_EMAIL, [recipient])
        for recipient in recipient_list
    ]
    send_mass_mail(messages, fail_silently=False)
