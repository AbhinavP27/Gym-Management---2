import React from "react";
import Carousel from "react-bootstrap/esm/Carousel";

import hero1 from "../assets/gym3.png";
import hero2 from "../assets/gym9.png";
import hero3 from "../assets/gym5.png";

import "./style/Hero.css";

const Hero = () => {
  return (
    
    <Carousel fade id="hero">

      <Carousel.Item>
        <div className="hero" >
          <img className="hero-image" src={hero1} alt="Workout" />

          <div className="hero-text">
            <h1>Urban Grind Fitness</h1>
            <p>
              Helping you stay fit by tracking workouts, monitoring progress,
              and connecting with expert trainers.
            </p>

            <div className="hero-buttons">
              <a href="#plans"><button className="btn-secondary">Join Now</button></a>
              <a href="#plans"><button className="btn-secondary">View Plans</button></a>
            </div>
          </div>
        </div>
      </Carousel.Item>

      <Carousel.Item>
        <div className="hero">
          <img className="hero-image" src={hero2} alt="Training" />

          <div className="hero-text">
            <h1>Train With Experts</h1>
            <p>
              Get personalized workouts and guidance from professional trainers.
            </p>

            <div className="hero-buttons">
              <a href="#plans"><button className="btn-secondary">Start Training</button></a>
              <a href="#trainers"><button className="btn-secondary" >Meet Trainers</button></a>
            </div>
          </div>
        </div>
      </Carousel.Item>

      <Carousel.Item>
        <div className="hero">
          <img className="hero-image" src={hero3} alt="Diet" />

          <div className="hero-text">
            <h1>Transform Your Body</h1>
            <p>
              Achieve your fitness goals with proper workouts and nutrition plans.
            </p>

            <div className="hero-buttons">
              <a href="#plans"><button className="btn-secondary">Join Now</button></a>
              <a href="#services"><button className="btn-secondary">View Programs</button></a>
            </div>
          </div>
        </div>
        
      </Carousel.Item>

    </Carousel>
  );
};

export default Hero;
