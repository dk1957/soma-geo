"use client"

import { useEffect, useState } from "react"
import { ORG_CONTACT } from '@/lib/constants/contact'
import { DemoRequestForm } from '@/components/marketing/demo-request-form'
import { presentationStatistics, Statistic } from '@/lib/llms';

export default function ClientPresentation() {
  const [mounted, setMounted] = useState(false)
  const [isDemoOpen, setIsDemoOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Helper function to get a statistic by ID
  const getStat = (id: number): Statistic | undefined => {
    return presentationStatistics.find((stat: Statistic) => stat.id === id);
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`)
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        // Next slide
        setCurrentSlide(prev => Math.min(prev + 1, 15)) // 15 is the last slide (0-indexed)
      } else if (e.key === 'ArrowLeft') {
        // Previous slide
        setCurrentSlide(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'f') {
        // Toggle fullscreen with 'f' key
        toggleFullscreen()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    // Update fullscreen state when exiting fullscreen via Escape key
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])
  
  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // Reset
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    if (isLeftSwipe) {
      // Next slide (swipe left)
      setCurrentSlide(prev => Math.min(prev + 1, 15))
    }
    
    if (isRightSwipe) {
      // Previous slide (swipe right)
      setCurrentSlide(prev => Math.max(prev - 1, 0))
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Update currentSlide based on scroll position
  useEffect(() => {
    if (!mounted) return
    
    let scrollTimeout: NodeJS.Timeout
    
    const handleScroll = () => {
      // Clear previous timeout to debounce
      clearTimeout(scrollTimeout)
      
      // Set new timeout to delay execution
      scrollTimeout = setTimeout(() => {
        const slides = document.querySelectorAll('.slide')
        const viewportHeight = window.innerHeight
        let currentVisible = 0
        
        slides.forEach((slide, index) => {
          const rect = slide.getBoundingClientRect()
          // If slide is mostly visible in viewport
          if (rect.top < viewportHeight / 2 && rect.bottom > viewportHeight / 2) {
            currentVisible = index
          }
        })
        
        if (currentSlide !== currentVisible) {
          setCurrentSlide(currentVisible)
        }
      }, 100) // 100ms debounce
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [mounted, currentSlide])

  // Scroll to current slide when it changes
  useEffect(() => {
    if (mounted) {
      const slides = document.querySelectorAll('.slide')
      if (slides[currentSlide]) {
        // Temporarily disable scroll
        document.body.style.overflow = 'hidden'
        
        // Smooth scroll to the target slide
        slides[currentSlide].scrollIntoView({ behavior: 'smooth' })
        
        // Re-enable scrolling after animation completes
        const timeout = setTimeout(() => {
          document.body.style.overflow = ''
        }, 700) // Duration slightly longer than the scroll animation
        
        return () => clearTimeout(timeout)
      }
    }
  }, [currentSlide, mounted])

  if (!mounted) {
    return null
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Urbanist:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap');

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Urbanist', -apple-system, 'Helvetica Neue', Arial, sans-serif;
            background: #000;
            color: #fff;
            overflow-x: hidden;
            scroll-behavior: smooth;
            line-height: 1.6;
            -webkit-text-size-adjust: 100%;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          .stat-citation {
            color: inherit;
            opacity: 0.8;
            font-size: 0.8rem;
            margin-left: 0.2rem;
            text-decoration: none;
            font-weight: bold;
            transition: opacity 0.2s ease;
            cursor: pointer;
            vertical-align: super;
          }
          
          .stat-citation:hover {
            opacity: 1;
            text-decoration: underline;
          }

          .slide {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 60px 40px;
            position: relative;
            background: #000;
            color: #fff;
          }

          .slide:nth-child(even) {
            background: #fff;
            color: #000;
          }

          .content {
            max-width: 1000px;
            width: 100%;
            text-align: center;
          }

          h1 {
            font-family: 'Playfair Display', serif;
            font-size: clamp(3.5rem, 8vw, 7rem);
            font-weight: 800;
            line-height: 0.95;
            margin-bottom: 60px;
            letter-spacing: -0.02em;
          }

          h2 {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2.5rem, 6vw, 5rem);
            font-weight: 700;
            line-height: 1.1;
            margin-bottom: 40px;
            letter-spacing: -0.01em;
          }

          .huge-text {
            font-family: 'Playfair Display', serif;
            font-size: clamp(6rem, 12vw, 12rem);
            font-weight: 900;
            line-height: 0.85;
            letter-spacing: -0.03em;
            margin: 40px 0;
          }

          .subtitle {
            font-family: 'Urbanist', sans-serif;
            font-size: clamp(1.3rem, 3vw, 2rem);
            font-weight: 400;
            line-height: 1.5;
            opacity: 0.85;
            margin-bottom: 50px;
          }

          .story-text {
            font-family: 'Urbanist', sans-serif;
            font-size: clamp(1.6rem, 3.5vw, 2.8rem);
            font-weight: 500;
            line-height: 1.4;
            margin: 50px 0;
          }

          .emphasis {
            font-family: 'Urbanist', sans-serif;
            font-weight: 800;
            border-bottom: 3px solid currentColor;
            padding-bottom: 2px;
            font-style: italic;
          }

          .stat {
            font-family: 'Playfair Display', serif;
            font-size: clamp(5rem, 12vw, 10rem);
            font-weight: 900;
            margin: 50px 0 30px;
            letter-spacing: -0.02em;
          }

          .stat-label {
            font-family: 'Urbanist', sans-serif;
            font-size: clamp(1.1rem, 2.2vw, 1.5rem);
            font-weight: 600;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 0.15em;
            margin-bottom: 30px;
          }

          .question {
            font-family: 'Playfair Display', serif;
            font-size: clamp(2.2rem, 5vw, 4rem);
            font-weight: 400;
            margin: 50px 0;
            line-height: 1.2;
          }

          .answer {
            font-family: 'Urbanist', sans-serif;
            font-size: clamp(1.3rem, 2.5vw, 1.8rem);
            font-weight: 400;
            margin: 30px 0;
            opacity: 0.85;
          }

          .comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 80px;
            margin: 80px 0;
            text-align: left;
            min-height: 320px;
          }

          .comparison-item {
            display: flex;
            flex-direction: column;
          }

          .comparison-item h3 {
            font-family: 'Playfair Display', serif;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 30px;
            text-align: center;
          }

          .comparison-item ul {
            list-style: none;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .comparison-item li {
            font-family: 'Urbanist', sans-serif;
            font-size: 1.3rem;
            font-weight: 500;
            padding: 15px 0;
            border-bottom: 1px solid rgba(255,255,255,0.15);
            display: flex;
            align-items: center;
            min-height: 44px;
          }

          .slide:nth-child(even) .comparison-item li {
            border-bottom: 1px solid rgba(0,0,0,0.15);
          }

          .cta-button {
            font-family: 'Urbanist', sans-serif;
            display: inline-block;
            padding: 30px 70px;
            font-size: 1.4rem;
            font-weight: 700;
            text-decoration: none;
            border: 3px solid #000;
            color: #000;
            background: #fff;
            margin: 60px 0;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            transition: all 0.4s ease;
            cursor: pointer;
            border-radius: 8px;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
            user-select: none;
          }

          .cta-button:hover {
            background: #000;
            color: #fff;
            border-color: #fff;
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }

          .slide:nth-child(even) .cta-button {
            border-color: #000;
            color: #fff;
            background: #000;
          }

          .slide:nth-child(even) .cta-button:hover {
            background: #fff;
            color: #000;
            border-color: #fff;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }

          .timeline {
            margin: 80px 0;
            text-align: left;
            display: table;
            width: 100%;
          }

          .timeline-item {
            display: table-row;
            margin: 0;
          }

          .timeline-number {
            font-family: 'Playfair Display', serif;
            font-size: 7rem;
            font-weight: 900;
            color: rgba(255,255,255,0.65);
            display: table-cell;
            vertical-align: middle;
            width: 200px;
            padding: 30px 30px 30px 0;
            text-align: center;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }

          .slide:nth-child(even) .timeline-number {
            color: rgba(0,0,0,0.65);
            text-shadow: 0 2px 4px rgba(255,255,255,0.1);
          }

          .timeline-content {
            font-family: 'Urbanist', sans-serif;
            font-weight: 600;
            font-size: 1.75rem;
            line-height: 1.4;
            display: table-cell;
            vertical-align: middle;
            padding: 30px 0 30px 15px;
            text-align: left;
            border-left: 1px solid rgba(255,255,255,0.2);
          }
          
          .timeline-content strong {
            font-size: 1.6rem;
            display: block;
            margin-bottom: 0.5rem;
          }
          
          .timeline-content p {
            font-size: 1.3rem;
            margin: 0;
          }

          .testimonial {
            font-family: 'Urbanist', sans-serif;
            font-size: clamp(1.6rem, 3.2vw, 2.4rem);
            font-style: italic;
            font-weight: 400;
            margin: 60px 0;
            padding: 50px;
            border-left: 5px solid currentColor;
            text-align: left;
            line-height: 1.5;
          }

          .testimonial-author {
            font-family: 'Urbanist', sans-serif;
            font-style: normal;
            font-weight: 700;
            margin-top: 30px;
            font-size: 1.3rem;
          }

          .price-card {
            border: 4px solid currentColor;
            padding: 60px;
            margin: 60px 0;
            border-radius: 12px;
          }

          .price {
            font-family: 'Playfair Display', serif;
            font-size: 5rem;
            font-weight: 900;
          }

          .price-period {
            font-family: 'Urbanist', sans-serif;
            font-size: 1.4rem;
            opacity: 0.8;
            font-weight: 500;
          }

          .arrow-down {
            font-size: 4rem;
            margin: 60px 0;
            animation: bounce 2s infinite;
          }

          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% {
              transform: translateY(0);
            }
            40% {
              transform: translateY(25px);
            }
            60% {
              transform: translateY(15px);
            }
          }

          .small-print {
            font-family: 'Urbanist', sans-serif;
            font-size: 1rem;
            opacity: 0.7;
            margin-top: 30px;
            font-weight: 400;
          }

          @media (max-width: 768px) {
            .slide {
              padding: 40px 20px;
              min-height: 100vh;
            }
            
            .comparison {
              grid-template-columns: 1fr;
              gap: 50px;
              min-height: auto;
            }
            
            .timeline {
              display: block;
            }
            
            .timeline-item {
              display: block;
              margin: 30px 0;
              text-align: center;
            }
            
            .timeline-number {
              display: block;
              width: 100%;
              padding: 0 0 10px 0;
              font-size: 6rem;
              color: rgba(255,255,255,0.65);
              text-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }
            
            .timeline-content {
              display: block;
              text-align: center;
              padding: 15px 0 0 0;
              font-size: 1.6rem;
              font-weight: 600;
              max-width: 90%;
              margin: 0 auto;
              border-left: none;
              border-top: 1px solid rgba(255,255,255,0.2);
              padding-top: 15px;
            }
            
            .timeline-content strong {
              font-size: 1.4rem;
            }
            
            .timeline-content p {
              font-size: 1.1rem;
            }
            
            .testimonial {
              padding: 30px 20px;
              font-size: 1.3rem;
            }
            
            .price-card {
              padding: 40px 30px;
            }
            
            .cta-button {
              padding: 20px 40px;
              font-size: 1.2rem;
              display: block;
              text-align: center;
            }
            
            .comparison-item {
              text-align: center;
              margin-bottom: 20px;
            }
            
            .comparison-item h3 {
              font-size: 1.6rem;
              margin-bottom: 20px;
              text-align: center;
            }
            
            .comparison-item li {
              font-size: 1.1rem;
              padding: 12px 0;
              min-height: auto;
              justify-content: center;
              text-align: center;
            }
            
            .contact-info {
              font-size: 1rem;
              line-height: 1.6;
            }
          }

          @media (max-width: 480px) {
            .slide {
              padding: 30px 15px;
            }
            
            h1 {
              font-size: clamp(2.5rem, 10vw, 4rem);
              margin-bottom: 40px;
            }
            
            h2 {
              font-size: clamp(2rem, 8vw, 3rem);
              margin-bottom: 30px;
            }
            
            .huge-text {
              font-size: clamp(4rem, 15vw, 6rem);
            }
            
            .story-text {
              font-size: clamp(1.2rem, 4vw, 1.6rem);
              margin: 30px 0;
            }
            
            .stat {
              font-size: clamp(3rem, 12vw, 5rem);
              margin: 30px 0 20px;
            }
            
            .question {
              font-size: clamp(1.5rem, 6vw, 2.2rem);
              margin: 30px 0;
            }
            
            .subtitle {
              font-size: clamp(1rem, 4vw, 1.3rem);
              margin-bottom: 30px;
            }
            
            .testimonial {
              padding: 20px 15px;
              font-size: 1.1rem;
            }
            
            .testimonial-author {
              font-size: 1rem;
              margin-top: 20px;
            }
            
            .price-card {
              padding: 30px 20px;
            }
            
            .price {
              font-size: 3.5rem;
            }
            
            .cta-button {
              padding: 18px 30px;
              font-size: 1rem;
              letter-spacing: 0.05em;
            }
            
            .timeline-content {
              font-size: 1rem;
            }
            
            .comparison-item li {
              font-size: 1rem;
              padding: 10px 0;
            }
            
            .contact-info {
              font-size: 0.9rem;
              margin-top: 40px;
            }
            
            .arrow-down {
              font-size: 3rem;
              margin: 40px 0;
            }
            
            /* Ensure content doesn't get cut off */
            .slide {
              min-height: auto;
              padding: 30px 15px 60px;
            }
            
            /* Better emphasis styling on mobile */
            .emphasis {
              display: inline-block;
              padding: 2px 4px;
              margin: 0 2px;
            }
          }
          
          /* Extra small screens */
          @media (max-width: 320px) {
            .slide {
              padding: 20px 10px 40px;
            }
            
            h1 {
              font-size: clamp(2rem, 12vw, 3rem);
            }
            
            .huge-text {
              font-size: clamp(3rem, 18vw, 4.5rem);
            }
            
            .cta-button {
              padding: 15px 25px;
              font-size: 0.9rem;
            }
          }

          .fade-in {
            animation: fadeIn 1s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .contact-info {
            font-family: 'Urbanist', sans-serif;
            font-size: 1.2rem;
            font-weight: 600;
            line-height: 1.8;
            margin-top: 60px;
          }

          .contact-info strong {
            font-weight: 800;
            display: block;
            margin-bottom: 15px;
          }
          
          .contact-info a {
            color: inherit;
            text-decoration: underline;
            text-decoration-thickness: 2px;
            text-underline-offset: 4px;
            transition: all 0.3s ease;
            -webkit-tap-highlight-color: transparent;
          }
          
          .contact-info a:hover {
            opacity: 0.8;
            text-decoration-thickness: 3px;
          }
          
          .slide:nth-child(even) .contact-info a {
            color: #000;
          }
          
          /* Ensure proper touch targets */
          a, button, .cta-button {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Prevent text selection on mobile for better UX */
          .slide h1, .slide h2, .huge-text, .stat {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;
          }
          
          /* Improve text rendering */
          .slide {
            text-rendering: optimizeLegibility;
          }
          
          /* Better scroll behavior on mobile */
          @supports (-webkit-overflow-scrolling: touch) {
            body {
              -webkit-overflow-scrolling: touch;
            }
          }
          
          /* Navigation arrows */
          .nav-arrows {
            position: fixed;
            bottom: 30px;
            right: 30px;
            display: flex;
            gap: 15px;
            z-index: 100;
            align-items: center;
          }
          
          .nav-arrow {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .nav-arrow:hover {
            background: rgba(0, 0, 0, 0.8);
            transform: translateY(-3px);
          }
          
          .slide-indicator {
            background: rgba(0, 0, 0, 0.5);
            color: white;
            font-family: 'Urbanist', sans-serif;
            font-size: 14px;
            padding: 8px 12px;
            border-radius: 20px;
            margin: 0 10px;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .fullscreen-button {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: rgba(30, 30, 30, 0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
          }
          
          .fullscreen-button:hover {
            background: rgba(50, 50, 50, 0.9);
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          }
          
          /* Fullscreen button remains consistent across slides */
          
          @media (max-width: 768px) {
            .fullscreen-button {
              top: 20px;
              right: 20px;
              width: 40px;
              height: 40px;
              font-size: 14px;
            }
          }
          
          .slide:nth-child(even) .nav-arrow {
            background: rgba(255, 255, 255, 0.7);
            color: black;
            border: 1px solid rgba(0, 0, 0, 0.2);
          }
          
          .slide:nth-child(even) .nav-arrow:hover {
            background: rgba(255, 255, 255, 0.9);
          }
          
          .slide:nth-child(even) .slide-indicator {
            background: rgba(255, 255, 255, 0.7);
            color: black;
            border: 1px solid rgba(0, 0, 0, 0.2);
          }
          
          @media (max-width: 768px) {
            .nav-arrows {
              bottom: 20px;
              right: 20px;
            }
            
            .nav-arrow {
              width: 40px;
              height: 40px;
              font-size: 20px;
            }
            
            .slide-indicator {
              font-size: 12px;
              padding: 6px 10px;
            }
          }
          
          /* Logo positioning */
          .slide-logo {
            position: absolute;
            bottom: 30px;
            left: 30px;
            font-family: 'Playfair Display', serif;
            font-weight: 900;
            font-size: 1.6rem;
            opacity: 0.8;
            transition: opacity 0.3s ease;
            letter-spacing: -0.02em;
            text-decoration: none;
            cursor: pointer;
          }
          
          .slide-logo:hover {
            opacity: 1;
          }

          .slide-logo-light {
            color: rgba(255, 255, 255, 0.85);
          }

          .slide-logo-dark {
            color: rgba(0, 0, 0, 0.85);
          }
          
          @media (max-width: 768px) {
            .slide-logo {
              font-size: 1.4rem;
              bottom: 20px;
              left: 20px;
            }
          }
          
          @media (max-width: 480px) {
            .slide-logo {
              font-size: 1.2rem;
              bottom: 15px;
              left: 15px;
            }
          }
        `
      }} />

      <div 
        className="presentation-container"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fullscreen button */}
        <div 
          className="fullscreen-button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? "⎯" : "⛶"}
        </div>
        
        {/* Navigation arrows that follow each slide */}
        <div className="nav-arrows">
          <div 
            className="nav-arrow" 
            onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
            aria-label="Previous slide"
          >
            ←
          </div>
          <div className="slide-indicator">
            {currentSlide + 1} / 16
          </div>
          <div 
            className="nav-arrow" 
            onClick={() => setCurrentSlide(prev => Math.min(prev + 1, 15))} 
            aria-label="Next slide"
          >
            →
          </div>
        </div>

        {/* Slide 1: The Hook */}
        <div className="slide" id="slide-0">
          <div className="slide-logo slide-logo-light">Soma AI</div>
          <div className="content fade-in">
            <h1>Your Brand<br />Is Invisible.</h1>
            <div className="subtitle" style={{ fontSize: '1rem', opacity: '0.7', marginTop: '-20px', marginBottom: '30px' }}>
              Navigate with arrow keys, swipe gestures, or navigation buttons
            </div>
            <div className="arrow-down">→</div>
          </div>
        </div>

        {/* Slide 2: The Problem */}
        <div className="slide" id="slide-1">
          <div className="slide-logo slide-logo-dark">Soma AI</div>
          <div className="content">
            <div className="story-text">
              Yesterday, a potential client asked ChatGPT:<br />
              <span className="emphasis">"Who are the leading companies solving payment challenges across African markets?"</span>
            </div>
            <div className="huge-text">Your brand<br />wasn't mentioned.</div>
          </div>
        </div>

        {/* Slide 3: The Reality */}
        <div className="slide" id="slide-2">
          <div className="slide-logo slide-logo-light">Soma AI</div>
          <div className="content">
            <div className="stat">{getStat(4)?.value}</div>
            <div className="stat-label">{getStat(4)?.label}<a href={getStat(4)?.source} className="stat-citation" target="_blank" rel="noopener noreferrer">[{getStat(4)?.citationIndex}]</a></div>
            <h2>Yet most African brands are invisible to these platforms.</h2>
            <div className="subtitle">While your competitors capture market share through AI recommendations 24/7.</div>
          </div>
        </div>

        {/* Slide 4: The Stakes */}
        <div className="slide" id="slide-3">
          <div className="slide-logo slide-logo-dark">Soma AI</div>
          <div className="content">
            <h2 style={{textAlign: 'center', marginBottom: '2rem'}}>Every day AI decides:</h2>
            <div className="timeline" style={{maxWidth: '60%', margin: '0 auto'}}>
              <div className="timeline-item">
                <div className="timeline-number">{getStat(1)?.value}</div>
                <div className="timeline-content">{getStat(1)?.label}<a href={getStat(1)?.source} className="stat-citation" target="_blank" rel="noopener noreferrer">[{getStat(1)?.citationIndex}]</a></div>
              </div>
              <div className="timeline-item">
                <div className="timeline-number">{getStat(2)?.value}</div>
                <div className="timeline-content">{getStat(2)?.label}<a href={getStat(2)?.source} className="stat-citation" target="_blank" rel="noopener noreferrer">[{getStat(2)?.citationIndex}]</a></div>
              </div>
              <div className="timeline-item">
                <div className="timeline-number">{getStat(5)?.value}</div>
                <div className="timeline-content">{getStat(5)?.label}<a href={getStat(5)?.source} className="stat-citation" target="_blank" rel="noopener noreferrer">[{getStat(5)?.citationIndex}]</a></div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 5: The Shift */}
        <div className="slide" id="slide-4">
          <div className="slide-logo slide-logo-light">Soma AI</div>
          <div className="content">
            <div className="question">The search revolution is here:</div>
            <div className="comparison">
              <div className="comparison-item">
                <h3>Traditional SEO</h3>
                <ul>
                  <li>Google Search results</li>
                  <li>10 blue links</li>
                  <li>Users choose from options</li>
                  <li>Click-through required</li>
                </ul>
              </div>
              <div className="comparison-item">
                <h3>AI Search (GEO)</h3>
                <ul>
                  <li><span className="emphasis">Direct recommendations</span></li>
                  <li><span className="emphasis">Single authoritative answer</span></li>
                  <li><span className="emphasis">AI chooses for users</span></li>
                  <li><span className="emphasis">Instant decision influence</span></li>
                </ul>
              </div>
            </div>
            <div style={{display: "flex", justifyContent: "space-around", marginTop: "30px"}}>
              <div style={{flex: "1"}}>
                <div className="stat">{getStat(3)?.value}</div>
                <div className="stat-label">{getStat(3)?.label}<a href={getStat(3)?.source} className="stat-citation" target="_blank" rel="noopener noreferrer">[{getStat(3)?.citationIndex}]</a></div>
              </div>
              <div style={{flex: "1"}}>
                <div className="stat">{getStat(6)?.value}</div>
                <div className="stat-label">{getStat(6)?.label}<a href={getStat(6)?.source} className="stat-citation" target="_blank" rel="noopener noreferrer">[{getStat(6)?.citationIndex}]</a></div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 6: The Solution Introduction */}
        <div className="slide" id="slide-5">
          <div className="slide-logo slide-logo-dark">Soma AI</div>
          <div className="content">
            <h1>Generative Engine<br />Optimization (GEO)</h1>
            <div className="subtitle">When AI platforms like ChatGPT, Claude, Gemini, and Perplexity<br />answer questions about African markets—your brand becomes the authoritative answer.</div>
          </div>
        </div>

        {/* Slide 7: How It Works */}
        <div className="slide" id="slide-6">
          <div className="slide-logo slide-logo-light">Soma AI</div>
          <div className="content">
            <h2>The Soma AI Process</h2>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-number">1</div>
                <div className="timeline-content">
                  <strong>Brand Discoverability & AI Visibility Audit</strong>
                  <p>Measure exactly where your brand stands today. We test 1,000+ real customer queries across 7 major AI platforms to establish your LVI score—revealing competitive gaps and immediate revenue opportunities.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-number">2</div>
                <div className="timeline-content">
                  <strong>Content Optimization</strong>
                  <p>We don't just identify problems—we solve them. We highlight and help you create the exact content assets needed to position your brand as the authority in your market, optimized for both AI systems and human decision-makers.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-number">3</div>
                <div className="timeline-content">
                  <strong>Strategic Implementation</strong>
                  <p>Achieve measurable ROI through targeted deployment across your digital ecosystem. We ensure AI platforms recognize your brand authority, delivering qualified leads and conversions with no additional marketing spend.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 8: The Difference */}
        <div className="slide" id="slide-7">
          <div className="slide-logo slide-logo-dark">Soma AI</div>
          <div className="content">
            <h2>Beyond traditional<br />SEO and marketing.</h2>
            <div className="story-text">
              We don't just optimize for search rankings.<br />
              We engineer for <span className="emphasis">AI decision models</span>.<br />
              We cultivate <span className="emphasis">authority signals</span>.<br />
              We structure <span className="emphasis">domain expertise</span>.<br />
              <br />
              Because AI doesn't think like search engines.
            </div>
          </div>
        </div>

        {/* Slide 9: Real Results */}
        <div className="slide" id="slide-8">
          <div className="slide-logo slide-logo-light">Soma AI</div>
          <div className="content">
            <div className="stat">+29</div>
            <div className="stat-label">average LVI point increase (90 days)</div>
            <h2>Measurable Impact on AI Visibility</h2>
            <div className="subtitle">Our clients see significant improvements in how AI platforms recognize and recommend their brands across African markets.</div>
          </div>
        </div>

        {/* Slide 10: The Competition */}
        <div className="slide" id="slide-9">
          <div className="slide-logo slide-logo-dark">Soma AI</div>
          <div className="content">
            <h2>Your competitors are investing in AI visibility.</h2>
            <div className="question">Are they ahead of you?</div>
            <div className="comparison">
              <div className="comparison-item">
                <h3>If They Are</h3>
                <ul>
                  <li>AI already knows them as authorities</li>
                  <li>They capture AI-driven customers</li>
                  <li>Your invisibility compounds daily</li>
                  <li>Catch-up becomes exponentially harder</li>
                </ul>
              </div>
              <div className="comparison-item">
                <h3>If They're Not</h3>
                <ul>
                  <li>First-mover advantage is yours</li>
                  <li>Establish AI authority in your market</li>
                  <li>Capture their potential customers</li>
                  <li>Build insurmountable competitive moats</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 11: The Investment */}
        <div className="slide" id="slide-10">
          <div className="slide-logo slide-logo-light">Soma AI</div>
          <div className="content">
            <h2>What does AI invisibility cost?</h2>
            <div className="story-text">
              If <span className="emphasis">5 qualified prospects</span> per month<br />
              choose competitors because AI didn't recommend you...<br />
              <br />
              That's <span className="emphasis">60 lost opportunities</span> per year.<br />
              <br />
              What's your average deal value?
            </div>
            <div className="subtitle" style={{marginTop: '60px'}}>
              The cost of invisibility far exceeds the investment in AI optimization.<br />
              Every day you wait, competitors capture your potential customers.
            </div>
          </div>
        </div>

        {/* Slide 12: The Urgency */}
        <div className="slide" id="slide-11">
          <div className="slide-logo slide-logo-dark">Soma AI</div>
          <div className="content" style={{maxHeight: '85vh', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
            <div className="huge-text" style={{fontSize: 'calc(3rem + 4vw)', lineHeight: '1.1'}}>12-18</div>
            <div className="stat-label" style={{marginBottom: '2vh'}}>months</div>
            <h2 style={{fontSize: 'calc(1.5rem + 1vw)', lineHeight: '1.2', marginBottom: '2vh'}}>Before GEO becomes table stakes in African markets.</h2>
            <div className="subtitle" style={{fontSize: 'calc(1rem + 0.5vw)', lineHeight: '1.4'}}>Right now, it's a regional competitive advantage. Soon, it'll be required to compete globally.</div>
          </div>
        </div>

        {/* Slide 13: The Guarantee */}
        <div className="slide" id="slide-12">
          <div className="slide-logo slide-logo-light">Soma AI</div>
          <div className="content">
            <h1>90-Day <br /> Guarantee.</h1>
            <div className="story-text">
              If your brand's LVI score doesn't meaningfully increase
              and visibility demonstrably improve within 90 days, <br />
              <span className="emphasis">your investment is returned in full.</span>
            </div>
            <div className="small-print">No long-term contracts. Transparent reporting for stakeholders. Results-driven guarantee.</div>
          </div>
        </div>

        {/* Slide 14: The Decision */}
        <div className="slide" id="slide-13">
          <div className="slide-logo slide-logo-dark">Soma AI</div>
          <div className="content">
            <h2>Two paths forward:</h2>
            <div className="comparison">
              <div className="comparison-item">
                <h3>Status Quo</h3>
                <ul>
                  <li>Remain invisible to AI-powered recommendations</li>
                  <li>Watch competitors capture AI-driven market share</li>
                  <li>Lose qualified prospects to more visible brands</li>
                  <li>Fall behind as AI adoption accelerates globally</li>
                  <li>Struggle to recover lost market position later</li>
                </ul>
              </div>
              <div className="comparison-item">
                <h3>AI-First Strategy</h3>
                <ul>
                  <li>Dominate AI responses in your regional market</li>
                  <li>Capture high-intent prospects across Africa</li>
                  <li>Build sustainable competitive advantage</li>
                  <li>Establish pan-African thought leadership</li>
                  <li>Future-proof your digital growth strategy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 15: The CTA */}
        <div className="slide" id="slide-14">
          <div className="slide-logo slide-logo-light">Soma AI</div>
          <div className="content">
            <h1>Be Found.<br />Be First.<br />Be Chosen.</h1>
            <button onClick={() => setIsDemoOpen(true)} className="cta-button">Get Your Free AI Visibility Audit</button>
            <div className="subtitle">
              Comprehensive AI visibility analysis across 7 platforms.<br />
              Receive your baseline LVI score and strategic market capture plan.
            </div>
            <div className="contact-info">
              <strong>Ready to discuss your AI strategy?</strong>
              Email: <em><a href={`mailto:${ORG_CONTACT.email}`}>{ORG_CONTACT.email}</a><br /></em>
              Book a demo: <a href="https://withsoma.ai/">https://withsoma.ai/</a>
            </div>
          </div>
        </div>

        {/* Slide 16: The PS */}
        <div className="slide" id="slide-15">
          <div className="slide-logo slide-logo-dark">Soma AI</div>
          <div className="content">
            <div className="story-text">
              <em>P.S.</em>
            </div>
            <h2>Right now, someone is asking AI<br />about your industry.</h2>
            <div className="story-text">
              What will AI recommend for African solutions?<br />
              <br />
              <span className="emphasis">Find out with a complimentary audit:</span><br />
              withsoma.ai
            </div>
          </div>
        </div>
      </div>
      <DemoRequestForm isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
      <div style={{textAlign:'center', padding:'30px 20px', fontSize:'0.75rem', opacity:0.55}}>
        Serving Brands Globally • © {new Date().getFullYear()} Soma AI
      </div>
    </>
  )
}