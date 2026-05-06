import React from "react";
import { useTrainerDirectory } from "../context/TrainerContext";
import "./style/Trainers.css";

const getTrainerInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const Trainers = () => {
  const { trainers } = useTrainerDirectory();

  return (
    <section className="trainers" id="trainers">
      <h1 className="trainer-title">Meet Our Trainers</h1>

      <div className="trainer-container">
        {trainers.map((trainer) => (
          <div className="trainer-card" key={trainer.id}>
            {trainer.image ? (
              <img src={trainer.image} alt={trainer.name} />
            ) : (
              <div className="trainer-card-avatar">
                {getTrainerInitials(trainer.name) || "TR"}
              </div>
            )}

            <h2>{trainer.name}</h2>
            <p>{trainer.specialization}</p>

            <div className="trainer-overlay">
              <h3>{trainer.name}</h3>

              <p><strong>{trainer.specialization}</strong></p>

              <p><b>Certificate:</b> {trainer.certificates || "Profile not added yet"}</p>

              <p><b>Experience:</b> {trainer.experience || "Experience not added yet"}</p>

              <p>{trainer.details || "Trainer profile details are not available yet."}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Trainers;
