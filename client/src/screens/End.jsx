import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { avatarChar } from '../utils/avatar';

const AVATAR_COLORS = ['#FF6B6B', '#9B5DE5', '#00C9C8', '#F4845F', '#06D6A0', '#FF99C8', '#FFD166', '#9B5DE5'];

function Flower({ x, y, size = 32, color = '#FF6B6B', centerColor = '#FFD166', rotate = 0, opacity = 0.8 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`} opacity={opacity}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={0} cy={-size * 0.52} rx={size * 0.21} ry={size * 0.38} fill={color} transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={0} r={size * 0.22} fill={centerColor} />
    </g>
  );
}

export default function End() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket();

  const [room, setRoom] = useState(location.state?.room ?? null);

  useEffect(() => {
    if (!socket || !connected) return;
    socket.on('room-update', (r) => setRoom(r));

    if (!room) {
      const savedName = sessionStorage.getItem('coveted:name');
      const savedCode = sessionStorage.getItem('coveted:room');
      if (savedName && savedCode === code) {
        socket.emit('reconnect-room', { code, name: savedName }, (res) => {
          if (res.success) setRoom(res.room);
          else navigate('/');
        });
      } else {
        navigate('/');
      }
    }

    return () => socket.off('room-update');
  }, [socket, connected]); // eslint-disable-line

  if (!room) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--mid-grey)' }}>Loading results…</p>
      </div>
    );
  }

  const sorted = [...room.players].sort(
    (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
  );
  const winner = sorted[0];
  const winnerOriginalIndex = room.players.findIndex((p) => p.id === winner?.id);
  const winnerColor = AVATAR_COLORS[winnerOriginalIndex % AVATAR_COLORS.length];

  const bestClueEntry = room.roundHistory?.reduce((best, entry) => {
    if (!best) return entry;
    return (entry.clue?.length ?? 0) > (best.clue?.length ?? 0) ? entry : best;
  }, null);

  const myId = socket?.id;

  return (
    <div className="page" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <header className="site-header" style={{ background: 'var(--cream)' }}>
        <span className="wordmark">Luxit</span>
        <span className="phase-badge">Final Scores</span>
      </header>

      {/* Winner hero */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          padding: '40px 20px 36px',
          background: 'var(--light)',
          borderBottom: '2px solid var(--border)',
        }}
      >
        {/* flower decorations */}
        <div className="flowers-bg">
          <svg width="100%" height="100%" viewBox="0 0 420 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <Flower x={18}  y={25}  size={44} color="#FF6B6B" centerColor="#FFD166" rotate={-15} />
            <Flower x={402} y={20}  size={40} color="#9B5DE5" centerColor="#FFD166" rotate={18} />
            <Flower x={55}  y={145} size={24} color="#00C9C8" centerColor="#FF99C8" rotate={10}  opacity={0.6} />
            <Flower x={370} y={140} size={24} color="#06D6A0" centerColor="#FFD166" rotate={-10} opacity={0.6} />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--mid-grey)',
              marginBottom: 14,
            }}
          >
            Winner
          </p>
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: winnerColor,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: '2rem',
              margin: '0 auto 14px',
              boxShadow: `0 0 0 4px ${winnerColor}44`,
            }}
          >
            {avatarChar(winner?.name ?? '')}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.4rem',
              fontWeight: 400,
              marginBottom: 4,
            }}
          >
            {winner?.name}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--mid-grey)' }}>
            {room.scores[winner?.id] ?? 0} points
            {winner?.id === myId && ' — that’s you!'}
          </p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px 60px' }}>

        {/* Leaderboard — horizontal bar chart */}
        <div style={{ marginBottom: 28 }}>
          <p className="label" style={{ marginBottom: 16 }}>Leaderboard</p>
          {(() => {
            const maxScore = Math.max(...sorted.map((p) => room.scores[p.id] ?? 0), 1);
            return sorted.map((p, i) => {
              const originalIndex = room.players.findIndex((pl) => pl.id === p.id);
              const avatarColor = AVATAR_COLORS[originalIndex % AVATAR_COLORS.length];
              const score = room.scores[p.id] ?? 0;
              const pct = Math.max((score / maxScore) * 100, 4);
              return (
                <div key={p.id} style={{ marginBottom: 10 }}>
                  {/* Name row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--mid-grey)', width: 14, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: p.id === myId ? 700 : 400 }}>
                      {p.name}
                    </span>
                    {p.id === myId && (
                      <span style={{ fontSize: '0.62rem', color: 'var(--mid-grey)' }}>(you)</span>
                    )}
                  </div>
                  {/* Bar row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.65rem', width: 14, flexShrink: 0 }} />
                    <div style={{ flex: 1, background: 'var(--light)', borderRadius: 100, height: 28, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: avatarColor,
                          borderRadius: 100,
                          transition: 'width 0.6s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingRight: 10,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: '1.1rem',
                        fontWeight: i === 0 ? 700 : 400,
                        color: i === 0 ? 'var(--black)' : 'var(--dark-grey)',
                        minWidth: 28,
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {score}
                    </span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Best clue */}
        {bestClueEntry && (
          <div
            style={{
              padding: '20px',
              background: 'var(--light)',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginBottom: 28,
            }}
          >
            <p
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--mid-grey)',
                marginBottom: 10,
              }}
            >
              Best Clue of the Game
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                marginBottom: 10,
              }}
            >
              &ldquo;{bestClueEntry.clue}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--dark-grey)' }}>
                — {bestClueEntry.buyerName}
              </span>
              {bestClueEntry.buyerCard && (
                <span style={{ fontSize: '0.72rem', color: 'var(--mid-grey)' }}>
                  for {bestClueEntry.buyerCard.brand} {bestClueEntry.buyerCard.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Round history */}
        {room.roundHistory?.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <p className="label" style={{ marginBottom: 14 }}>Round by Round</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {room.roundHistory.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--white)',
                  }}
                >
                  <span
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.62rem', fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: '0.95rem', flex: 1 }}>
                    &ldquo;{entry.clue}&rdquo;
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--mid-grey)' }}>
                    {entry.buyerName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className="btn btn-coral"
          style={{ width: '100%' }}
          onClick={() => navigate('/')}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
