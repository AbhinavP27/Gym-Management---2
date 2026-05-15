from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Profile, MembershipPlan, Trainer, Member, Attendance, Notification, WorkoutPlan, DietPlan
from .email_utils import send_registration_email, send_plan_assignment_email, send_trainer_assignment_email

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email')

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False)
    member_id = serializers.SerializerMethodField()
    trainer_id = serializers.SerializerMethodField()

    class Meta:
        model = Profile
        fields = (
            'id',
            'user',
            'name',
            'email',
            'current_password',
            'new_password',
            'role',
            'phone',
            'address',
            'gender',
            'member_id',
            'trainer_id',
        )

    def get_member_id(self, obj):
        if hasattr(obj, 'member_data'):
            return obj.member_data.id
        return None

    def get_trainer_id(self, obj):
        if hasattr(obj, 'trainer_data'):
            return obj.trainer_data.id
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['name'] = instance.user.get_full_name() or instance.user.username
        ret['email'] = instance.user.email
        return ret

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        email = validated_data.pop('email', None)

        user = instance.user
        user_changed = False

        if name is not None:
            cleaned_name = name.strip()
            if cleaned_name:
                parts = cleaned_name.split(' ', 1)
                user.first_name = parts[0]
                user.last_name = parts[1] if len(parts) > 1 else ""
            else:
                user.first_name = ""
                user.last_name = ""
            user_changed = True

        if email is not None:
            cleaned_email = email.strip().lower()
            if cleaned_email:
                existing = User.objects.filter(username=cleaned_email).exclude(id=user.id).exists()
                if existing:
                    raise serializers.ValidationError({"email": "A user with this email already exists."})
                user.username = cleaned_email
                user.email = cleaned_email
                user_changed = True

        new_password = validated_data.pop('new_password', None)
        current_password = validated_data.pop('current_password', None)
        if new_password is not None:
            if not current_password:
                raise serializers.ValidationError({"current_password": "Current password is required to change password."})
            if not user.check_password(current_password):
                raise serializers.ValidationError({"current_password": "Current password is incorrect."})
            try:
                validate_password(new_password, user)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"new_password": list(exc.messages)})
            user.set_password(new_password)
            user_changed = True

        if user_changed:
            user.save()

        return super().update(instance, validated_data)

class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlan
        fields = '__all__'

class TrainerSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    members = serializers.SerializerMethodField()
    
    class Meta:
        model = Trainer
        fields = '__all__'
        extra_kwargs = {'profile': {'required': False}}

    def get_members(self, obj):
        return Member.objects.filter(trainer=obj).count()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['name'] = instance.profile.user.get_full_name() or instance.profile.user.username
        ret['email'] = instance.profile.user.email
        return ret

    def create(self, validated_data):
        name = validated_data.pop('name', '')
        email = validated_data.pop('email', '')
        password = validated_data.pop('password', None)
        # Pop profile if it was passed as None or empty
        validated_data.pop('profile', None)
        
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})

        # Create or update user
        user, created = User.objects.get_or_create(
            username=email,
            defaults={'email': email}
        )
        
        if name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            user.save()
            
        if password:
            user.set_password(password)
            user.save()

        # Ensure profile exists
        profile, _ = Profile.objects.get_or_create(user=user, defaults={'role': 'TRAINER'})
        profile.role = 'TRAINER'
        profile.save()
        
        # Create trainer
        trainer = Trainer.objects.create(profile=profile, **validated_data)
        
        # Send registration email
        if email:
            send_registration_email(email, user.get_full_name() or user.username, "Trainer")

        return trainer

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        email = validated_data.pop('email', None)
        password = validated_data.pop('password', None)
        # Pop profile to avoid OneToOne conflict if sent
        validated_data.pop('profile', None)
        
        user = instance.profile.user
        user_changed = False

        if email:
            user.username = email
            user.email = email
            user_changed = True
        if name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
            user_changed = True
        if password:
            user.set_password(password)
            user_changed = True

        if user_changed:
            user.save()
            
        return super().update(instance, validated_data)

class MemberSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(required=False)
    gender = serializers.CharField(required=False)
    address = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    fitnessGoal = serializers.CharField(source='fitness_goal', required=False, allow_blank=True, allow_null=True)
    emergencyContact = serializers.CharField(source='emergency_contact', required=False, allow_blank=True, allow_null=True)
    
    # We redefine representation logic in `to_representation` to let front-end handle these flat fields
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    trainer_name = serializers.SerializerMethodField()
    trainerId = serializers.SerializerMethodField()
    expiry = serializers.DateField(source='expiry_date', read_only=True)
    isDeleted = serializers.BooleanField(source='is_deleted', read_only=True)
    
    class Meta:
        model = Member
        fields = '__all__'
        extra_kwargs = {'profile': {'required': False}}

    def get_trainer_name(self, obj):
        if obj.trainer:
            return obj.trainer.profile.user.get_full_name() or obj.trainer.profile.user.username
        return ""

    def get_trainerId(self, obj):
        if obj.trainer:
            return obj.trainer.id
        return None

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Compatibility with old front-end bindings
        ret['name'] = instance.profile.user.get_full_name() or instance.profile.user.username
        ret['email'] = instance.profile.user.email
        ret['phone'] = instance.profile.phone or ""
        ret['address'] = instance.profile.address or ""
        ret['gender'] = instance.profile.gender or ""
        ret['fitnessGoal'] = instance.fitness_goal or ""
        ret['emergencyContact'] = instance.emergency_contact or ""
        ret['joinedAt'] = instance.joined_at.isoformat() if instance.joined_at else None
        ret['plan'] = ret.get('plan_name')
        ret['trainer'] = ret.get('trainer_name')
        return ret

    def create(self, validated_data):
        name = validated_data.pop('name', '')
        email = validated_data.pop('email', '')
        password = validated_data.pop('password', None)
        phone = validated_data.pop('phone', '')
        gender = validated_data.pop('gender', '')
        
        # 'plan' from frontend might come as string or ID depending on the context, we must catch it from initial_data if it fails validation
        req_plan_name = self.initial_data.get('plan')
        req_trainer_id = self.initial_data.get('trainerId')
        
        validated_data.pop('profile', None) # Remove if empty
        
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})

        # Create or fetch user
        user, _ = User.objects.get_or_create(username=email, defaults={'email': email})
        
        if name:
            parts = name.split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
        
        if password:
            user.set_password(password)
        user.save()

        # Ensure profile
        profile, _ = Profile.objects.get_or_create(user=user, defaults={'role': 'MEMBER'})
        profile.role = 'MEMBER'
        if phone: profile.phone = phone
        if gender: profile.gender = gender
        profile.save()

        # Handle Plan Resolution
        plan_obj = None
        if req_plan_name:
            plan_obj = MembershipPlan.objects.filter(name=req_plan_name).first()
            
        trainer_obj = None
        if req_trainer_id:
            trainer_obj = Trainer.objects.filter(id=req_trainer_id).first()

        # Create member
        member = Member.objects.create(
            profile=profile, 
            plan=plan_obj,
            trainer=trainer_obj,
            fitness_goal=validated_data.get('fitness_goal', ''),
            emergency_contact=validated_data.get('emergency_contact', '')
        )
        
        if email:
            send_registration_email(email, user.get_full_name() or user.username, "Member")

        return member

    def update(self, instance, validated_data):
        name = validated_data.pop('name', None)
        email = validated_data.pop('email', None)
        phone = validated_data.pop('phone', None)
        gender = validated_data.pop('gender', None)
        address = validated_data.pop('address', None)
        old_plan = instance.plan
        old_trainer = instance.trainer

        user = instance.profile.user
        profile = instance.profile
        user_changed = False
        profile_changed = False

        if name is not None:
            cleaned_name = name.strip()
            if cleaned_name:
                parts = cleaned_name.split(' ', 1)
                user.first_name = parts[0]
                user.last_name = parts[1] if len(parts) > 1 else ""
            else:
                user.first_name = ""
                user.last_name = ""
            user_changed = True

        if email is not None:
            cleaned_email = email.strip().lower()
            if cleaned_email:
                existing = User.objects.filter(username=cleaned_email).exclude(id=user.id).exists()
                if existing:
                    raise serializers.ValidationError({"email": "A user with this email already exists."})
                user.username = cleaned_email
                user.email = cleaned_email
                user_changed = True

        if phone is not None:
            profile.phone = phone
            profile_changed = True

        if gender is not None:
            profile.gender = gender
            profile_changed = True

        if address is not None:
            profile.address = address
            profile_changed = True

        if user_changed:
            user.save()

        if profile_changed:
            profile.save()
        
        member = super().update(instance, validated_data)
        
        # Check if plan changed
        if member.plan and member.plan != old_plan:
            if hasattr(member.profile, 'user') and member.profile.user.email:
                send_plan_assignment_email(
                    member.profile.user.email,
                    member.profile.user.get_full_name() or member.profile.user.username,
                    member.plan.name
                )
                
        # Check if trainer changed
        if member.trainer and member.trainer != old_trainer:
            if hasattr(member.profile, 'user') and member.profile.user.email:
                trainer_name = member.trainer.profile.user.get_full_name() or member.trainer.profile.user.username
                send_trainer_assignment_email(
                    member.profile.user.email,
                    member.profile.user.get_full_name() or member.profile.user.username,
                    trainer_name
                )
                
        return member

class AttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source='member.profile.user.get_full_name', read_only=True)
    class Meta:
        model = Attendance
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class WorkoutPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkoutPlan
        fields = '__all__'

class DietPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietPlan
        fields = '__all__'
