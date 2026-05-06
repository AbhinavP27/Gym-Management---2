import React from 'react'

import Hero from '../components/Hero'
import About from '../components/About'
import Trainers from '../components/Trainers'
import Services from '../components/Services'
import Plans from '../components/Plans'
import Testimonials from '../components/Testimonials'
import Contacts from '../components/Contacts'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'


const Home = () => {
  return (
    <>
        <Navbar />
        <Hero />
        <About />
        <Trainers/>
        <Services/>
        <Plans/>
        <Testimonials/>
        <Contacts/>
        <Footer />

    </>
  )
}

export default Home