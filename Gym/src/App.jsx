import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
// import Navbar from './components/Navbar'
import Login from './pages/Login'
import Reg from './pages/Reg'
import AdminDashboard from './pages/dashboard/admin/AdminDashboard'
import Reports from './pages/dashboard/components/Reports'
import Payments from './pages/dashboard/components/Payments'
import Members from './pages/dashboard/components/Members'
import Trainers from './pages/dashboard/components/Trainer'
import Settings from './pages/dashboard/components/Settings'
import Broadcast from './pages/dashboard/components/Broadcast'
import { Toaster } from 'react-hot-toast'
import UserDashboard from './pages/dashboard/user/UserDashboard'
import TrainerDashboard from './pages/dashboard/trainer/TrainerDashboard'
import Messages from './pages/dashboard/components/Messages'
import Attendance from './pages/dashboard/components/Attendance'
import { TrainerProvider } from './context/TrainerContext'
import { MembershipProvider } from './context/MembershipContext'
import { MemberProvider } from './context/MemberContext'
import { ConsultationProvider } from './context/ConsultationContext'
import MembershipPlans from './pages/dashboard/components/MembershipPlans'
import Workouts from './pages/dashboard/components/Workouts'
import UserWorkout from './pages/dashboard/components/UserWorkout'
import { WorkoutPlanProvider } from './context/WorkoutPlanContext'
import { DietPlanProvider } from './context/DietPlanContext'
import { ProgressProvider } from './context/ProgressContext'
import { AttendanceProvider } from './context/AttendanceContext'
import Progress from './pages/dashboard/components/Progress'
import UserPlan from './pages/dashboard/components/UserPlan'
import UserProfile from './pages/dashboard/user/UserProfile'
import DietPlans from './pages/dashboard/components/DietPlans'
import UserDiet from './pages/dashboard/components/UserDiet'
import { PlanRequestProvider } from './context/PlanRequestContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") || "dark";
    if (savedTheme !== "dark") {
      const themes = ["theme-light", "theme-midnight", "theme-emerald", "theme-sunset", "theme-ocean", "theme-obsidian"];
      document.body.classList.remove(...themes);
      document.body.classList.add(`theme-${savedTheme}`);
    }
  }, []);

  return (
    <>
      <Toaster
        position="bottom-right"
        containerStyle={{ zIndex: 120000 }}
        toastOptions={{
          style: {
            background: "#111827",
            color: "#fff",
          },
        }}
      />
      {/* <Navbar /> */}

      <AuthProvider>
        <MembershipProvider>
          <MemberProvider>
            <PlanRequestProvider>
              <ConsultationProvider>
                <TrainerProvider>
                  <AttendanceProvider>
                    <WorkoutPlanProvider>
                      <DietPlanProvider>
                        <ProgressProvider>
                          <NotificationProvider>
                            <Routes>
                              <Route path='/' element={<Home />} />
                              <Route path='/login' element={<><Home /><Login /></>} />
                              <Route path='/join' element={<><Home /><Reg /></>} />
                              
                              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                <Route path='/admin' element={<AdminDashboard />} />
                                <Route path='/admin/members' element={<Members role="admin" />} />
                                <Route path='/admin/trainers' element={<Trainers />} />
                                <Route path='/admin/membership' element={<MembershipPlans />} />
                                <Route path='/admin/reports' element={<Reports />} />
                                <Route path='/admin/payments' element={<Payments role="admin" />} />
                                <Route path='/admin/settings' element={<Settings role="admin" />} />
                                <Route path='/admin/attendance' element={<Attendance role="admin" />} />
                                <Route path='/admin/broadcast' element={<Broadcast />} />
                              </Route>

                              <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                                <Route path='/user/:userId' element={<UserDashboard />} />
                                <Route path='/user/:userId/plan' element={<UserPlan />} />
                                <Route path='/user/:userId/workout' element={<UserWorkout />} />
                                <Route path='/user/:userId/diet' element={<UserDiet />} />
                                <Route path='/user/:userId/progress' element={<Progress role="user" />} />
                                <Route path='/user/:userId/attendance' element={<Attendance role="user" />} />
                                <Route path='/user/:userId/settings' element={<Settings role="user" />} />
                                <Route path='/user/:userId/payments' element={<Payments role="user" />} />
                                <Route path='/user/:userId/profile' element={<UserProfile />} />
                              </Route>

                              <Route element={<ProtectedRoute allowedRoles={['trainer']} />}>
                                <Route path='/trainer/:trainerId' element={<TrainerDashboard />} />
                                <Route path='/trainer/:trainerId/members' element={<Members role="trainer" />} />
                                <Route path='/trainer/:trainerId/workouts' element={<Workouts />} />
                                <Route path='/trainer/:trainerId/diets' element={<DietPlans />} />
                                <Route path='/trainer/:trainerId/progress' element={<Progress role="trainer" />} />
                                <Route path='/trainer/:trainerId/broadcast' element={<Broadcast role="trainer" />} />
                                <Route path='/trainer/:trainerId/settings' element={<Settings role="trainer" />} />
                                <Route path='/trainer/:trainerId/attendance' element={<Attendance role="trainer" />} />
                              </Route>
                            </Routes>
                          </NotificationProvider>
                        </ProgressProvider>
                      </DietPlanProvider>
                    </WorkoutPlanProvider>
                  </AttendanceProvider>
                </TrainerProvider>
              </ConsultationProvider>
            </PlanRequestProvider>
          </MemberProvider>
        </MembershipProvider>
      </AuthProvider>
      {/* <Footer /> */}
    </>
  )
}

export default App
