import React from 'react';

/**
 * MobileControls - A reusable D-pad/button component for mobile games.
 * Props:
 *   onUp, onDown, onLeft, onRight, onCenter: callback functions for each direction/button
 *   showCenter: boolean, whether to show the center/action button
 *   style: additional style overrides
 */
export default function MobileControls({
  onUp, onDown, onLeft, onRight, onCenter, showCenter = false, style = {}
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: 12,
        width: 240,
        margin: '0 auto',
        touchAction: 'manipulation',
        ...style
      }}
    >
      <div></div>
      <button
        aria-label="Up"
        onTouchStart={onUp}
        onMouseDown={onUp}
        style={buttonStyle}
      >↑</button>
      <div></div>
      <button
        aria-label="Left"
        onTouchStart={onLeft}
        onMouseDown={onLeft}
        style={buttonStyle}
      >←</button>
      {showCenter ? (
        <button
          aria-label="Center"
          onTouchStart={onCenter}
          onMouseDown={onCenter}
          style={{ ...buttonStyle, fontSize: '1.6rem', background: '#0f0', color: '#111', border: '3px solid #0f0' }}
        >●</button>
      ) : (
        <div></div>
      )}
      <button
        aria-label="Right"
        onTouchStart={onRight}
        onMouseDown={onRight}
        style={buttonStyle}
      >→</button>
      <div></div>
      <button
        aria-label="Down"
        onTouchStart={onDown}
        onMouseDown={onDown}
        style={buttonStyle}
      >↓</button>
      <div></div>
    </div>
  );
}

const buttonStyle = {
  width: 60,
  height: 60,
  fontSize: '2rem',
  background: '#222',
  color: '#0f0',
  border: '3px solid #0f0',
  borderRadius: '50%',
  cursor: 'pointer',
  fontFamily: 'monospace',
  touchAction: 'manipulation',
  boxShadow: '0 0 8px #0f0',
  userSelect: 'none',
  outline: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}; 