import {
  FaTachometerAlt,
  FaUsers,
  FaDumbbell,
  FaCreditCard,
  FaCalendarCheck,
  FaChartBar,
  FaCog,
  FaUser,
  FaRunning,
  FaClipboardList,
  FaComments,
  FaHouseDamage,
  FaHamsa,
  FaHackerNews,
  FaGalacticRepublic,
  FaBomb,
  FaElementor,
  FaDashcube,
  FaBlenderPhone,
  FaHouseUser,
  FaBullhorn,
} from "react-icons/fa";

export const sidebarConfig = {
  admin: [
    { name: "Dashboard", path: "/admin", icon: FaHouseUser },

    { name: "Members", path: "/admin/members", icon: FaUsers },
    { name: "Trainers", path: "/admin/trainers", icon: FaDumbbell },

    { name: "Membership Plans", path: "/admin/membership", icon: FaClipboardList },
    // { name: "Payments", path: "/admin/payments", icon: FaCreditCard },

    { name: "Attendance", path: "/admin/attendance", icon: FaCalendarCheck },
    // { name: "Reports", path: "/admin/reports", icon: FaChartBar },

    { name: "Settings", path: "/admin/settings", icon: FaCog },
    { name: "Broadcast", path: "/admin/broadcast", icon: FaBullhorn },
  ],

  trainer: [
    { name: "Dashboard", path: "/trainer", icon: FaHouseUser },

    { name: "My Members", path: "/trainer/members", icon: FaUsers },
    { name: "Attendance", path: "/trainer/attendance", icon: FaCalendarCheck },

    { name: "Workout Plans", path: "/trainer/workouts", icon: FaDumbbell },
    { name: "Diet Plans", path: "/trainer/diets", icon: FaClipboardList },
    { name: "Progress Tracking", path: "/trainer/progress", icon: FaRunning },

    { name: "Broadcast", path: "/trainer/broadcast", icon: FaBullhorn },

    { name: "Settings", path: "/trainer/settings", icon: FaCog },
  ],

  user: [
    { name: "Dashboard", path: "/user", icon: FaHouseUser },

    { name: "My Plan", path: "/user/plan", icon: FaClipboardList },
    { name: "Workout Schedule", path: "/user/workout", icon: FaDumbbell },
    { name: "Diet Plan", path: "/user/diet", icon: FaClipboardList },

    { name: "Progress", path: "/user/progress", icon: FaRunning },
    { name: "Attendance", path: "/user/attendance", icon: FaCalendarCheck },

    // { name: "Payments", path: "/user/payments", icon: FaCreditCard },

    { name: "Profile", path: "/user/profile", icon: FaUser },
    { name: "Settings", path: "/user/settings", icon: FaCog },
  ],
};
