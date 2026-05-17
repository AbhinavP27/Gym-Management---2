import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useMembershipPlans } from "../context/MembershipContext";
import { useMembers } from "../context/MemberContext";
import { useTrainerDirectory } from "../context/TrainerContext";
import { usePlanRequests } from "../context/PlanRequestContext";
import "./styles/Login.css";

const Reg = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { plans } = useMembershipPlans();
    const { registerMember, isEmailTaken = () => false } = useMembers();
    const { trainers } = useTrainerDirectory();
    const { submitRegistrationApprovalRequests } = usePlanRequests();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        gender: "",
        plan: "",
        trainer: "",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const selectedPlan = plans.find((plan) => {
        const formPlan = String(form.plan).trim().toLowerCase();
        if (!formPlan) return false;
        return String(plan.id) === String(form.plan) ||
            String(plan.name).toLowerCase() === formPlan;
    });

    useEffect(() => {
        const incomingPlan = location.state?.plan;
        if (!incomingPlan) return;
        const incomingPlanConfig = plans.find(
            (plan) => String(plan.name).toLowerCase() === String(incomingPlan).toLowerCase()
        );

        setForm((prev) => {
            const nextPlanValue = incomingPlanConfig?.id ?? incomingPlan;
            const next = { ...prev, plan: nextPlanValue };
            next.trainer = "";
            return next;
        });

        setErrors((prev) => {
            const { plan, trainer, ...rest } = prev;
            return rest;
        });
    }, [location.state?.plan, plans]);

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^[0-9]{10}$/;
    const isReservedEmail = (email) => {
        const normalizedEmail = email.trim().toLowerCase();

        if (normalizedEmail === "admin@urbangrind.com") {
            return true;
        }

        return trainers.some(
            (trainer) => trainer.email?.trim().toLowerCase() === normalizedEmail
        );
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name]: value };
            if (name === "plan") {
                next.trainer = "";
            }
            return next;
        });
    };

    const validate = () => {
        const newErrors = {};

        if (!form.fullName.trim()) newErrors.fullName = "Name is required";

        if (!form.email.trim()) newErrors.email = "Email is required";
        else if (!emailPattern.test(form.email)) newErrors.email = "Enter a valid email";
        else if (isEmailTaken(form.email) || isReservedEmail(form.email)) {
            newErrors.email = "Email already exists. Use a unique email.";
        }

        if (!form.phone.trim()) newErrors.phone = "Phone is required";
        else if (!phonePattern.test(form.phone)) newErrors.phone = "Enter exactly 10 digits";

        if (!form.password.trim()) newErrors.password = "Password is required";
        else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";

        if (!form.confirmPassword.trim()) newErrors.confirmPassword = "Confirm your password";
        else if (form.confirmPassword !== form.password) newErrors.confirmPassword = "Passwords do not match";

        if (!form.gender) newErrors.gender = "Select a gender option";

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length) return;
        const result = await registerMember({
            name: form.fullName,
            email: form.email,
            password: form.password,
            phone: form.phone,
            gender: form.gender,
            plan: null,
            trainerId: null,
            trainer: null,
        });

        if (!result.ok) {
            toast.error(result.error);
            return;
        }

        const createdMember = result.member || {};

        const approvalResult = submitRegistrationApprovalRequests({
            member: {
                ...createdMember,
                name: createdMember.name || form.fullName,
                email: createdMember.email || form.email,
            },
        });

        if (!approvalResult.ok) {
            console.error("Failed to create registration approval requests", approvalResult.error);
        }

        navigate("/login");
        if (approvalResult.ok) {
            toast.success(
                "Registration successful! New client approval was sent to admin dashboard."
            );
        } else {
            toast.success("Registration successful! Use your email to log in.");
        }
        setForm({
            fullName: "",
            email: "",
            phone: "",
            password: "",
            confirmPassword: "",
            gender: "",
            plan: "",
            trainer: "",
        });
        setErrors({});
    };

    return (
        <div className="login-overlay register-overlay" id="join">
            <div className="login-card register-card">
                <button
                    type="button"
                    className="close-button"
                    aria-label="Close registration"
                    onClick={() => navigate("/")}
                />

                <p className="eyebrow">Membership</p>
                <h2>Join Urban Grind</h2>
                <p className="subtext">Lean into the night - fill in the essentials and pick your perfect fit.</p>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-grid">
                        <label className="field">
                            <span>Name</span>
                            <input
                                type="text"
                                name="fullName"
                                placeholder="Full Name"
                                value={form.fullName}
                                onChange={handleChange}
                            />
                            {errors.fullName && <p className="error-text">{errors.fullName}</p>}
                        </label>

                        <label className="field">
                            <span>Email</span>
                            <input
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                            />
                            {errors.email && <p className="error-text">{errors.email}</p>}
                        </label>

                        <label className="field">
                            <span>Phone</span>
                            <input
                                type="text"
                                name="phone"
                                placeholder="10 digits"
                                value={form.phone}
                                onChange={handleChange}
                            />
                            {errors.phone && <p className="error-text">{errors.phone}</p>}
                        </label>

                        <label className="field">
                            <span>Password</span>
                            <div className="password-row">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Create password"
                                    value={form.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className={`icon-toggle inside ${showPassword ? "active" : ""}`}
                                    aria-label="Toggle password visibility"
                                    onClick={() => setShowPassword((v) => !v)}
                                />
                            </div>
                            {errors.password && <p className="error-text">{errors.password}</p>}
                        </label>

                        <label className="field">
                            <span>Confirm Password</span>
                            <div className="password-row">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    placeholder="Re-enter password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    className={`icon-toggle inside ${showPassword ? "active" : ""}`}
                                    aria-label="Toggle password visibility"
                                    onClick={() => setShowPassword((v) => !v)}
                                />
                            </div>
                            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
                        </label>

                        <label className="field">
                            <span>Gender</span>
                            <select name="gender" value={form.gender} onChange={handleChange} className="select-visible">
                                <option value="">Choose an option</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                            </select>
                            {errors.gender && <p className="error-text">{errors.gender}</p>}
                        </label>

                        <label className="field disabled-field">
                            <span>Membership</span>
                            <select name="plan" value="" disabled className="select-visible">
                                <option value="">Select in dashboard after admin approval</option>
                            </select>
                        </label>

                        <label className="field disabled-field">
                            <span>Trainer</span>
                            <select name="trainer" value="" disabled className="select-visible">
                                <option value="">Select in dashboard after admin approval</option>
                            </select>
                        </label>
                    </div>

                    <div className="action-row">
                        <button type="submit">Create Account</button>
                        <p className="link-cta mt-3">Already a gym buddy?</p>
                        <Link to="/login" className="link-ctan">
                            Login now
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Reg;
