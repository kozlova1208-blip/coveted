import { useState, useEffect } from 'react';

export default function Timer({ phaseStartTime, phaseDuration }) {
  const [remaining, setRemaining] = useState(phaseDuration);

  useEffect(() => {
    if (!phaseStartTime || !phaseDuration) return;

    const tick = () => {
      const elapsed = (Date.now() - phaseStartTime) / 1000;
      const left = Math.max(0, Math.ceil(phaseDuration - elapsed));
      setRemaining(left);
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [phaseStartTime, phaseDuration]);

  const pct = phaseDuration ? (remaining / phaseDuration) * 100 : 0;
  const urgent = remaining <= 10;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: `2px solid ${urgent ? '#c0392b' : 'var(--border)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.8rem',
          fontWeight: 500,
          color: urgent ? '#c0392b' : 'var(--dark-grey)',
          transition: 'color 0.3s, border-color 0.3s',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {remaining}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: `${pct}%`,
            height: '100%',
            background: urgent ? 'rgba(192,57,43,0.08)' : 'rgba(200,169,110,0.12)',
            transition: 'width 0.5s linear, background 0.3s',
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          height: 2,
          background: 'var(--light-grey)',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: urgent ? '#c0392b' : 'var(--accent)',
            transition: 'width 0.5s linear, background 0.3s',
          }}
        />
      </div>
    </div>
  );
}
