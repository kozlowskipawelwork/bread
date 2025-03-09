import React from 'react';

const PickupBreadPrompt = () => {
  return (
    <p
      style={{
        position: 'fixed',
        bottom: '60px', 
        right: '20px',
        margin: 0,
        padding: '10px 15px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        fontSize: '18px',
        borderRadius: '5px',
        zIndex: 1100
      }}
    >
      Click E to pickup bread
    </p>
  );
};

export default PickupBreadPrompt;
