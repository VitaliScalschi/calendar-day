import React from 'react'
import './Main.css'

const MAIN_TITLE = 'PROGRAMUL CALENDARISTIC'
const MAIN_SUBTITLE = 'pentru realizarea acțiunilor de organizare și desfășurare a alegerilor locale noi și a referendumului local din 17 mai 2026'

function Main() {

  return (
    <section className="position-relative w-100 d-flex align-items-center justify-content-center mb-4">
      <div className="bg-img w-100 h-100 d-flex align-items-center justify-content-center">
        <div className="container">
          <div className="text-center p-3 d-flex align-items-center justify-content-center flex-column gap-3">
            <h1 className="title text-bg-white">{MAIN_TITLE}</h1>
            <p className="subtitle text-bg-white w-50">{MAIN_SUBTITLE}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Main