import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

export default function Lobby() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket();

  // Use navigation state for the instant-join case; null triggers rejoin on refresh
  const [room, setRoom] = useState(location.state?.room ?? null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

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

    // Page-refresh recovery: socket has a new ID, use name-based reconnect
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
    <div className="page" style={{ background: 'var(--white)' }}>
      <header className="site-header">
        <span className="wordmark">Luxit</span>
        <span className="phase-badge">
          <span className="phase-dot" />
          Lobby
        </span>
      </header>

      <div className="container" style={{ padding: '32px 20px', flex: 1 }}>
        {/* Room code */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p className="label" style={{ marginBottom: 12 }}>Room Code</p>
          <button
            onClick={copyCode}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 10vw, 3.5rem)',
                letterSpacing: '0.2em',
                
                color: 'var(--black)',
              }}
            >
              {code}
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--mid-grey)',
                border: '1px solid var(--border)',
                padding: '2px 8px',
                borderRadius: 20,
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
          <p style={{ fontSize: '0.78rem', color: 'var(--mid-grey)', marginTop: 6 }}>
            Share this code with friends to join
          </p>
        </div>

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
              Players — {room.players.length} / 8
            </p>
            <span style={{ fontSize: '0.72rem', color: room.players.length < 3 ? '#c0392b' : 'var(--mid-grey)' }}>
              {room.players.length < 3 ? `Need ${3 - room.players.length} more` : 'Ready to play'}
            </span>
          </div>

          <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
            {room.players.map((player, i) => (
              <div
                key={player.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom: i < room.players.length - 1 ? '1px solid var(--border)' : 'none',
                  background: player.id === myId ? 'var(--off-white)' : 'var(--white)',
                }}
              >
                <div
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--black)', color: 'var(--white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 500, flexShrink: 0,
                  }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.92rem' }}>{player.name}</span>
                  {player.id === myId && (
                    <span style={{ marginLeft: 8, fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--mid-grey)', textTransform: 'uppercase' }}>
                      You
                    </span>
                  )}
                </div>
                {i === 0 && <span className="tag">Host</span>}
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
                  <div style={{ width: 32, height: 32, borderRadius: '50%', border: '1px dashed var(--border)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--mid-grey)' }}>Waiting…</span>
                </div>
              ))}
          </div>
        </div>

        {error && <p className="error-msg" style={{ marginTop: 12 }}>{error}</p>}

        <div style={{ marginTop: 32 }}>
          {isHost ? (
            <button
              className="btn"
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

        <div
          style={{
            marginTop: 32,
            padding: '16px',
            background: 'var(--off-white)',
            borderRadius: 4,
            border: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--mid-grey)', marginBottom: 8 }}>
            Quick Rules
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--dark-grey)', lineHeight: 1.6 }}>
            The Buyer gives a clue for their item. Everyone else picks a card from their
            hand. You vote for the Buyer's card. Earn points by finding the right card —
            and by fooling others with your decoys.
          </p>
        </div>
      </div>
    </div>
  );
}
