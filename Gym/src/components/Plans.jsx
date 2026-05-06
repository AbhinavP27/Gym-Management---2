import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useMembershipPlans } from '../context/MembershipContext'
import './style/Plans.css'

const Plans = () => {
  const navigate = useNavigate()
  const { plans } = useMembershipPlans()

  return (
    <section className="plans-section h-4" id='plans'>
      <h1 className="plans-title text-center mb-7 mt-4">
        Choose Your Plan
      </h1>

      <div className="plan-container">
        {plans.map((plan) => (
          <div
            className={`plan-card ${plan.popular ? 'gold' : ''}`}
            key={plan.id}
          >
            {plan.popular && (
              <span className="popular">Most Popular</span>
            )}

            <h2 className="plan-name">{plan.name}</h2>

            <p className="plan-price">{plan.price}</p>

            <ul className="plan-features">
              {plan.features.map((feature) => (
                <li key={`${plan.id}-${feature}`}>{feature}</li>
              ))}
            </ul>

            <button
              className="plan-btn"
              onClick={() => navigate('/join', { state: { plan: plan.name } })}
            >
              Sign Up Now
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Plans
