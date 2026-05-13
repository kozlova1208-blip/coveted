import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

const EMOJIS = [
  '👑','💎','🌸','🦋','💐','🌺','✨','🎀',
  '💫','🌙','⭐','🦚','🌿','🍋','🫧','🪩',
  '💅','🧿','🦩','🌈','🍓','🪷','🫶','🎭',
  '🐚','🪸','🌊','🦜','🍄','🫐','🌻','🎪',
];

/* ── Tiny inline flower SVG ─────────────────────────────────────────────── */
function Flower({ x, y, size = 36, color = '#FF6B6B', centerColor = '#FFD166', rotate = 0, opacity = 0.82 }) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate})`} opacity={opacity}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx={0} cy={-size * 0.52} rx={size * 0.21} ry={size * 0.38} fill={color} transform={`rotate(${a})`} />
      ))}
      <circle cx={0} cy={0} r={size * 0.22} fill={centerColor} />
    </g>
  );
}

function HeroFlowers() {
  return (
    <div className="flowers-bg">
      <svg width="100%" height="100%" viewBox="0 0 420 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <Flower x={390} y={55}  size={52} color="#FF6B6B" centerColor="#FFD166" rotate={18} />
        <Flower x={340} y={18}  size={28} color="#00C9C8" centerColor="#FF99C8" rotate={-12} opacity={0.65} />
        <Flower x={18}  y={38}  size={44} color="#9B5DE5" centerColor="#FFD166" rotate={-25} />
        <Flower x={52}  y={8}   size={22} color="#06D6A0" centerColor="#FF6B6B" rotate={10}  opacity={0.6} />
        <Flower x={20}  y={320} size={48} color="#FF99C8" centerColor="#FFD166" rotate={5} />
        <Flower x={65}  y={345} size={22} color="#F4845F" centerColor="#FFD166" rotate={-8}  opacity={0.65} />
        <Flower x={400} y={330} size={46} color="#06D6A0" centerColor="#FFD166" rotate={-15} />
        <Flower x={360} y={350} size={24} color="#9B5DE5" centerColor="#FF99C8" rotate={20}  opacity={0.6} />
        <Flower x={8}   y={190} size={20} color="#FF6B6B" centerColor="#FFD166" rotate={30}  opacity={0.5} />
        <Flower x={412} y={170} size={20} color="#00C9C8" centerColor="#FFD166" rotate={-30} opacity={0.5} />
      </svg>
    </div>
  );
}

const STEP_COLORS = ['#FF6B6B', '#9B5DE5', '#00C9C8', '#F4845F'];

export default function Home() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const [tab, setTab] = useState('create');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('coveted:name');
    if (saved) {
      // If saved name starts with an emoji, split it out
      const first = [...saved][0];
      if (first && first.codePointAt(0) > 127) {
        setEmoji(first);
        setName(saved.slice(first.length).trimStart());
      } else {
        setName(saved);
      }
    }
  }, []);

  function buildDisplayName() {
    return emoji ? `${emoji} ${name.trim()}` : name.trim();
  }

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Enter your name');
    if (!connected) return setError('Connecting to server…');
    setError('');
    setLoading(true);
    const displayName = buildDisplayName();
    sessionStorage.setItem('coveted:name', displayName);
    socket.emit('create-room', { name: displayName }, (res) => {
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
    const displayName = buildDisplayName();
    sessionStorage.setItem('coveted:name', displayName);
    socket.emit('join-room', { code: code.trim().toUpperCase(), name: displayName }, (res) => {
      setLoading(false);
      if (!res.success) return setError(res.error || 'Failed to join room');
      sessionStorage.setItem('coveted:room', res.code);
      navigate(`/room/${res.code}`, { state: { room: res.room } });
    });
  }

  return (
    <div className="page" style={{ background: 'var(--cream)' }}>

      {/* ── Hero ── */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '64px 20px 52px',
          textAlign: 'center',
          background: 'var(--cream)',
          borderBottom: '2px solid var(--border)',
        }}
      >
        <HeroFlowers />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="phase-badge" style={{ display: 'inline-flex', marginBottom: 20 }}>
            <span className="phase-dot" />
            A luxury fashion game
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(3rem, 10vw, 5.5rem)',
              fontWeight: 400,
              lineHeight: 1,
              color: 'var(--black)',
              marginBottom: 18,
            }}
          >
            Luxit
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--dark-grey)', maxWidth: 300, margin: '0 auto', lineHeight: 1.65 }}>
            Give a clue. Pick the card. Fool your friends.
            <br />3–9 players.
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="container" style={{ flex: 1, padding: '36px 20px' }}>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 28,
            background: 'var(--light)',
            borderRadius: 100,
            padding: 4,
          }}
        >
          {['create', 'join'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: tab === t ? 'var(--white)' : 'transparent',
                border: 'none',
                borderRadius: 100,
                color: tab === t ? 'var(--black)' : 'var(--mid-grey)',
                boxShadow: tab === t ? 'var(--shadow)' : 'none',
                transition: 'all 0.18s',
              }}
            >
              {t === 'create' ? 'New Room' : 'Join Room'}
            </button>
          ))}
        </div>

        <form onSubmit={tab === 'create' ? handleCreate : handleJoin}>

          {/* ── Emoji picker ── */}
          <div style={{ marginBottom: 20 }}>
            <label className="label">Your Icon</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Current selection / toggle button */}
              <button
                type="button"
                onClick={() => setEmojiOpen((o) => !o)}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  border: `2px solid ${emojiOpen ? 'var(--purple)' : 'var(--border)'}`,
                  background: 'var(--white)',
                  fontSize: emoji ? '1.5rem' : '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'border-color 0.15s',
                }}
                aria-label="Choose an icon"
              >
                {emoji || '＋'}
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--mid-grey)' }}>
                {emoji ? 'Tap to change' : 'Pick an icon (optional)'}
              </span>
              {emoji && (
                <button
                  type="button"
                  onClick={() => setEmoji('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.72rem',
                    color: 'var(--mid-grey)',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: 100,
                  }}
                >
                  Remove
                </button>
              )}
            </div>

            {/* Emoji grid */}
            {emojiOpen && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  background: 'var(--white)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8, 1fr)',
                  gap: 4,
                }}
              >
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { setEmoji(e); setEmojiOpen(false); }}
                    style={{
                      background: emoji === e ? 'var(--light)' : 'transparent',
                      border: emoji === e ? '2px solid var(--purple)' : '2px solid transparent',
                      borderRadius: 8,
                      fontSize: '1.4rem',
                      padding: '4px',
                      cursor: 'pointer',
                      lineHeight: 1,
                      transition: 'background 0.1s',
                    }}
                    aria-label={e}
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Name input */}
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
                style={{ letterSpacing: '0.2em', fontWeight: 600, fontSize: '1.15rem', textAlign: 'center' }}
              />
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}

          <button
            type="submit"
            className="btn btn-coral"
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
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--mid-grey)', marginTop: 10 }}>
              Connecting to server…
            </p>
          )}
        </form>

        {/* How to play */}
        <hr className="divider" style={{ margin: '36px 0 24px' }} />
        <p className="label" style={{ marginBottom: 16 }}>How to play</p>
        <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            "One player is the Buyer. They see a luxury item and write a clue — a word, a vibe, or a phrase. The trick? Don't be too obvious — if everyone guesses your card, you score nothing. But don't be too cryptic either — if nobody guesses it, you score nothing too. Aim for that sweet spot.",
            "Everyone else picks a card from their hand that best matches the clue. Choose wisely — you want your card to be close enough to the clue that other players mistake it for the Buyer's, and vote for yours instead.",
            "Cards are revealed anonymously. Vote for the Buyer's card.",
            "Score points for correct guesses — and for fooling others with your decoys.",
          ].map((step, i) => (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span
                style={{
                  flexShrink: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: STEP_COLORS[i],
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 2,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: '0.83rem', color: 'var(--dark-grey)', lineHeight: 1.55 }}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
