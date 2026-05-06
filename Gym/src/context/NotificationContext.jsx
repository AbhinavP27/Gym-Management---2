import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useMembers } from "./MemberContext";
import { usePlanRequests } from "./PlanRequestContext";
import { useWorkoutPlans } from "./WorkoutPlanContext";
import { useDietPlans } from "./DietPlanContext";

const STORAGE_KEY_READ = "urbangrind-notifications-read";
const STORAGE_KEY_DISMISSED = "urbangrind-notifications-dismissed";
const STORAGE_KEY_BROADCASTS = "urbangrind-notifications-broadcasts";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { members } = useMembers();
  const { planRequests } = usePlanRequests();
  const { plansByMember: workoutPlans } = useWorkoutPlans();
  const { plansByMember: dietPlans } = useDietPlans();

  const [readState, setReadState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_READ);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const [dismissedState, setDismissedState] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_DISMISSED);
      return stored ? JSON.parse(stored) : {};
    } catch { return {}; }
  });

  const [broadcasts, setBroadcasts] = useState(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY_BROADCASTS);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY_READ, JSON.stringify(readState)); } catch(e) {}
  }, [readState]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(dismissedState)); } catch(e) {}
  }, [dismissedState]);

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY_BROADCASTS, JSON.stringify(broadcasts)); } catch(e) {}
  }, [broadcasts]);

  const sendBroadcast = (title, description, targetAudience) => {
    if (!currentUser) return;
    const newBroadcast = {
      id: `broadcast-${Date.now()}`,
      title,
      description,
      targetAudience, // 'all', 'my-roster', 'trainers'
      senderId: currentUser.id,
      senderRole: currentUser.role,
      date: new Date().toISOString(),
      type: "info",
      isCustom: true
    };
    setBroadcasts(prev => [newBroadcast, ...prev]);
  };

  const rawNotifications = useMemo(() => {
    if (!currentUser) return [];
    
    const notifs = [];
    const todayStr = new Date().toISOString();
    const todayTime = new Date(todayStr).getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

    // 1. Process Members loops
    members.forEach((member) => {
      // Expiring
      if (member.expiry) {
        const expiryTime = new Date(member.expiry).getTime();
        if (expiryTime >= todayTime && expiryTime <= todayTime + sevenDaysMs) {
          const daysLeft = Math.ceil((expiryTime - todayTime) / (1000 * 60 * 60 * 24));
          if (currentUser.role === "admin") {
            notifs.push({
              id: `exp-${member.id}-${member.expiry}-admin`,
              title: "Membership Expiring",
              description: `${member.name}'s ${member.plan} plan is expiring in ${daysLeft} days.`,
              date: new Date(member.expiry).toISOString(),
              type: "warning",
            });
          }
          if (currentUser.role === "user" && currentUser.id === member.id) {
            notifs.push({
              id: `exp-${member.id}-${member.expiry}-user`,
              title: "Renewal Reminder",
              description: `Your ${member.plan} plan expires in ${daysLeft} days. Don't forget to renew!`,
              date: new Date(member.expiry).toISOString(),
              type: "warning",
            });
          }
        }
      }

      // New Signups
      if (currentUser.role === "admin" && member.joinedAt) {
        const joinedTime = new Date(member.joinedAt).getTime();
        if (todayTime - joinedTime <= threeDaysMs && todayTime >= joinedTime) {
          notifs.push({
            id: `new-${member.id}-${member.joinedAt}`,
            title: "New Member Signup",
            description: `${member.name} just joined with a ${member.plan} plan!`,
            date: new Date(member.joinedAt).toISOString(),
            type: "success",
          });
        }
      }

      // Trainer assignments
      if (currentUser.role === "trainer" && member.trainerId === currentUser.id && member.joinedAt) {
        const joinedTime = new Date(member.joinedAt).getTime();
        if (todayTime - joinedTime <= fourteenDaysMs && todayTime >= joinedTime) {
          notifs.push({
            id: `assigned-${member.id}-${member.joinedAt}`,
            title: "New Client Assigned",
            description: `${member.name} has been assigned to your roster. Check their goals!`,
            date: new Date(member.joinedAt).toISOString(),
            type: "info",
          });
        }
      }
    });

    // 2. Process Plan Requests
    planRequests.forEach(req => {
      const reqTime = new Date(req.updatedAt).getTime();
      const isRecent = (todayTime - reqTime) <= fourteenDaysMs; // Track for 14 days
      if (!isRecent) return;

      const typeLabel = req.requestType === "trainer" ? "Trainer Change" : "Membership Plan Change";

      if (req.status === "pending") {
        if (currentUser.role === "admin") {
          notifs.push({
             id: `req-pend-${req.id}-admin`,
             title: `Pending ${typeLabel}`,
             description: `${req.memberName} has requested a ${typeLabel.toLowerCase()}.`,
             date: req.updatedAt,
             type: "warning"
          });
        }
        if (currentUser.role === "trainer" && (req.trainerId === currentUser.id || req.requestedTrainerId === currentUser.id)) {
          notifs.push({
             id: `req-pend-${req.id}-trainer`,
             title: `Pending ${typeLabel}`,
             description: `${req.memberName} has a pending ${typeLabel.toLowerCase()} request involving you.`,
             date: req.updatedAt,
             type: "warning"
          });
        }
      } else if (req.status === "approved" || req.status === "rejected") {
        if (currentUser.role === "user" && currentUser.id === req.memberId) {
          const verb = req.status === "approved" ? "approved successfully" : "rejected";
          notifs.push({
            id: `req-resolve-${req.id}-user`,
            title: `${typeLabel} ${req.status === "approved" ? 'Approved' : 'Declined'}`,
            description: `Your request for a ${typeLabel.toLowerCase()} has been ${verb}.`,
            date: req.resolvedAt || req.updatedAt,
            type: req.status === "approved" ? "success" : "warning"
          });
        }
      }
    });

    // 3. Process Workout/Diet updates
    if (currentUser.role === "user") {
      const workout = workoutPlans[currentUser.id];
      if (workout?.updatedAt) {
        const wTime = new Date(workout.updatedAt).getTime();
        if ((todayTime - wTime) <= threeDaysMs && todayTime >= wTime) {
          notifs.push({
            id: `workout-update-${workout.updatedAt}`,
            title: "Workout Plan Updated",
            description: "Your trainer has updated your workout routine.",
            date: workout.updatedAt,
            type: "info"
          });
        }
      }

      const diet = dietPlans[currentUser.id];
      if (diet?.updatedAt) {
        const dTime = new Date(diet.updatedAt).getTime();
        if ((todayTime - dTime) <= threeDaysMs && todayTime >= dTime) {
          notifs.push({
            id: `diet-update-${diet.updatedAt}`,
            title: "Diet Plan Updated",
            description: "Your trainer has updated your diet plan.",
            date: diet.updatedAt,
            type: "info"
          });
        }
      }
    }

    // 4. Custom Broadcasts mapped to user context
    broadcasts.forEach(b => {
      // Admins see all their own out-going ones
      if (currentUser.id === b.senderId && currentUser.role === b.senderRole) {
        notifs.push({ ...b, title: `(Sent by you) ${b.title}` });
        return;
      }
      
      let shouldReceive = false;
      if (b.targetAudience === 'all') {
        shouldReceive = true;
      } else if (b.targetAudience === 'my-roster' && currentUser.role === 'user') {
        const userRec = members.find(m => m.id === currentUser.id);
        if (userRec && userRec.trainerId === b.senderId) {
          shouldReceive = true;
        }
      }

      if (shouldReceive) {
        notifs.push(b);
      }
    });

    return notifs;
  }, [currentUser, members, planRequests, workoutPlans, dietPlans, broadcasts]);

  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const userId = currentUser.id;
    const userDismissed = dismissedState[userId] || [];
    const userRead = readState[userId] || [];

    const active = rawNotifications.filter(n => !userDismissed.includes(n.id));
    
    // Sort descending by date
    return active.map(n => ({
      ...n,
      isRead: userRead.includes(n.id)
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [rawNotifications, currentUser, readState, dismissedState]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id) => {
    if (!currentUser) return;
    setReadState(prev => {
      const userRead = prev[currentUser.id] || [];
      if (userRead.includes(id)) return prev;
      return { ...prev, [currentUser.id]: [...userRead, id] };
    });
  };

  const markAllAsRead = () => {
    if (!currentUser) return;
    const allIds = notifications.map(n => n.id);
    setReadState(prev => ({
      ...prev,
      [currentUser.id]: [...new Set([...(prev[currentUser.id] || []), ...allIds])]
    }));
  };

  const clearAll = () => {
    if (!currentUser) return;
    const allIds = notifications.map(n => n.id);
    setDismissedState(prev => ({
      ...prev,
      [currentUser.id]: [...new Set([...(prev[currentUser.id] || []), ...allIds])]
    }));
  };

  const value = {
    notifications,
    unreadCount,
    sendBroadcast,
    markAsRead,
    markAllAsRead,
    clearAll
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};
