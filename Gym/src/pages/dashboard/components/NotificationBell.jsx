import React, { useState, useRef, useEffect } from "react";
import { FiBell, FiCheck, FiTrash2, FiSend, FiX, FiPlus } from "react-icons/fi";
import { useNotifications } from "../../../context/NotificationContext";
import { useAuth } from "../../../context/AuthContext";
import "./styl/NotificationBell.css";

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, sendBroadcast } = useNotifications();
  const { currentUser } = useAuth();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [bTitle, setBTitle] = useState("");
  const [bDesc, setBDesc] = useState("");
  const [bTarget, setBTarget] = useState("all");
  
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowBroadcastForm(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
    setShowBroadcastForm(false);
  };

  const submitBroadcast = (e) => {
    e.preventDefault();
    if (!bTitle.trim() || !bDesc.trim()) return;
    
    sendBroadcast(bTitle, bDesc, bTarget);
    setBTitle("");
    setBDesc("");
    setBTarget("all");
    setShowBroadcastForm(false);
  };

  const getIconColor = (type) => {
    switch (type) {
      case "warning": return "#f59e0b";
      case "success": return "#10b981";
      case "info": return "#38bdf8";
      default: return "#94a3b8";
    }
  };

  return (
    <div className="notification-wrapper" ref={dropdownRef}>
      <button 
        className="notification-bell-btn" 
        onClick={handleToggle}
        aria-label="Toggle notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown animate-fade-in-down">
          {showBroadcastForm ? (
            <div className="broadcast-form-container">
              <div className="notification-header border-b">
                <h3>New Broadcast</h3>
                <button className="text-btn" onClick={() => setShowBroadcastForm(false)}>
                  <FiX size={18} />
                </button>
              </div>
              <form className="broadcast-form" onSubmit={submitBroadcast}>
                <input 
                   type="text" 
                   placeholder="Message Title (e.g. Special Offer!)" 
                   value={bTitle}
                   onChange={e => setBTitle(e.target.value)}
                   required 
                />
                <textarea 
                   placeholder="Write your announcement..." 
                   rows="3" 
                   value={bDesc}
                   onChange={e => setBDesc(e.target.value)}
                   required
                />
                <select value={bTarget} onChange={e => setBTarget(e.target.value)}>
                   <option value="all">Every Single User</option>
                   <option value="my-roster">My Assigned Members Only</option>
                </select>
                <button type="submit" className="broadcast-submit-btn">
                  <FiSend size={14} /> Send Broadcast
                </button>
              </form>
            </div>
          ) : (
            <>
              <div className="notification-header">
                <h3>Notifications</h3>
                <div className="notification-actions">
                  {(currentUser?.role === 'admin' || currentUser?.role === 'trainer') && (
                    <button className="text-btn plus-btn" onClick={() => setShowBroadcastForm(true)} title="Send Broadcast">
                      <FiPlus size={16} /> Broadcast
                    </button>
                  )}
                  <button className="text-btn" onClick={markAllAsRead} title="Mark all as read">
                    <FiCheck size={16} />
                  </button>
                  <button className="text-btn" onClick={clearAll} title="Clear all">
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="notification-body">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <p>You're all caught up!</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${notif.isRead ? "read" : "unread"}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="notif-indicator" style={{ backgroundColor: getIconColor(notif.type) }} />
                      <div className="notif-content">
                        <h4>{notif.title}</h4>
                        <p>{notif.description}</p>
                        <span className="notif-time">{new Date(notif.date).toLocaleDateString()}</span>
                      </div>
                      {!notif.isRead && <div className="unread-dot" />}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
