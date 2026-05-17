import React, { useMemo, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";
import DashboardLayout from "../layouts/DashboardLayout";
import ConfirmPopup from "./ConfirmPopup";
import "../components/styl/Members.css";
import "../components/styl/Trainers.css";
import "../components/styl/DashboardOverview.css";
import {
  getTrainerStatusClass,
  useTrainerDirectory,
} from "../../../context/TrainerContext";

const getTrainerInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Invalid image data"));
    };

    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });

const compressImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const maxDimension = 640;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Unable to process image"));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => reject(new Error("Unsupported image"));
    image.src = source;
  });

const Trainers = () => {
  const { trainers, saveTrainer, deleteTrainer } = useTrainerDirectory();
  const [editingId, setEditingId] = useState(null);
  const [trainerPendingDelete, setTrainerPendingDelete] = useState(null);
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    certificates: "",
    experience: "",
    email: "",
    password: "",
    image: "",
    imageName: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      setForm((current) => ({ ...current, image: "", imageName: "" }));
      return;
    }

    try {
      const source = await readFileAsDataUrl(file);
      const compressed = await compressImage(source);

      setForm((current) => ({
        ...current,
        image: compressed,
        imageName: file.name,
      }));
    } catch {
      setForm((current) => ({ ...current, image: "", imageName: "" }));
      event.target.value = "";
      toast.error("Unable to use this image. Try a smaller JPG or PNG file.");
    }
  };

  const resetForm = (formElement = null) => {
    setEditingId(null);
    setForm({
      name: "",
      specialization: "",
      certificates: "",
      experience: "",
      email: "",
      password: "",
      image: "",
      imageName: "",
    });

    if (formElement) {
      formElement.reset();
    }
  };

  const handleEdit = (trainer) => {
    setEditingId(trainer.id);
    setForm({
      name: trainer.name,
      specialization: trainer.specialization,
      certificates: trainer.certificates ?? "",
      experience: trainer.experience ?? "",
      email: trainer.email ?? "",
      password: trainer.password ?? "",
      image: trainer.image ?? "",
      imageName: trainer.image ? "Current image selected" : "",
    });
  };

  const confirmDeleteTrainer = () => {
    if (!trainerPendingDelete) {
      return;
    }

    const trainer = trainerPendingDelete;
    if (editingId === trainer.id) {
      resetForm();
    }

    deleteTrainer(trainer.id);
    setTrainerPendingDelete(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const specialization = form.specialization.trim();
    if (!name || !specialization) {
      toast.error("Name and Specialization are required");
      return;
    }

    const payload = {
      name,
      specialization,
      certificates: form.certificates.trim(),
      experience: form.experience.trim(),
    };

    if (editingId) {
      payload.id = editingId;
    } else {
      payload.email = form.email.trim();
      payload.password = form.password.trim();
      payload.image = form.image;
    }

    const loadingToast = toast.loading(editingId ? "Updating trainer..." : "Adding trainer...");

    try {
      const result = await saveTrainer(payload);
      if (result.ok) {
        toast.success(
          editingId ? "Trainer updated successfully!" : "Trainer added successfully!",
          { id: loadingToast }
        );
        resetForm(event.target);
      } else {
        toast.error(result.error || "Failed to save trainer", { id: loadingToast });
      }
    } catch (error) {
      toast.error("An unexpected error occurred", { id: loadingToast });
    }
  };

  const summary = useMemo(
    () => ({
      total: trainers.length,
      active: trainers.filter((trainer) => trainer.status === "Active").length,
      busy: trainers.filter((trainer) => trainer.status === "Busy").length,
      onLeave: trainers.filter((trainer) => trainer.status === "On Leave").length,
    }),
    [trainers]
  );

  return (
    <DashboardLayout role="admin">
      <div className="trainers-page">
        <div className="trainers-page__header">
          <div>
            <p className="eyebrow">Admin - Trainers</p>
            <h1>Trainers</h1>
            <p className="subtext">
              Monitor trainer status, manage member load, and oversee member assignments.
            </p>
          </div>
        </div>

        <div className="dashboard-overview__stats">
          <div className="overview-stat">
            <span>Total Trainers</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="overview-stat">
            <span>Active</span>
            <strong>{summary.active}</strong>
          </div>
          <div className="overview-stat">
            <span>Busy</span>
            <strong>{summary.busy}</strong>
          </div>
          <div className="overview-stat">
            <span>On Leave</span>
            <strong>{summary.onLeave}</strong>
          </div>
        </div>

        <form className="trainer-form" onSubmit={handleSubmit}>
          <input
            name="name"
            type="text"
            placeholder="Trainer name"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="specialization"
            type="text"
            placeholder="Specialization"
            value={form.specialization}
            onChange={handleChange}
          />
          <input
            name="certificates"
            type="text"
            placeholder="Certificate"
            value={form.certificates}
            onChange={handleChange}
          />
          <input
            name="experience"
            type="text"
            placeholder="Experience"
            value={form.experience}
            onChange={handleChange}
          />
          {!editingId && (
            <input
              name="email"
              type="email"
              placeholder="Login Email "
              className="trainer-credentials-field"
              value={form.email}
              onChange={handleChange}
            />
          )}
          {!editingId && (
            <input
              name="password"
              type="text"
              placeholder="Login Password "
              className="trainer-credentials-field"
              value={form.password}
              onChange={handleChange}
            />
          )}
          {!editingId && (
            <div className="trainer-file-field">
              <input
                id="trainer-image-upload"
                className="trainer-file-input"
                name="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              <label htmlFor="trainer-image-upload" className="trainer-file-button">
                Choose Image
              </label>
              <span className="trainer-file-name">
                {form.imageName || "No file selected"}
              </span>
            </div>
          )}
          <button type="submit">{editingId ? "Update Trainer" : "Add Trainer"}</button>
          {editingId && (
            <button
              type="button"
              className="trainer-form-cancel"
              onClick={(event) => resetForm(event.currentTarget.form)}
            >
              Cancel
            </button>
          )}
        </form>

        <div className="trainers-card">
          <div className="table-head">
            <span>Name</span>
            <span>Specialization</span>
            <span>Members</span>
            <span>Status</span>
          </div>
          <div className="table-body">
            {trainers.map((trainer) => (
              <div key={trainer.id} className="table-row">
                <div className="trainer-name-cell">
                  <span className="trainer-name-trigger" tabIndex={0}>
                    {trainer.name}
                  </span>

                  <div className="trainer-hover-card">
                    <div className="trainer-hover-card__media">
                      {trainer.image ? (
                        <img
                          src={trainer.image}
                          alt={trainer.name}
                          className="trainer-hover-card__image"
                        />
                      ) : (
                        <div className="trainer-hover-card__avatar">
                          {getTrainerInitials(trainer.name) || "TR"}
                        </div>
                      )}
                    </div>

                    <div className="trainer-hover-card__body">
                      <h3>{trainer.name}</h3>
                      <p className="trainer-hover-card__role">
                        {trainer.specialization}
                      </p>
                      <p>
                        <strong>Certificate:</strong>{" "}
                        {trainer.certificates || "Profile not added yet"}
                      </p>
                      <p>
                        <strong>Experience:</strong>{" "}
                        {trainer.experience || "Experience not added yet"}
                      </p>
                      <p>
                        {trainer.details || "Trainer profile details are not available yet."}
                      </p>
                    </div>
                  </div>
                </div>
                <span>{trainer.specialization}</span>
                <span>{trainer.members}</span>
                <div className="trainer-table-actions">
                  <span className={`pill ${getTrainerStatusClass(trainer.status)}`}>
                    {trainer.status}
                  </span>
                  <div className="trainer-action-icons">
                    <button
                      type="button"
                      className="trainer-edit"
                      aria-label={`Edit ${trainer.name}`}
                      title={`Edit ${trainer.name}`}
                      onClick={() => handleEdit(trainer)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      type="button"
                      className="trainer-delete"
                      aria-label={`Delete ${trainer.name}`}
                      title={`Delete ${trainer.name}`}
                      onClick={() => setTrainerPendingDelete(trainer)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ConfirmPopup
          open={Boolean(trainerPendingDelete)}
          title="Delete trainer?"
          message={
            trainerPendingDelete
              ? `Remove ${trainerPendingDelete.name} from the trainers? This action cannot be undone.`
              : ""
          }
          confirmLabel="Delete trainer"
          onConfirm={confirmDeleteTrainer}
          onCancel={() => setTrainerPendingDelete(null)}
        />
      </div>
    </DashboardLayout>
  );
};

export default Trainers;
