import React from "react";
import "./style/Services.css";
import { FaDumbbell, FaHeartbeat, FaUsers, FaAppleAlt, FaFireAlt, FaSpa, FaLeaf, FaRunning } from "react-icons/fa";

const services = [
  {
    icon: <FaDumbbell />,
    name: "Personal Training",
    about: "One-to-one sessions with certified trainers to achieve specific fitness goals faster."
  },
  {
    icon: <FaRunning />,
    name: "Strength & Weight Training",
    about: "Programs focused on muscle building, strength development, and endurance."
  },
  {
    icon: <FaHeartbeat />,
    name: "Cardio Training",
    about: "High-intensity workouts designed to improve heart health and burn calories."
  },
  {
    icon: <FaUsers />,
    name: "Group Fitness Classes",
    about: "Motivating classes like HIIT, Zumba, CrossFit, and functional training."
  },
  {
    icon: <FaAppleAlt />,
    name: "Nutrition Guidance",
    about: "Customized diet plans and nutrition advice for better fitness results."
  },
  {
    icon: <FaFireAlt />,
    name: "Body Transformation Programs",
    about: "Complete fitness plans combining workouts, nutrition, and progress tracking."
  },
  {
    icon: <FaLeaf />,
    name: "Yoga & Flexibility Training",
    about: "Improve flexibility, posture, and mental wellness through guided yoga sessions."
  },
  {
    icon: <FaSpa />,
    name: "Recovery & Mobility",
    about: "Stretching, mobility drills, and recovery sessions to prevent injuries."
  }
];

const Services = () => {
  return (
    <section className="services" id="services">

      <h1 className="service-title">Our Services</h1>

      <div className="service-container">

        {services.map((service, index) => (
          <div className="service-card" key={index}>

            <div className="service-icon">
              {service.icon}
            </div>

            <h2>{service.name}</h2>
            <p>{service.about}</p>

          </div>
        ))}

      </div>

    </section>
  );
};

export default Services;