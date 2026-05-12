import { useState } from 'react';

export default function Card({
  card,
  selected = false,
  voted = false,
  onClick,
  compact = false,
  fill = false,   // when true the card stretches to fill its container width
  votedBy = [],
}) {
  const [imgError, setImgError] = useState(false);

  const w = fill ? '100%' : compact ? 130 : 180;
  const h = compact ? 170 : 240;

  return (
    <div
      onClick={() => onClick?.(card)}
      style={{
        width: w,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Card frame */}
      <div
        style={{
          border: selected
            ? '2px solid var(--black)'
            : voted
            ? '2px solid var(--accent)'
            : '1px solid var(--border)',
          borderRadius: 3,
          background: 'var(--white)',
          overflow: 'hidden',
          transition: 'border 0.15s, transform 0.15s, box-shadow 0.15s',
          transform: selected ? 'translateY(-6px)' : 'none',
          boxShadow: selected ? '0 8px 24px rgba(0,0,0,0.14)' : 'var(--shadow)',
        }}
      >
        {/* Image */}
        <div
          style={{
            width: '100%',
            height: h,
            background: 'var(--light-grey)',
            overflow: 'hidden',
          }}
        >
          {!imgError ? (
            <img
              src={card.image}
              alt={card.name}
              onError={() => setImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div
              style={{
                width: '100%', height: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 6, color: 'var(--mid-grey)',
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>◻</span>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {card.brand}
              </span>
            </div>
          )}
        </div>

        {/* Name + brand */}
        <div style={{ padding: compact ? '8px 10px' : '10px 12px' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: compact ? '0.8rem' : '0.95rem',
              lineHeight: 1.3,
              marginBottom: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {card.name}
          </p>
          <p
            style={{
              fontSize: '0.65rem',
              color: 'var(--mid-grey)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {card.brand}
          </p>
        </div>
      </div>

      {/* Voted-by names */}
      {votedBy.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {votedBy.map((name) => (
            <span
              key={name}
              style={{
                fontSize: '0.6rem', padding: '1px 6px',
                border: '1px solid var(--border)', borderRadius: 20,
                color: 'var(--dark-grey)', background: 'var(--white)',
              }}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Selected dot */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            bottom: votedBy.length ? 28 : -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8, height: 8,
            borderRadius: '50%',
            background: 'var(--black)',
          }}
        />
      )}
    </div>
  );
}
