import os
import django
from decimal import Decimal
from datetime import datetime

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gym_backend.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Profile, MembershipPlan, Trainer, Member

def seed_full():
    print("Starting Full Data Migration with Basic Plan logic...")

    # 1. Cleanup
    User.objects.exclude(username='admin@urbangrind.com').delete()
    MembershipPlan.objects.all().delete()
    print("Cleared existing data.")

    # 2. Create Plans
    plans_data = [
        {"id": 1, "name": "Basic", "price": 999.00, "features": ["Access to Gym Equipment", "Basic Workout Plan", "Locker Facility", "Fitness Assessment"]},
        {"id": 2, "name": "Gold", "price": 3499.00, "features": ["All Premium Features", "Personal Trainer (8 sessions)", "Diet Consultation", "Monthly Progress Tracking"]},
        {"id": 3, "name": "Diamond", "price": 5499.00, "features": ["All Gold Features", "Unlimited Personal Training", "Body Transformation Program", "Priority Support"]},
    ]
    
    plans = {}
    for p in plans_data:
        plan = MembershipPlan.objects.create(pk=p['id'], name=p['name'], price=Decimal(p['price']), features=p['features'])
        plans[p['name']] = plan
    print(f"Created {len(plans)} Membership Plans.")

    # 3. Create Trainers with full profiles
    trainer_profiles = [
        {
            "id": 1, "name": "Tharun Kumar", "email": "tharun.kumar@urbangrind.com", "role": "Strength Trainer",
            "status": "Active", "certificates": "ACE Certified Trainer", "experience": "8+ Years Experience",
            "details": "Specialist in strength training, muscle gain programs and athletic performance.",
            "image": "/src/assets/trainer1.png"
        },
        {
            "id": 2, "name": "Varsha Tharun", "email": "varsha.tharun@urbangrind.com", "role": "Cardio Trainer",
            "status": "Busy", "certificates": "ISSA Cardio Specialist", "experience": "6+ Years Experience",
            "details": "Expert in fat loss, endurance training and cardiovascular fitness programs.",
            "image": "/src/assets/trainer2.png"
        },
        {
            "id": 3, "name": "Alen Mathew", "email": "alen.mathew@urbangrind.com", "role": "Bodybuilding Trainer",
            "status": "On Leave", "certificates": "IFBB Certified Coach", "experience": "10+ Years Experience",
            "details": "Professional bodybuilding coach with expertise in competition preparation.",
            "image": "/src/assets/trainer3.png"
        },
    ]

    trainers = {}
    for t_data in trainer_profiles:
        names = t_data['name'].split(' ')
        user = User.objects.create_user(
            username=t_data['email'], email=t_data['email'],
            first_name=names[0], last_name=names[1] if len(names) > 1 else "",
            password='gympass123'
        )
        profile = Profile.objects.create(user=user, role='TRAINER')
        trainer = Trainer.objects.create(
            pk=t_data['id'], profile=profile, specialization=t_data['role'],
            status=t_data['status'], certificates=t_data['certificates'],
            experience=t_data['experience'], details=t_data['details'], image=t_data['image']
        )
        trainers[t_data['id']] = trainer
    print(f"Created {len(trainers)} Trainers.")

    # 4. Create Members (Basic members will have NO trainer assigned)
    member_data = [
        # Trainer 1 (Strength) - Gold/Diamond Members
        {"id": 101, "name": "Aarav Mehta", "email": "aarav.mehta@member.urbangrind.com", "plan": "Gold", "trainerId": 1, "expiry": "2026-04-18"},
        {"id": 102, "name": "Neha Verma", "email": "neha.verma@member.urbangrind.com", "plan": "Diamond", "trainerId": 1, "expiry": "2026-04-22"},
        {"id": 103, "name": "Rohan Nair", "email": "rohan.nair@member.urbangrind.com", "plan": "Gold", "trainerId": 1, "expiry": "2026-04-29"},
        {"id": 105, "name": "Karthik Das", "email": "karthik.das@member.urbangrind.com", "plan": "Diamond", "trainerId": 1, "expiry": "2026-05-09"},
        {"id": 106, "name": "Sana Ali", "email": "sana.ali@member.urbangrind.com", "plan": "Gold", "trainerId": 1, "expiry": "2026-05-14"},
        {"id": 108, "name": "Meera Pillai", "email": "meera.pillai@member.urbangrind.com", "plan": "Gold", "trainerId": 1, "expiry": "2026-05-24"},
        {"id": 109, "name": "Ishaan Kapoor", "email": "ishaan.kapoor@member.urbangrind.com", "plan": "Diamond", "trainerId": 1, "expiry": "2026-05-30"},
        {"id": 111, "name": "Rahul Soman", "email": "rahul.soman@member.urbangrind.com", "plan": "Gold", "trainerId": 1, "expiry": "2026-06-11"},
        {"id": 112, "name": "Ananya Iyer", "email": "ananya.iyer@member.urbangrind.com", "plan": "Diamond", "trainerId": 1, "expiry": "2026-06-17"},
        {"id": 114, "name": "Diya Balan", "email": "diya.balan@member.urbangrind.com", "plan": "Gold", "trainerId": 1, "expiry": "2026-06-28"},
        {"id": 115, "name": "Manav Khanna", "email": "manav.khanna@member.urbangrind.com", "plan": "Diamond", "trainerId": 1, "expiry": "2026-07-03"},
        {"id": 117, "name": "Arjun Paul", "email": "arjun.paul@member.urbangrind.com", "plan": "Gold", "trainerId": 1, "expiry": "2026-07-14"},
        {"id": 118, "name": "Nisha Thomas", "email": "nisha.thomas@member.urbangrind.com", "plan": "Diamond", "trainerId": 1, "expiry": "2026-07-20"},
        {"id": 200, "name": "Pooja Rao", "email": "pooja.rao@member.urbangrind.com", "plan": "Gold", "trainerId": 1, "expiry": "2026-07-31"},

        # Trainer 2 (Cardio) - Gold/Diamond Members
        {"id": 201, "name": "Aditi Sharma", "email": "aditi.sharma@member.urbangrind.com", "plan": "Gold", "trainerId": 2, "expiry": "2026-08-04"},
        {"id": 202, "name": "Rohit Bhatia", "email": "rohit.bhatia@member.urbangrind.com", "plan": "Diamond", "trainerId": 2, "expiry": "2026-08-08"},
        {"id": 204, "name": "Dev Malhotra", "email": "dev.malhotra@member.urbangrind.com", "plan": "Gold", "trainerId": 2, "expiry": "2026-08-16"},
        {"id": 205, "name": "Nandini Rao", "email": "nandini.rao@member.urbangrind.com", "plan": "Diamond", "trainerId": 2, "expiry": "2026-08-20"},
        {"id": 207, "name": "Isha Kapoor", "email": "isha.kapoor@member.urbangrind.com", "plan": "Gold", "trainerId": 2, "expiry": "2026-08-28"},
        {"id": 208, "name": "Mohit Chawla", "email": "mohit.chawla@member.urbangrind.com", "plan": "Diamond", "trainerId": 2, "expiry": "2026-09-01"},
        {"id": 210, "name": "Gaurav Bedi", "email": "gaurav.bedi@member.urbangrind.com", "plan": "Gold", "trainerId": 2, "expiry": "2026-09-09"},
        {"id": 221, "name": "Bhargavi Iyer", "email": "bhargavi.iyer@member.urbangrind.com", "plan": "Diamond", "trainerId": 2, "expiry": "2026-09-13"},
        {"id": 222, "name": "Kunal Arora", "email": "kunal.arora@member.urbangrind.com", "plan": "Gold", "trainerId": 2, "expiry": "2026-09-17"},
        {"id": 224, "name": "Harsha Vardhan", "email": "harsha.vardhan@member.urbangrind.com", "plan": "Gold", "trainerId": 2, "expiry": "2026-09-25"},
        {"id": 225, "name": "Pallavi Nair", "email": "pallavi.nair@member.urbangrind.com", "plan": "Diamond", "trainerId": 2, "expiry": "2026-09-29"},
        {"id": 227, "name": "Shreya Menon", "email": "shreya.menon@member.urbangrind.com", "plan": "Gold", "trainerId": 2, "expiry": "2026-10-07"},
        {"id": 228, "name": "Manish Yadav", "email": "manish.yadav@member.urbangrind.com", "plan": "Diamond", "trainerId": 2, "expiry": "2026-10-11"},
        {"id": 230, "name": "Adarsh Nanda", "email": "adarsh.nanda@member.urbangrind.com", "plan": "Gold", "trainerId": 2, "expiry": "2026-10-19"},

        # Trainer 3 (Bodybuilding) - Gold/Diamond Members
        {"id": 211, "name": "Harish Nambiar", "email": "harish.nambiar@member.urbangrind.com", "plan": "Diamond", "trainerId": 3, "expiry": "2026-08-06"},
        {"id": 212, "name": "Pritika Das", "email": "pritika.das@member.urbangrind.com", "plan": "Gold", "trainerId": 3, "expiry": "2026-08-10"},
        {"id": 214, "name": "Sanjana Murthy", "email": "sanjana.murthy@member.urbangrind.com", "plan": "Gold", "trainerId": 3, "expiry": "2026-08-18"},
        {"id": 215, "name": "Abhinav Singh", "email": "abhinav.singh@member.urbangrind.com", "plan": "Diamond", "trainerId": 3, "expiry": "2026-08-22"},
        {"id": 217, "name": "Ritesh Menon", "email": "ritesh.menon@member.urbangrind.com", "plan": "Gold", "trainerId": 3, "expiry": "2026-08-30"},
        {"id": 218, "name": "Bhavna Sethi", "email": "bhavna.sethi@member.urbangrind.com", "plan": "Diamond", "trainerId": 3, "expiry": "2026-09-03"},
        {"id": 220, "name": "Tanvi Bose", "email": "tanvi.bose@member.urbangrind.com", "plan": "Gold", "trainerId": 3, "expiry": "2026-09-11"},
        {"id": 231, "name": "Madhuri Kulshreshtha", "email": "madhuri.kulshreshtha@member.urbangrind.com", "plan": "Diamond", "trainerId": 3, "expiry": "2026-09-15"},
        {"id": 232, "name": "Nikhil Fernandes", "email": "nikhil.fernandes@member.urbangrind.com", "plan": "Gold", "trainerId": 3, "expiry": "2026-09-19"},
        {"id": 234, "name": "Pranav Chopra", "email": "pranav.chopra@member.urbangrind.com", "plan": "Gold", "trainerId": 3, "expiry": "2026-09-27"},
        {"id": 235, "name": "Jhanvi Suresh", "email": "jhanvi.suresh@member.urbangrind.com", "plan": "Diamond", "trainerId": 3, "expiry": "2026-10-01"},
        {"id": 237, "name": "Mitali Roy", "email": "mitali.roy@member.urbangrind.com", "plan": "Gold", "trainerId": 3, "expiry": "2026-10-09"},
        {"id": 238, "name": "Sachin Bhasin", "email": "sachin.bhasin@member.urbangrind.com", "plan": "Diamond", "trainerId": 3, "expiry": "2026-10-13"},
        {"id": 240, "name": "Keshav Tiwari", "email": "keshav.tiwari@member.urbangrind.com", "plan": "Gold", "trainerId": 3, "expiry": "2026-10-21"},

        # BASIC Members - No trainer assigned
        {"id": 104, "name": "Priya Menon", "email": "priya.menon@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-05-03"},
        {"id": 107, "name": "Vivek Raj", "email": "vivek.raj@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-05-19"},
        {"id": 110, "name": "Kavya Reddy", "email": "kavya.reddy@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-06-05"},
        {"id": 113, "name": "Tarun Joseph", "email": "tarun.joseph@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-06-22"},
        {"id": 116, "name": "Sneha George", "email": "sneha.george@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-07-09"},
        {"id": 119, "name": "Varun Shetty", "email": "varun.shetty@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-07-25"},
        {"id": 203, "name": "Swathi Krishnan", "email": "swathi.krishnan@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-08-12"},
        {"id": 206, "name": "Akash Kulkarni", "email": "akash.kulkarni@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-08-24"},
        {"id": 209, "name": "Lavanya Srinivasan", "email": "lavanya.srinivasan@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-09-05"},
        {"id": 223, "name": "Namrata Pillai", "email": "namrata.pillai@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-09-21"},
        {"id": 226, "name": "Rachit Jain", "email": "rachit.jain@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-10-03"},
        {"id": 229, "name": "Keerthana Babu", "email": "keerthana.babu@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-10-15"},
        {"id": 213, "name": "Yash Patil", "email": "yash.patil@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-08-14"},
        {"id": 216, "name": "Kriti Joshi", "email": "kriti.joshi@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-08-26"},
        {"id": 219, "name": "Deepak Narayan", "email": "deepak.narayan@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-09-07"},
        {"id": 233, "name": "Sowmya Ramesh", "email": "sowmya.ramesh@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-09-23"},
        {"id": 236, "name": "Rohan Deshpande", "email": "rohan.deshpande@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-10-05"},
        {"id": 239, "name": "Ankita Mohan", "email": "ankita.mohan@member.urbangrind.com", "plan": "Basic", "trainerId": None, "expiry": "2026-10-17"},
    ]

    for m in member_data:
        names = m['name'].split(' ')
        user = User.objects.create_user(
            username=m['email'], email=m['email'],
            first_name=names[0], last_name=names[1] if len(names) > 1 else "",
            password='gympass123'
        )
        profile = Profile.objects.create(user=user, role='MEMBER')
        
        # Parse expiry date
        expiry_dt = datetime.strptime(m['expiry'], '%Y-%m-%d').date()
        
        Member.objects.create(
            pk=m['id'],
            profile=profile,
            plan=plans[m['plan']],
            trainer=trainers.get(m['trainerId']), # Use .get() to handle None gracefully
            expiry_date=expiry_dt
        )
    
    print(f"Successfully re-seeded {len(member_data)} Members with Basic Plan Logic.")

if __name__ == "__main__":
    seed_full()
