import { useState } from 'react';

export default function Card({
  card,
  selected = false,
  voted = false,
  isBuyer = false,
  onClick,
  disabled = false,
  showDetails = false,
  compact = false,
  votedBy = [],
}) {
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    if (!disabled && onClick) onClick(card);
  };

  const w = compact ? 130 : 180;
  const h = compact ? 170 : 240;

  return (
    <div
      onClick={handleClick}
      style={{
        width: w,
        flexShrink: 0,
        cursor: disabled ? 'default' : onClick ? 'pointer' : 'default',
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
          boxShadow: selected
            ? '0 8px 24px rgba(0,0,0,0.14)'
            : 'var(--shadow)',
        }}
      >
        {/* Image */}
        <div
          style={{
            width: '100%',
            height: h,
            background: 'var(--light-grey)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {!imgError ? (
            <img
              src={card.image}
              alt={card.name}
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 6,
                color: 'var(--mid-grey)',
              }}
            >
              <span style={{ fontSize: '1.6rem' }}>◻</span>
              <span style={{ fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {card.brand}
              </span>
            </div>
          )}

          {/* Category tag */}
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'rgba(255,255,255,0.92)',
              padding: '2px 7px',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 500,
              color: 'var(--dark-grey)',
              borderRadius: 20,
            }}
          >
            {card.category}
          </div>

          {/* Buyer badge */}
          {isBuyer && (
            <div
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'var(--black)',
                color: 'var(--white)',
                padding: '2px 7px',
                fontSize: '0.6rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 500,
                borderRadius: 20,
              }}
            >
              Buyer
            </div>
          )}
        </div>

        {/* Info */}
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

          {showDetails && (
            <>
              <p
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--dark-grey)',
                  marginTop: 6,
                  lineHeight: 1.4,
                }}
              >
                {card.description}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  marginTop: 6,
                }}
              >
                {card.price}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Voted-by names */}
      {votedBy.length > 0 && (
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 3,
            justifyContent: 'center',
          }}
        >
          {votedBy.map((name) => (
            <span
              key={name}
              style={{
                fontSize: '0.6rem',
                padding: '1px 6px',
                border: '1px solid var(--border)',
                borderRadius: 20,
                color: 'var(--dark-grey)',
                background: 'var(--white)',
              }}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Selected indicator */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            bottom: votedBy.length ? 28 : -8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--black)',
          }}
        />
      )}
    </div>
  );
}
