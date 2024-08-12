import React, { useState, useEffect, useRef } from 'react';

const AutoHideScrollbar = ({ children, style,className = '',...props }:any) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<null|any>(null);
  const scrollContainerRef = useRef<null|any>(null);

  const handleScroll = () => {
    setIsScrolling(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 1000); // Hide scrollbar after 1 second of inactivity
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []) 

  return (
    <div 
      ref={scrollContainerRef}
      className={`custom-scrollbar ${isScrolling ? 'scrolling' : ''} ${className}`}
      style={{
        overflow: 'auto',
        transition: 'scrollbar-color 0.3s ease',...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default AutoHideScrollbar;
