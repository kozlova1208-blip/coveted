import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { avatarChar } from '../utils/avatar';

const AVATAR_COLORS = ['#FF6B6B', '#9B5DE5', '#00C9C8', '#F4845F', '#06D6A0', '#FF99C8', '#FFD166', '#F4845F', '#00C9C8'];

function Flower({ x, y, size = 30, color = '#FF6B6B', centerColor = '#FFD166', rotate = 0, opacity = 0.8 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`} opacity={opacity}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={0} cy={-size * 0.52} rx={size * 0.21} ry={size * 0.38} fill={color} transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={0} r={size * 0.22} fill={centerColor} />
    </g>
  );
}

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket();

  const [room, setRoom] = useState(location.state?.room ?? null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const shareLink = `${window.location.origin}/?join=${code}`;

  const myId = socket?.id;
  const isHost = room?.players?.[0]?.id === myId;

  useEffect(() => {
    if (!socket || !connected) return;

    const onRoomUpdate = (updatedRoom) => {
      setRoom(updatedRoom);
      if (updatedRoom.status !== 'lobby') {
        navigate(`/game/${code}`, { state: { room: updatedRoom } });
      }
    };

    socket.on('room-update', onRoomUpdate);

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

    return () => socket.off('room-update', onRoomUpdate);
  }, [socket, connected]); // eslint-disable-line

  function handleStart() {
    if (!socket) return;
    if (room.players.length < 3) return setError('Need at least 3 players to start');
    socket.emit('start-game', { code });
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (!room) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: 'var(--mid-grey)', fontSize: '0.9rem' }}>
          {connected ? 'Joining room…' : 'Connecting…'}
        </p>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: 'var(--cream)' }}>

      {/* Header */}
      <header className="site-header" style={{ background: 'var(--cream)' }}>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1 }}>
          {'LUXIT'.split('').map((l, i) => (
            <span key={i} style={{ color: ['#E63329','#F5B800','#3B5BDB','#FF6B35','#E91E8C'][i] }}>{l}</span>
          ))}
        </span>
        <span className="phase-badge">
          <span className="phase-dot" />
          Lobby
        </span>
      </header>

      {/* Room code hero strip */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          padding: '32px 20px 28px',
          borderBottom: '2px solid var(--border)',
          background: 'var(--light)',
        }}
      >
        {/* small flower decorations */}
        <div className="flowers-bg">
          <svg width="100%" height="100%" viewBox="0 0 420 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <Flower x={20}  y={20}  size={38} color="#9B5DE5" centerColor="#FFD166" rotate={-15} />
            <Flower x={400} y={15}  size={34} color="#FF6B6B" centerColor="#FFD166" rotate={20} />
            <Flower x={55}  y={100} size={22} color="#00C9C8" centerColor="#FF99C8" rotate={10}  opacity={0.6} />
            <Flower x={370} y={100} size={22} color="#06D6A0" centerColor="#FFD166" rotate={-10} opacity={0.6} />
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="label" style={{ marginBottom: 10 }}>Room Code</p>
          <button
            onClick={copyCode}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2.2rem, 10vw, 3.8rem)',
                letterSpacing: '0.22em',
                color: 'var(--black)',
              }}
            >
              {code}
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: copied ? '#06D6A0' : 'var(--mid-grey)',
                border: `1px solid ${copied ? '#06D6A0' : 'var(--border)'}`,
                padding: '3px 10px',
                borderRadius: 100,
                transition: 'all 0.2s',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
          <p style={{ fontSize: '0.78rem', color: 'var(--mid-grey)', marginTop: 6 }}>
            Or share the link below — friends can join in one tap
          </p>

          {/* Shareable link */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 14,
              padding: '10px 14px',
              background: 'var(--white)',
              border: `2px solid ${linkCopied ? '#06D6A0' : 'var(--border)'}`,
              borderRadius: 100,
              transition: 'border-color 0.2s',
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: '0.78rem',
                color: 'var(--dark-grey)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {shareLink}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(shareLink).then(() => {
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                });
              }}
              style={{
                flexShrink: 0,
                background: linkCopied ? '#06D6A0' : 'var(--black)',
                color: '#fff',
                border: 'none',
                borderRadius: 100,
                padding: '6px 14px',
                fontSize: '0.68rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {linkCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '28px 20px', flex: 1 }}>

        {/* Player list */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <p className="label" style={{ margin: 0 }}>
              Players — {room.players.length} / 9
            </p>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: room.players.length < 3 ? 'var(--coral)' : '#06D6A0',
              }}
            >
              {room.players.length < 3 ? `Need ${3 - room.players.length} more` : 'Ready to play ✓'}
            </span>
          </div>

          <div
            style={{
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              overflow: 'hidden',
              background: 'var(--white)',
            }}
          >
            {room.players.map((player, i) => (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: i < room.players.length - 1 ? '1px solid var(--border)' : 'none',
                  background: player.id === myId ? 'var(--light)' : 'var(--white)',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {avatarChar(player.name)}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.92rem' }}>{player.name}</span>
                  {player.id === myId && (
                    <span style={{ marginLeft: 8, fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--mid-grey)', textTransform: 'uppercase' }}>
                      You
                    </span>
                  )}
                </div>
                {i === 0 && (
                  <span className="tag" style={{ background: 'var(--coral)', color: '#fff' }}>
                    Host
                  </span>
                )}
              </div>
            ))}

            {room.players.length < 3 &&
              Array.from({ length: 3 - room.players.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    padding: '14px 16px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: '2px dashed var(--border)',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--mid-grey)' }}>Waiting for a friend…</span>
                </div>
              ))}
          </div>
        </div>

        {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}

        <div style={{ marginTop: 28 }}>
          {isHost ? (
            <button
              className="btn btn-purple"
              style={{ width: '100%' }}
              onClick={handleStart}
              disabled={room.players.length < 3}
            >
              Start Game
            </button>
          ) : (
            <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--mid-grey)' }}>
              Waiting for {room.players[0]?.name} to start the game…
            </p>
          )}
        </div>

        {/* Quick rules */}
        <div
          style={{
            marginTop: 28,
            padding: '16px 18px',
            background: 'var(--white)',
            borderRadius: 'var(--radius)',
            border: '2px solid var(--border)',
          }}
        >
          <p className="label" style={{ marginBottom: 8 }}>Quick Rules</p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Success', desc: 'If some (but not all) guess the Buyer\'s card — Buyer + correct voters each get 3 pts.' },
              { label: 'Fail', desc: 'If nobody or everyone guesses right — Buyer gets 0 pts, all others get 2 pts.' },
              { label: 'Bonus', desc: '+1 pt for every vote your decoy card receives from other players.' },
            ].map(({ label, desc }) => (
              <li key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--coral)', flexShrink: 0, paddingTop: 1 }}>{label}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--dark-grey)', lineHeight: 1.55 }}>{desc}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
