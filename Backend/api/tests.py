from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import MembershipPlan, Member, Profile

class GymAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create Admin
        self.admin_user = User.objects.create_superuser(
            username='testadmin', email='test@admin.com', password='password123'
        )
        self.admin_profile = Profile.objects.create(user=self.admin_user, role='ADMIN')
        
        # Get Token
        response = self.client.post('/api/token/', {
            'username': 'testadmin',
            'password': 'password123'
        })
        self.token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_membership_plan_access(self):
        """Verify plans are accessible"""
        MembershipPlan.objects.create(name='Basic Test', price=99.00)
        response = self.client.get('/api/plans/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Basic Test')

    def test_member_registration_api(self):
        """Verify member retrieval"""
        plan = MembershipPlan.objects.create(name='Gold Test', price=500.00)
        user = User.objects.create(username='member1', first_name='Test', last_name='User')
        profile = Profile.objects.create(user=user, role='MEMBER')
        Member.objects.create(profile=profile, plan=plan)
        
        response = self.client.get('/api/members/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['full_name'], 'Test User')

    def test_auth_failure(self):
        """Ensure unauthenticated users cannot access members"""
        self.client.credentials()  # Clear tokens
        response = self.client.get('/api/members/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
