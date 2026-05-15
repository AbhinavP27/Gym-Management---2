from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth.models import User
from .models import Profile, MembershipPlan, Trainer, Member, Attendance, Notification, WorkoutPlan, DietPlan
from .serializers import (
    UserSerializer, ProfileSerializer, MembershipPlanSerializer, 
    TrainerSerializer, MemberSerializer, AttendanceSerializer, 
    NotificationSerializer, WorkoutPlanSerializer, DietPlanSerializer
)

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        profile = request.user.profile
        if request.method.lower() == 'patch':
            serializer = self.get_serializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = self.get_serializer(profile)
        return Response(serializer.data)

class MembershipPlanViewSet(viewsets.ModelViewSet):
    queryset = MembershipPlan.objects.all()
    serializer_class = MembershipPlanSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class TrainerViewSet(viewsets.ModelViewSet):
    queryset = Trainer.objects.all()
    serializer_class = TrainerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

class MemberViewSet(viewsets.ModelViewSet):
    queryset = Member.objects.all()
    serializer_class = MemberSerializer
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    @action(detail=True, methods=['post'])
    def remind_plan(self, request, pk=None):
        member = self.get_object()
        
        Notification.objects.create(
            user=member.profile.user,
            title="Plan Expiry Reminder",
            message="Your membership plan is approaching expiration or has expired. Please log in or contact the front desk to renew your plan to continue your fitness journey!"
        )
        
        return Response({"message": "Reminder sent successfully."})

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role == 'ADMIN':
            return Attendance.objects.all()
        elif user.profile.role == 'TRAINER':
            return Attendance.objects.filter(member__trainer__profile__user=user)
        return Attendance.objects.filter(member__profile__user=user)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_index('-created_at')

class WorkoutPlanViewSet(viewsets.ModelViewSet):
    queryset = WorkoutPlan.objects.all()
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.profile.role == 'ADMIN':
            return WorkoutPlan.objects.all()
        if user.profile.role == 'TRAINER':
            return WorkoutPlan.objects.filter(member__trainer__profile__user=user)
        return WorkoutPlan.objects.filter(member__profile__user=user)

    def create(self, request, *args, **kwargs):
        member_id = request.data.get('member')
        plan_data = request.data.get('data', {}) or {}

        if not member_id:
            return Response({'member': 'Member ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

        member = Member.objects.filter(id=member_id).first()
        if not member:
            return Response({'member': 'Member not found.'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.profile.role == 'TRAINER' and member.trainer and member.trainer.profile.user != request.user:
            return Response({'detail': 'You are not allowed to assign workouts for this member.'}, status=status.HTTP_403_FORBIDDEN)

        trainer_instance = None
        if request.user.profile.role == 'TRAINER':
            trainer_instance = Trainer.objects.filter(profile__user=request.user).first()
            if member.trainer and member.trainer.profile.user != request.user:
                return Response({'detail': 'You are not allowed to assign workouts for this member.'}, status=status.HTTP_403_FORBIDDEN)

        workout_plan, created = WorkoutPlan.objects.get_or_create(
            member=member,
            defaults={
                'trainer': member.trainer or trainer_instance,
                'data': {'groups': {}},
            },
        )

        existing_groups = workout_plan.data.get('groups', {}) if isinstance(workout_plan.data, dict) else {}
        next_groups = {**existing_groups}

        incoming_groups = plan_data.get('groups') if isinstance(plan_data, dict) else None
        if incoming_groups and isinstance(incoming_groups, dict):
            for group_id, group_payload in incoming_groups.items():
                if group_payload and isinstance(group_payload, dict) and group_payload.get('workouts'):
                    next_groups[group_id] = group_payload
                else:
                    next_groups.pop(group_id, None)
        else:
            next_groups = {}

        workout_plan.data = {'groups': next_groups}
        if request.user.profile.role == 'TRAINER' and trainer_instance:
            workout_plan.trainer = member.trainer or trainer_instance
        workout_plan.save()

        serializer = self.get_serializer(workout_plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

class DietPlanViewSet(viewsets.ModelViewSet):
    queryset = DietPlan.objects.all()
    serializer_class = DietPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

from .email_utils import send_ad_email

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_ads(request):
    subject = request.data.get('subject')
    message = request.data.get('message')
    audience = request.data.get('audience', 'all')
    user = request.user
    
    if not subject or not message:
        return Response({'error': 'Subject and message are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Get active members base query
    members = Member.objects.filter(is_deleted=False)

    # Restrict base scope for Trainers
    is_trainer = hasattr(user, 'profile') and user.profile.role == 'TRAINER'
    if is_trainer:
        members = members.filter(trainer__profile__user=user)
        # If 'all' is sent by a trainer, it intuitively means all THEIR assigned members. 
        # If 'my_members' is sent, it also means all their assigned members.

    # Apply specialized tier filtering dynamically
    if audience == 'gold':
        members = members.filter(plan__name__iexact='Gold')
    elif audience == 'diamond':
        members = members.filter(plan__name__iexact='Diamond')
    elif audience == 'my_members' and not is_trainer:
        # If Admin explicitly picks "My Members", it means nobody, or maybe they shouldn't even have that option.
        return Response({'error': 'Admins cannot filter by personal trainer assignment like this.'}, status=400)

    emails = []
    for member in members:
        if member.profile.user.email:
            emails.append(member.profile.user.email)
            
    if not emails:
        return Response({'error': 'No active members with matching criteria found.'}, status=status.HTTP_404_NOT_FOUND)
        
    try:
        from .email_utils import send_ad_email
        send_ad_email(subject, message, emails)
        return Response({'message': f'Broadcast sent successfully to {len(emails)} member(s).'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
