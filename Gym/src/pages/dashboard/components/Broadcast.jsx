import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FaPaperPlane } from 'react-icons/fa';
import api from '../../../services/api';
import DashboardLayout from '../layouts/DashboardLayout';
import './styl/Broadcast.css';

const Broadcast = ({ role = "admin" }) => {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [audience, setAudience] = useState("all");
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        
        if (!subject.trim() || !message.trim()) {
            toast.error("Subject and message are required.");
            return;
        }

        setLoading(true);
        try {
            const response = await api.post("send-ads/", { subject, message, audience });
            toast.success(response.data.message || "Broadcast sent successfully!");
            setSubject("");
            setMessage("");
        } catch (error) {
            console.error("Broadcast error:", error);
            toast.error(error.response?.data?.error || "Failed to send broadcast. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout role={role}>
            <div className="broadcast-page">
                <div className="broadcast-page__header">
                    <div>
                        <p className="eyebrow">{role === 'trainer' ? 'Trainer - Marketing' : 'Admin - Marketing'}</p>
                        <h1>Broadcast Emails</h1>
                        <p className="subtext">
                            {role === 'trainer' 
                                ? 'Send updates and announcements to your assigned members.' 
                                : 'Send promotional emails and announcements across the facility.'}
                        </p>
                    </div>
                </div>

                <div className="broadcast-card">
                    <form onSubmit={handleSend} className="broadcast-form">
                        <label className="field">
                            <span>Target Audience</span>
                            <select 
                                value={audience} 
                                onChange={(e) => setAudience(e.target.value)}
                                disabled={loading}
                            >
                                <option value="all">{role === 'trainer' ? 'All My Members' : 'All Active Members'}</option>
                                {role === 'admin' && <option value="my_members" disabled>My Members (Trainers Only)</option>}
                                <option value="gold">Gold Tier Members</option>
                                <option value="diamond">Diamond Tier Members</option>
                            </select>
                        </label>

                        <label className="field">
                            <span>Email Subject</span>
                            <input 
                                type="text" 
                                placeholder="e.g. Summer Promo! Get 20% off personal training" 
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={loading}
                            />
                        </label>
                        
                        <label className="field">
                            <span>Email Message</span>
                            <textarea 
                                rows={8}
                                placeholder="Write your email content here..." 
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                disabled={loading}
                            />
                        </label>

                        <div className="action-row">
                            <button type="submit" disabled={loading} className={loading ? "btn-disabled" : "btn-primary"}>
                                {loading ? 'Sending...' : (
                                    <>
                                        <FaPaperPlane style={{ marginRight: '8px' }} /> Send Broadcast
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Broadcast;
