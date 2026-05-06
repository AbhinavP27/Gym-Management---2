from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    ProfileViewSet, MembershipPlanViewSet, TrainerViewSet, 
    MemberViewSet, AttendanceViewSet, NotificationViewSet, 
    WorkoutPlanViewSet, DietPlanViewSet, send_ads
)

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet)
router.register(r'plans', MembershipPlanViewSet)
router.register(r'trainers', TrainerViewSet)
router.register(r'members', MemberViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'notifications', NotificationViewSet)
router.register(r'workouts', WorkoutPlanViewSet)
router.register(r'diet', DietPlanViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('send-ads/', send_ads, name='send_ads'),
]
