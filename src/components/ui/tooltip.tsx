'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 700,
  position = 'top',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const trigger = triggerRef.current;
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newPosition = position;

      // Check if tooltip would go off screen and adjust position
      if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom';
      } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewport.height - 10) {
        newPosition = 'top';
      } else if (position === 'left' && triggerRect.left - tooltipRect.width < 10) {
        newPosition = 'right';
      } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewport.width - 10) {
        newPosition = 'left';
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const getTooltipStyles = () => {
    const baseStyles = 'absolute z-[10000] px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none';
    
    switch (actualPosition) {
      case 'top':
        return `${baseStyles} bottom-full left-1/2 transform -translate-x-1/2 mb-1`;
      case 'bottom':
        return `${baseStyles} top-full left-1/2 transform -translate-x-1/2 mt-1`;
      case 'left':
        return `${baseStyles} right-full top-1/2 transform -translate-y-1/2 mr-1`;
      case 'right':
        return `${baseStyles} left-full top-1/2 transform -translate-y-1/2 ml-1`;
      default:
        return `${baseStyles} bottom-full left-1/2 transform -translate-x-1/2 mb-1`;
    }
  };

  const getArrowStyles = () => {
    const baseArrowStyles = 'absolute w-2 h-2 bg-gray-900 transform rotate-45';
    
    switch (actualPosition) {
      case 'top':
        return `${baseArrowStyles} top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
      case 'bottom':
        return `${baseArrowStyles} bottom-full left-1/2 transform -translate-x-1/2 translate-y-1/2`;
      case 'left':
        return `${baseArrowStyles} left-full top-1/2 transform -translate-y-1/2 -translate-x-1/2`;
      case 'right':
        return `${baseArrowStyles} right-full top-1/2 transform -translate-y-1/2 translate-x-1/2`;
      default:
        return `${baseArrowStyles} top-full left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
    }
  };

  return (
    <div 
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {React.cloneElement(children, {
        ...children.props
      })}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={getTooltipStyles()}
          role="tooltip"
        >
          {content}
          <div className={getArrowStyles()} />
        </div>
      )}
    </div>
  );
};