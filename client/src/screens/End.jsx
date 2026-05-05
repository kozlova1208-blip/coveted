import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

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

  // Best clue = longest clue (as a stand-in until we track ratings)
  const bestClueEntry = room.roundHistory?.reduce((best, entry) => {
    if (!best) return entry;
    return (entry.clue?.length ?? 0) > (best.clue?.length ?? 0) ? entry : best;
  }, null);

  const myId = socket?.id;

  return (
    <div className="page" style={{ background: 'var(--white)' }}>
      {/* Header */}
      <header className="site-header">
        <span className="wordmark">Luxit</span>
        <span className="phase-badge">Final Scores</span>
      </header>

      <div className="container" style={{ padding: '40px 20px 60px' }}>
        {/* Winner */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p
            style={{
              fontSize: '0.65rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--mid-grey)',
              marginBottom: 12,
            }}
          >
            Winner
          </p>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--black)',
              color: 'var(--white)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-serif)',
              fontSize: '1.8rem',
              
              margin: '0 auto 14px',
            }}
          >
            {winner?.name.charAt(0).toUpperCase()}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '2.2rem',
              
              marginBottom: 4,
            }}
          >
            {winner?.name}
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--mid-grey)' }}>
            {room.scores[winner?.id] ?? 0} points
            {winner?.id === myId && ' \u2014 that\u2019s you!'}
          </p>
        </div>

        {/* Leaderboard */}
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 32,
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              background: 'var(--off-white)',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <p className="label" style={{ margin: 0 }}>Leaderboard</p>
          </div>
          {sorted.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < sorted.length - 1 ? '1px solid var(--border)' : 'none',
                background: p.id === myId ? 'var(--off-white)' : 'var(--white)',
              }}
            >
              <span
                style={{
                  width: 24,
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1rem',
                  color: i === 0 ? 'var(--black)' : 'var(--mid-grey)',
                  fontWeight: i === 0 ? 600 : 400,
                  marginRight: 14,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: i === 0 ? 'var(--black)' : 'var(--light-grey)',
                  color: i === 0 ? 'var(--white)' : 'var(--dark-grey)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  marginRight: 12,
                  flexShrink: 0,
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: '0.92rem' }}>
                {p.name}
                {p.id === myId && (
                  <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'var(--mid-grey)' }}>
                    (you)
                  </span>
                )}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.3rem',
                  color: i === 0 ? 'var(--black)' : 'var(--dark-grey)',
                  fontWeight: i === 0 ? 600 : 400,
                }}
              >
                {room.scores[p.id] ?? 0}
              </span>
            </div>
          ))}
        </div>

        {/* Best clue */}
        {bestClueEntry && (
          <div
            style={{
              padding: '20px',
              background: 'var(--off-white)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              marginBottom: 32,
            }}
          >
            <p
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.12em',
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
                fontSize: '1.4rem',
                
                marginBottom: 8,
              }}
            >
              "{bestClueEntry.clue}"
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
                    borderRadius: 3,
                    background: 'var(--white)',
                  }}
                >
                  <span style={{ fontSize: '0.65rem', color: 'var(--mid-grey)', minWidth: 18 }}>
                    {i + 1}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: '0.95rem',
                      
                      flex: 1,
                    }}
                  >
                    "{entry.clue}"
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
          className="btn-outline btn"
          style={{ width: '100%' }}
          onClick={() => navigate('/')}
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
