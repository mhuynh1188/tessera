'use client';

import React, { ReactNode, useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// Fade In Animation
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 500, 
  direction = 'up', 
  className 
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!isMounted) {
    return <div className="opacity-0">{children}</div>;
  }

  const directionClasses = {
    up: isVisible ? 'translate-y-0' : 'translate-y-4',
    down: isVisible ? 'translate-y-0' : '-translate-y-4',
    left: isVisible ? 'translate-x-0' : 'translate-x-4',
    right: isVisible ? 'translate-x-0' : '-translate-x-4',
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        directionClasses[direction],
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  );
}

// Stagger Animation for lists
interface StaggerProps {
  children: ReactNode[];
  delay?: number;
  staggerDelay?: number;
  className?: string;
}

export function Stagger({ children, delay = 0, staggerDelay = 100, className }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={delay + (index * staggerDelay)}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// Intersection Observer Animation
interface InViewProps {
  children: ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  className?: string;
  animationClass?: string;
}

export function InView({ 
  children, 
  threshold = 0.1, 
  rootMargin = '0px', 
  triggerOnce = true,
  className,
  animationClass = 'animate-fade-in-up'
}: InViewProps) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-700',
        isInView ? animationClass : 'opacity-0 translate-y-8',
        className
      )}
    >
      {children}
    </div>
  );
}

// Floating Animation
interface FloatingProps {
  children: ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  speed?: 'slow' | 'medium' | 'fast';
  className?: string;
}

export function Floating({ 
  children, 
  intensity = 'medium', 
  speed = 'medium',
  className 
}: FloatingProps) {
  const intensityValues = {
    subtle: '2px',
    medium: '4px',
    strong: '8px'
  };

  const speedValues = {
    slow: '4s',
    medium: '3s',
    fast: '2s'
  };

  return (
    <div
      className={cn('animate-float', className)}
      style={{
        animationDuration: speedValues[speed],
        '--float-distance': intensityValues[intensity],
      } as React.CSSProperties}
    >
      {children}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(calc(-1 * var(--float-distance))); }
        }
        .animate-float {
          animation: float var(--animation-duration, 3s) ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Magnetic Button Effect
interface MagneticProps {
  children: ReactNode;
  strength?: number;
  className?: string;
}

export function Magnetic({ children, strength = 20, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('translate3d(0,0,0)');

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / rect.width;
      const deltaY = (e.clientY - centerY) / rect.height;
      
      const moveX = deltaX * strength;
      const moveY = deltaY * strength;
      
      setTransform(`translate3d(${moveX}px, ${moveY}px, 0)`);
    };

    const handleMouseLeave = () => {
      setTransform('translate3d(0,0,0)');
    };

    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return (
    <div
      ref={ref}
      className={cn('transition-transform duration-200 ease-out', className)}
      style={{ transform }}
    >
      {children}
    </div>
  );
}

// Parallax Effect
interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.5, className }: ParallaxProps) {
  const [offset, setOffset] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const rate = scrolled * speed;
        setOffset(rate);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
      }}
    >
      {children}
    </div>
  );
}

// Typewriter Effect
interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  onComplete?: () => void;
}

export function Typewriter({ 
  text, 
  speed = 50, 
  delay = 0, 
  className,
  onComplete 
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
      } else if (onComplete) {
        onComplete();
      }
    }, delay);

    return () => clearTimeout(startTimer);
  }, [currentIndex, text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayText}
      {currentIndex < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

// Reveal Text Animation
interface RevealTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export function RevealText({ text, className, delay = 0 }: RevealTextProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsRevealed(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          'transition-transform duration-700 ease-out',
          isRevealed ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        {text}
      </div>
    </div>
  );
}

// Scale On Hover
interface ScaleHoverProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export function ScaleHover({ children, scale = 1.05, className }: ScaleHoverProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-300 ease-out hover:scale-105',
        className
      )}
      style={{ '--scale': scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// Bounce Animation
interface BounceProps {
  children: ReactNode;
  trigger?: boolean;
  className?: string;
}

export function Bounce({ children, trigger = false, className }: BounceProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-300',
        trigger ? 'animate-bounce' : '',
        className
      )}
    >
      {children}
    </div>
  );
}