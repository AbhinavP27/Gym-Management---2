from django.contrib import admin
from .models import Profile, MembershipPlan, Trainer, Member, Attendance, Notification, WorkoutPlan, DietPlan

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone')
    list_filter = ('role',)

@admin.register(MembershipPlan)
class MembershipPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'duration_months')

@admin.register(Trainer)
class TrainerAdmin(admin.ModelAdmin):
    list_display = ('profile', 'specialization', 'experience_years')

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ('profile', 'plan', 'trainer', 'expiry_date')
    list_filter = ('plan', 'trainer')

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('member', 'date', 'time_in', 'status')
    list_filter = ('date', 'status')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')

admin.site.register(WorkoutPlan)
admin.site.register(DietPlan)
