import { useState, useEffect } from 'react'
import './ScrollToTop.css'

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [extraBottomOffset, setExtraBottomOffset] = useState(0)
  const [isAboveFooter, setIsAboveFooter] = useState(false)

  useEffect(() => {
    const updateButtonState = () => {
      setIsVisible(window.pageYOffset > 800)

      const footer = document.querySelector('.footer-app') as HTMLElement | null
      if (!footer) {
        setExtraBottomOffset(0)
        return
      }

      const footerRect = footer.getBoundingClientRect()
      const overlapWithViewportBottom = window.innerHeight - footerRect.top
      const shouldLift = overlapWithViewportBottom > 0
      setExtraBottomOffset(shouldLift ? overlapWithViewportBottom : 0)
      setIsAboveFooter(shouldLift)
    }

    updateButtonState()
    window.addEventListener('scroll', updateButtonState)
    window.addEventListener('resize', updateButtonState)

    return () => {
      window.removeEventListener('scroll', updateButtonState)
      window.removeEventListener('resize', updateButtonState)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <>
      {isVisible && (
        <button
          type="button"
          className={`scroll-to-top-btn ${isAboveFooter ? 'is-above-footer' : ''}`}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          style={{
            bottom: window.innerWidth <= 768
              ? `${24 + extraBottomOffset}px`
              : `${64 + extraBottomOffset}px`,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </>
  )
}

export default ScrollToTop
