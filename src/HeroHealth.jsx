// HeroHealth.jsx
'use client'
import React from 'react';
import useHeroStore from './heroStore';

const HeroHealth = () => {
  const heroHealth = useHeroStore((state) => state.heroHealth);
  return (
    <p
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        margin: 0,
        padding: '10px 15px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        fontSize: '18px',
        borderRadius: '5px',
        zIndex: 1000
      }}
    >
      Health: {heroHealth}
    </p>
  );
};

export default HeroHealth;
