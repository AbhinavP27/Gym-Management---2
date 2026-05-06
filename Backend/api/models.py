from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('TRAINER', 'Trainer'),
        ('MEMBER', 'Member'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='MEMBER')
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    gender = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class MembershipPlan(models.Model):
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_months = models.IntegerField(default=1)
    features = models.JSONField(default=list)  # List of features

    def __str__(self):
        return self.name

class Trainer(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='trainer_data')
    specialization = models.CharField(max_length=200)
    bio = models.TextField(blank=True, null=True)
    experience_years = models.IntegerField(default=0)
    status = models.CharField(max_length=20, default='Active')  # Active, Busy, On Leave
    certificates = models.CharField(max_length=500, blank=True, null=True)
    experience = models.CharField(max_length=500, blank=True, null=True)
    details = models.TextField(blank=True, null=True)
    image = models.TextField(blank=True, null=True)  # Store Base64 or path

    def __str__(self):
        return self.profile.user.get_full_name() or self.profile.user.username

class Member(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='member_data')
    plan = models.ForeignKey(MembershipPlan, on_delete=models.SET_NULL, null=True, blank=True)
    trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_members')
    joined_at = models.DateField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)
    fitness_goal = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=200, blank=True, null=True)
    feedback = models.JSONField(default=list)  # Stores user feedback
    is_deleted = models.BooleanField(default=False)
    joined_date = models.DateField(auto_now_add=True, null=True)

    def __str__(self):
        return self.profile.user.get_full_name() or self.profile.user.username

class Attendance(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendance_logs')
    date = models.DateField(auto_now_add=True)
    time_in = models.TimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='Present')

    def __str__(self):
        return f"{self.member} - {self.date}"

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class WorkoutPlan(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='workout_plans')
    trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    data = models.JSONField(default=dict)  # Stores muscle groups and workouts

    def __str__(self):
        return f"Workout Plan for {self.member}"

class DietPlan(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='diet_plans')
    trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    data = models.JSONField(default=dict)  # Stores meals and items

    def __str__(self):
        return f"Diet Plan for {self.member}"
