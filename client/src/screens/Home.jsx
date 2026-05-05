import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

export default function Home() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const [tab, setTab] = useState('create'); // 'create' | 'join'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Restore saved name
  useEffect(() => {
    const saved = sessionStorage.getItem('coveted:name');
    if (saved) setName(saved);
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    if (!connected) return setError('Connecting to server…');
    setError('');
    setLoading(true);
    sessionStorage.setItem('coveted:name', name.trim());

    socket.emit('create-room', { name: name.trim() }, (res) => {
      setLoading(false);
      if (!res.success) return setError(res.error || 'Failed to create room');
      sessionStorage.setItem('coveted:room', res.code);
      navigate(`/room/${res.code}`, { state: { room: res.room } });
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    if (!code.trim()) return setError('Enter a room code');
    if (!connected) return setError('Connecting to server…');
    setError('');
    setLoading(true);
    sessionStorage.setItem('coveted:name', name.trim());

    socket.emit('join-room', { code: code.trim().toUpperCase(), name: name.trim() }, (res) => {
      setLoading(false);
      if (!res.success) return setError(res.error || 'Failed to join room');
      sessionStorage.setItem('coveted:room', res.code);
      navigate(`/room/${res.code}`, { state: { room: res.room } });
    });
  }

  return (
    <div className="page" style={{ background: 'var(--white)' }}>
      {/* Hero */}
      <div
        style={{
          borderBottom: '1px solid var(--border)',
          padding: '60px 20px 48px',
          textAlign: 'center',
          background: 'var(--white)',
        }}
      >
        <p
          style={{
            fontSize: '0.65rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'var(--mid-grey)',
            marginBottom: 16,
          }}
        >
          A luxury fashion association game
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.8rem, 8vw, 5rem)',
            fontStyle: 'italic',
            fontWeight: 400,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            color: 'var(--black)',
            marginBottom: 20,
          }}
        >
          Coveted
        </h1>
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--dark-grey)',
            maxWidth: 340,
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Give a clue. Pick the card. Fool your friends.
          <br />3 – 8 players.
        </p>
      </div>

      {/* Form */}
      <div
        className="container"
        style={{
          flex: 1,
          padding: '40px 20px',
        }}
      >
        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border)',
            marginBottom: 32,
          }}
        >
          {['create', 'join'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '0.7rem',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'none',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--black)' : '2px solid transparent',
                marginBottom: -1,
                color: tab === t ? 'var(--black)' : 'var(--mid-grey)',
                transition: 'color 0.15s',
              }}
            >
              {t === 'create' ? 'New Room' : 'Join Room'}
            </button>
          ))}
        </div>

        <form onSubmit={tab === 'create' ? handleCreate : handleJoin}>
          <div style={{ marginBottom: 20 }}>
            <label className="label" htmlFor="player-name">Your Name</label>
            <input
              id="player-name"
              className="input"
              type="text"
              placeholder="e.g. Margaux"
              maxLength={20}
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
            />
          </div>

          {tab === 'join' && (
            <div style={{ marginBottom: 20 }}>
              <label className="label" htmlFor="room-code">Room Code</label>
              <input
                id="room-code"
                className="input"
                type="text"
                placeholder="e.g. ABCD"
                maxLength={4}
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                style={{ letterSpacing: '0.2em', fontWeight: 500, fontSize: '1.1rem' }}
              />
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            className="btn"
            disabled={loading || !connected}
            style={{ width: '100%', marginTop: 24 }}
          >
            {loading
              ? 'Please wait…'
              : tab === 'create'
              ? 'Create Room'
              : 'Join Room'}
          </button>

          {!connected && (
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--mid-grey)',
                marginTop: 12,
              }}
            >
              Connecting to server…
            </p>
          )}
        </form>

        {/* How to play */}
        <hr className="divider" style={{ margin: '40px 0 28px' }} />
        <p
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--mid-grey)',
            marginBottom: 16,
          }}
        >
          How to play
        </p>
        <ol
          style={{
            paddingLeft: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {[
            'One player is the Buyer. They see a luxury item and write a clue — a word, vibe, or phrase.',
            'Everyone else picks a card from their hand that best matches the clue.',
            'Cards are revealed anonymously. Vote for the Buyer\'s card.',
            'Score points for correct guesses — and for fooling others with your decoys.',
          ].map((step, i) => (
            <li
              key={i}
              style={{ fontSize: '0.83rem', color: 'var(--dark-grey)', lineHeight: 1.5 }}
            >
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
