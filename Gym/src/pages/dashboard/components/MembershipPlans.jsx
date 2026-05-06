import React, { useMemo, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import { useMembershipPlans } from "../../../context/MembershipContext";
import ConfirmPopup from "./ConfirmPopup";
import "../components/styl/DashboardOverview.css";
import "../components/styl/MembershipPlans.css";

const emptyForm = {
  name: "",
  price: "",
  features: "",
  popular: false,
  trainerRequired: false,
};

const MembershipPlans = () => {
  const { plans, savePlan, deletePlan } = useMembershipPlans();
  const [editingId, setEditingId] = useState(null);
  const [planPendingDelete, setPlanPendingDelete] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const summary = useMemo(
    () => ({
      total: plans.length,
      trainerPlans: plans.filter((plan) => plan.trainerRequired).length,
      featured: plans.find((plan) => plan.popular)?.name ?? "None",
    }),
    [plans]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
  };

  const handleEdit = (plan) => {
    setEditingId(plan.id);
    setForm({
      name: plan.name,
      price: plan.price,
      features: plan.features.join("\n"),
      popular: plan.popular,
      trainerRequired: plan.trainerRequired,
    });
    setErrors({});
  };

  const confirmDeletePlan = () => {
    if (!planPendingDelete) {
      return;
    }

    const plan = planPendingDelete;
    if (editingId === plan.id) {
      resetForm();
    }

    deletePlan(plan.id);
    toast.success("Plan deleted.");
    setPlanPendingDelete(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = {};
    const name = form.name.trim();
    const price = form.price.trim();
    const features = form.features
      .split("\n")
      .map((feature) => feature.trim())
      .filter(Boolean);

    if (!name) nextErrors.name = "Plan name is required.";
    if (!price) nextErrors.price = "Price label is required.";
    if (features.length === 0) nextErrors.features = "Add at least one feature.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    savePlan({
      id: editingId,
      name,
      price,
      features,
      popular: form.popular,
      trainerRequired: form.trainerRequired,
    });

    toast.success(editingId ? "Plan updated." : "Plan added.");
    resetForm();
  };

  return (
    <DashboardLayout role="admin">
      <div className="membership-page">
        <div className="dashboard-overview__hero">
          <div>
            <p className="eyebrow">Admin - Membership Plans</p>
            <h1>Membership Plans</h1>
            {/* <p className="subtext">
              Add or edit plans here. Changes update the home page and join form from the same shared source.
            </p> */}
          </div>
        </div>

        <div className="dashboard-overview__stats">
          <div className="overview-stat">
            <span>Total Plans</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="overview-stat">
            <span>Trainer Plans</span>
            <strong>{summary.trainerPlans}</strong>
          </div>
          <div className="overview-stat">
            <span>Featured Plan</span>
            <strong>{summary.featured}</strong>
          </div>
        </div>

        <div className="membership-grid">
          <form className="dashboard-panel membership-form" onSubmit={handleSubmit}>
            <div>
              <p className="eyebrow">{editingId ? "Edit Plan" : "Add Plan"}</p>
              <h2>{editingId ? "Update Membership Plan" : "Create Membership Plan"}</h2>
              <p className="subtext">
                Use one feature per line. Mark one plan as most popular if you want it highlighted on the home page.
              </p>
            </div>

            <label className="membership-field">
              <span>Plan Name</span>
              <input
                name="name"
                type="text"
                placeholder="Example: Platinum"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && <small>{errors.name}</small>}
            </label>

            <label className="membership-field">
              <span>Price Label</span>
              <input
                name="price"
                type="text"
                placeholder="Example: Rs 7999 / month"
                value={form.price}
                onChange={handleChange}
              />
              {errors.price && <small>{errors.price}</small>}
            </label>

            <label className="membership-field">
              <span>Features</span>
              <textarea
                name="features"
                rows="6"
                placeholder="One feature per line"
                value={form.features}
                onChange={handleChange}
              />
              {errors.features && <small>{errors.features}</small>}
            </label>

            <label className="membership-check">
              <input
                name="popular"
                type="checkbox"
                checked={form.popular}
                onChange={handleChange}
              />
              <span>Show as most popular on the home page</span>
            </label>

            <label className="membership-check">
              <input
                name="trainerRequired"
                type="checkbox"
                checked={form.trainerRequired}
                onChange={handleChange}
              />
              <span>Require trainer selection on registration</span>
            </label>

            <div className="membership-actions">
              <button type="submit" className="membership-primary">
                {editingId ? "Update Plan" : "Add Plan"}
              </button>
              {editingId && (
                <button type="button" className="membership-secondary" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="membership-list">
            {plans.map((plan) => (
              <article
                key={plan.id}
                className={`membership-card ${plan.popular ? "membership-card--featured" : ""}`}
              >
                <div className="membership-card__head">
                  <div>
                    <h3>{plan.name}</h3>
                    <p>{plan.price}</p>
                  </div>
                  <button
                    type="button"
                    className="membership-edit"
                    aria-label={`Edit ${plan.name}`}
                    title={`Edit ${plan.name}`}
                    onClick={() => handleEdit(plan)}
                  >
                    <FaEdit />
                  </button>
                </div>

                <div className="membership-badges">
                  {plan.popular && (
                    <span className="membership-badge membership-badge--featured">
                      Most Popular
                    </span>
                  )}
                  {plan.trainerRequired && (
                    <span className="membership-badge membership-badge--trainer">
                      Trainer Required
                    </span>
                  )}
                </div>

                <ul>
                  {plan.features.map((feature) => (
                    <li key={`${plan.id}-${feature}`}>{feature}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  className="membership-delete"
                  aria-label={`Delete ${plan.name}`}
                  title={`Delete ${plan.name}`}
                  onClick={() => setPlanPendingDelete(plan)}
                >
                  <FaTrash />
                </button>
              </article>
            ))}
          </div>
        </div>

        <ConfirmPopup
          open={Boolean(planPendingDelete)}
          title="Delete membership plan?"
          message={
            planPendingDelete
              ? `Remove ${planPendingDelete.name} from the available membership plans? This action cannot be undone.`
              : ""
          }
          confirmLabel="Delete plan"
          onConfirm={confirmDeletePlan}
          onCancel={() => setPlanPendingDelete(null)}
        />
      </div>
    </DashboardLayout>
  );
};

export default MembershipPlans;
