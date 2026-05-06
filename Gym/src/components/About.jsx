import React from 'react'
import './style/About.css'
import atmos from '../assets/gymA.png'

const About = () => {
  return (
    <section className='about' id='about'>
      <img src={atmos} alt="" className='atmos' />
      <div className='box'>
        <h1>Urban Grind Fitness</h1>
        <p>
          Urban Grind Fitness is dedicated to helping individuals achieve their fitness goals through professional training, modern equipment, and a supportive community. Our mission is to promote strength, health, and confidence by creating an environment where everyone - from beginners to athletes - can grow and succeed.
        
          Expect guided strength and conditioning programs, high-energy group classes, and personal coaching tailored to your schedule. We pair evidence-based training with nutrition tips, recovery support, and flexible membership options so you always know the next step toward your goals.
        </p>
      </div>
    </section>
  )
}

export default About
