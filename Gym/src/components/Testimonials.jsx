import React, { useState, useEffect } from "react";
import "./style/Testimonials.css";

const testimonials = [
  { name: "Rahul Sharma", review: "Excellent gym environment and trainers.", rating: 5 },
  { name: "Ananya Nair", review: "Very supportive staff and great equipment.", rating: 4 },
  { name: "Arjun Menon", review: "Helped me achieve my fitness goals.", rating: 5 },
  { name: "Vishnu Kumar", review: "Clean gym with professional trainers.", rating: 4 },
  { name: "Sneha Thomas", review: "Great atmosphere for workouts.", rating: 5 },
  { name: "Adithya Raj", review: "Highly motivating trainers.", rating: 4 },
  { name: "Deepak Nair", review: "Good equipment and structured workouts.", rating: 5 },
  { name: "Meera Joseph", review: "Friendly trainers and good support.", rating: 4 },
  { name: "Akash Varma", review: "Best gym experience so far.", rating: 5 },
  { name: "Neha Pillai", review: "Amazing place for fitness transformation.", rating: 5 },
  { name: "Rohan Das", review: "Good workout environment.", rating: 4 },
  { name: "Priya Menon", review: "Great community and support.", rating: 5 },
  { name: "Kiran Babu", review: "Professional trainers and diet advice.", rating: 4 },
  { name: "Ashwin Raj", review: "Highly recommended gym.", rating: 5 },
  { name: "Divya Nair", review: "Very motivating trainers.", rating: 4 },
  { name: "Sanjay Kumar", review: "Modern equipment and great service.", rating: 5 },
  { name: "Anil Thomas", review: "Excellent workout programs.", rating: 4 },
  { name: "Nithin Das", review: "Friendly gym environment.", rating: 5 },
  { name: "Varsha Nair", review: "Supportive trainers.", rating: 4 },
  { name: "Ajay Menon", review: "One of the best gyms in the city.", rating: 5 },
  { name: "Kavitha Raj", review: "Good equipment and friendly trainers.", rating: 4 },
  { name: "Ravi Kumar", review: "Clean gym space and motivated trainers.", rating: 5 },
  { name: "Kavya Thomas", review: "Great atmosphere for fitness.", rating: 4 },
  { name: "Rajesh Das", review: "Highly professional trainers.", rating: 5 },
];

const Testimonials = () => {

  const [index, setIndex] = useState(0);
  const groupSize = 3;

  useEffect(() => {

    const interval = setInterval(() => {

      setIndex(prev => {
        const next = prev + groupSize;
        return next >= testimonials.length ? 0 : next;
      });

    }, 4000);

    return () => clearInterval(interval);

  }, []);

  const visibleTestimonials = testimonials.slice(index, index + groupSize);

  return (
    <section className="testimonials" id="testimonials">

      <h2 className="testimonial-title">What Our Members Say</h2>

      <div className="testimonial-container">

        {visibleTestimonials.map((item, i) => (

          <div className="testimonial-card" key={i}>

            <p className="testimonial-text  h-25">"{item.review}"</p>

            <div className="stars">
              {"★".repeat(item.rating)}
              {"☆".repeat(5 - item.rating)}
            </div>

            <h4 className="testimonial-name">{item.name}</h4>

          </div>

        ))}

      </div>

    </section>
  );
};

export default Testimonials;