import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';

/* ─── Data ─────────────────────────────────────────────────────────────── */
const EMOJIS = [
  '👑','💎','🌸','🦋','💐','🌺','✨','🎀',
  '💫','🌙','⭐','🦚','🌿','🍋','🫧','🪩',
  '💅','🧿','🦩','🌈','🍓','🪷','🫶','🎭',
  '🐚','🪸','🌊','🦜','🍄','🫐','🌻','🎪',
];

const LUXIT_COLORS = ['#E63329', '#F5B800', '#3B5BDB', '#FF6B35', '#E91E8C'];
const STEP_COLORS  = ['#E63329', '#3B5BDB', '#F5B800', '#FF6B35'];

/* ─── 4-pointed sparkle ─────────────────────────────────────────────────── */
function Sparkle({ x, y, size = 14, color = '#F5B800' }) {
  const t = size * 0.2;
  const d = `M0,${-size} L${t},${-t} L${size},0 L${t},${t} L0,${size} L${-t},${t} L${-size},0 L${-t},${-t}Z`;
  return <path d={d} fill={color} transform={`translate(${x},${y})`} />;
}

/* ─── Left figure: brunette, pink top, red skirt, yellow bag ────────────── */
function FigureLeft() {
  return (
    <svg viewBox="0 0 130 530" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}>

      {/* Long dark-brown hair strands — stop at skirt waist (y=147) */}
      <rect x="39" y="22" width="14" height="125" rx="7" fill="#5C3215" />
      <rect x="77" y="22" width="14" height="125" rx="7" fill="#5C3215" />

      {/* Head */}
      <ellipse cx="65" cy="52" rx="21" ry="24" fill="#F5C09A" />

      {/* Hair cap (top of head) */}
      <ellipse cx="65" cy="28" rx="26" ry="18" fill="#5C3215" />
      <rect x="39" y="22" width="52" height="22" fill="#5C3215" />

      {/* Rosy cheeks */}
      <ellipse cx="50" cy="58" rx="7" ry="5" fill="#FFB0A0" opacity="0.45" />
      <ellipse cx="80" cy="58" rx="7" ry="5" fill="#FFB0A0" opacity="0.45" />

      {/* Eyes */}
      <ellipse cx="58" cy="50" rx="2.5" ry="3" fill="#1A0A05" />
      <ellipse cx="72" cy="50" rx="2.5" ry="3" fill="#1A0A05" />

      {/* Smile */}
      <path d="M60,63 Q65,69 70,63" stroke="#C05050" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="61" y="74" width="8" height="15" fill="#F5C09A" />

      {/* Shoulder straps */}
      <rect x="57" y="76" width="3" height="8" rx="1.5" fill="#2A2A2A" />
      <rect x="70" y="76" width="3" height="8" rx="1.5" fill="#2A2A2A" />

      {/* Pink sleeveless top */}
      <path d="M46,87 L84,87 L81,147 L49,147 Z" fill="#F9C8D4" />

      {/* Red A-line skirt */}
      <path d="M44,147 L86,147 L105,258 L25,258 Z" fill="#D42B20" />


      {/* Legs — very long, thin */}
      <rect x="49" y="258" width="12" height="232" rx="6" fill="#F5C09A" />
      <rect x="69" y="258" width="12" height="232" rx="6" fill="#F5C09A" />

      {/* Shoes — solid black pointed triangles */}
      <polygon points="48,488 63,488 54,514" fill="#1A1A1A" />
      <polygon points="67,488 82,488 73,514" fill="#1A1A1A" />
    </svg>
  );
}

/* ─── Right figure: blonde, sunglasses, breton stripes, cobalt skirt ────── */
function FigureRight() {
  return (
    <svg viewBox="0 0 130 530" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}>

      {/* Long blonde hair strands — stop at skirt top (y=146) */}
      <rect x="22" y="20" width="14" height="126" rx="7" fill="#D4B030" opacity="0.85" />
      <rect x="94" y="20" width="14" height="126" rx="7" fill="#D4B030" opacity="0.85" />

      {/* Head */}
      <ellipse cx="65" cy="52" rx="21" ry="24" fill="#F5C09A" />

      {/* Blonde hair cap */}
      <ellipse cx="65" cy="26" rx="28" ry="19" fill="#D4B030" />
      <rect x="37" y="19" width="56" height="24" fill="#D4B030" />

      {/* Rosy cheeks */}
      <ellipse cx="50" cy="60" rx="7" ry="5" fill="#FFB0A0" opacity="0.38" />
      <ellipse cx="80" cy="60" rx="7" ry="5" fill="#FFB0A0" opacity="0.38" />

      {/* Rectangular sunglasses */}
      <rect x="47" y="46" width="15" height="9" rx="3" fill="#111" />
      <rect x="65" y="46" width="15" height="9" rx="3" fill="#111" />
      <rect x="62" y="49" width="3" height="2.5" fill="#111" />   {/* bridge */}
      <rect x="41" y="49" width="6" height="2" fill="#111" />     {/* left arm */}
      <rect x="80" y="49" width="6" height="2" fill="#111" />     {/* right arm */}

      {/* Pink lips */}
      <path d="M59,64 Q65,70 71,64" stroke="#E040A0" strokeWidth="1.8" strokeLinecap="round" fill="none" />

      {/* Neck */}
      <rect x="61" y="74" width="8" height="15" fill="#F5C09A" />

      {/* Breton-stripe top — white base + black stripes */}
      <rect x="35" y="88" width="60" height="58" rx="2" fill="white" />
      {[0,1,2,3,4,5,6,7,8].map((i) => (
        <rect key={i} x="35" y={88 + i * 6.4} width="60" height="3.2" fill="#111" />
      ))}

      {/* Cobalt blue A-line skirt */}
      <path d="M33,146 L97,146 L112,258 L18,258 Z" fill="#2B5CE6" />

      {/* Bag strap from left edge of skirt → bag */}
      <line x1="31" y1="160" x2="10" y2="210" stroke="#444" strokeWidth="1.8" strokeLinecap="round" />
      {/* Full circle clasp where strap meets skirt edge */}
      <circle cx="31" cy="160" r="4.5" fill="#2B5CE6" stroke="#1A44B8" strokeWidth="1" />
      {/* Yellow bag with red stripe */}
      <rect x="1" y="209" width="24" height="18" rx="3" fill="#F5B800" />
      <rect x="1" y="209" width="24" height="5" rx="2" fill="#D42B20" />

      {/* Legs — very long, thin */}
      <rect x="49" y="258" width="12" height="232" rx="6" fill="#F5C09A" />
      <rect x="69" y="258" width="12" height="232" rx="6" fill="#F5C09A" />

      {/* Dots on both legs */}
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={`dl${i}`} cx="55" cy={276 + i * 21} r="2" fill="#555" opacity="0.38" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <circle key={`dr${i}`} cx="75" cy={276 + i * 21} r="2" fill="#555" opacity="0.38" />
      ))}

      {/* Shoes — solid black pointed triangles */}
      <polygon points="48,488 63,488 54,514" fill="#1A1A1A" />
      <polygon points="67,488 82,488 73,514" fill="#1A1A1A" />
    </svg>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { socket, connected } = useSocket();

  const joinCodeFromUrl = searchParams.get('join')?.toUpperCase() ?? '';
  const [tab,       setTab]       = useState(joinCodeFromUrl ? 'join' : 'create');
  const [name,      setName]      = useState('');
  const [emoji,     setEmoji]     = useState('');
  const [code,      setCode]      = useState(joinCodeFromUrl);
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem('coveted:name');
    if (!saved) return;
    const first = [...saved][0];
    if (first && first.codePointAt(0) > 127) {
      setEmoji(first);
      setName(saved.slice(first.length).trimStart());
    } else {
      setName(saved);
    }
  }, []);

  function buildDisplayName() { return `${emoji} ${name.trim()}`; }

  function handleCreate(e) {
    e.preventDefault();
    if (!emoji)        return setError('Pick an icon');
    if (!name.trim())  return setError('Enter your name');
    if (!connected)    return setError('Connecting to server…');
    setError(''); setLoading(true);
    const dn = buildDisplayName();
    sessionStorage.setItem('coveted:name', dn);
    socket.emit('create-room', { name: dn }, (res) => {
      setLoading(false);
      if (!res.success) return setError(res.error || 'Failed to create room');
      sessionStorage.setItem('coveted:room', res.code);
      navigate(`/room/${res.code}`, { state: { room: res.room } });
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!emoji)        return setError('Pick an icon');
    if (!name.trim())  return setError('Enter your name');
    if (!code.trim())  return setError('Enter a room code');
    if (!connected)    return setError('Connecting to server…');
    setError(''); setLoading(true);
    const dn = buildDisplayName();
    sessionStorage.setItem('coveted:name', dn);
    socket.emit('join-room', { code: code.trim().toUpperCase(), name: dn }, (res) => {
      setLoading(false);
      if (!res.success) return setError(res.error || 'Failed to join room');
      sessionStorage.setItem('coveted:room', res.code);
      navigate(`/room/${res.code}`, { state: { room: res.room } });
    });
  }

  return (
    <div style={{ background: '#EDE8DF', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Full-width title ───────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: 'clamp(20px,5vw,40px) 0 12px', position: 'relative' }}>
        {/* sparkle layer */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
          viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
          <Sparkle x={30}  y={50} size={14} color="#F5B800" />
          <Sparkle x={370} y={30} size={11} color="#E91E8C" />
          <circle cx={24} cy={45} r={6} fill="#3B5BDB" opacity="0.7" />
          <circle cx={378} cy={40} r={5} fill="#E63329" opacity="0.6" />
        </svg>

        <h1
          aria-label="Luxit"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 'clamp(3.2rem, 15vw, 8rem)',
            fontWeight: 900, lineHeight: 0.92,
            letterSpacing: '-0.02em', margin: 0,
            position: 'relative', zIndex: 1,
          }}
        >
          {'LUXIT'.split('').map((l, i) => (
            <span key={i} style={{ color: LUXIT_COLORS[i] }}>{l}</span>
          ))}
        </h1>

        <p style={{
          marginTop: 10,
          fontSize: 'clamp(0.52rem, 1.8vw, 0.68rem)',
          fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#7A7268',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          position: 'relative', zIndex: 1,
        }}>
          DRESS THE DAY
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E63329', display: 'inline-block' }} />
          STYLE THE NIGHT
        </p>
      </div>

      {/* ── Scrollable centre: form + rules ───────────────────────────── */}
      {/* Horizontal padding keeps content clear of fixed figures on both sides */}
      <div style={{
        flex: 1,
        padding: '8px clamp(76px, 18vw, 140px) clamp(200px, 38vh, 300px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Form card */}
        <div style={{
          background: 'white',
          borderRadius: 18,
          padding: 'clamp(14px, 3vw, 24px)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
          maxWidth: 340,
          width: '100%',
        }}>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#F5F0EA', borderRadius: 100, padding: 4 }}>
            {['create', 'join'].map((t) => (
              <button key={t} type="button"
                onClick={() => { setTab(t); setError(''); }}
                style={{
                  flex: 1, padding: '9px 4px',
                  fontSize: '0.65rem', fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  background: tab === t ? 'white' : 'transparent',
                  border: 'none', borderRadius: 100,
                  color: tab === t ? '#1a1a1a' : '#999',
                  boxShadow: tab === t ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s', cursor: 'pointer',
                }}
              >
                {t === 'create' ? 'New Room' : 'Join Room'}
              </button>
            ))}
          </div>

          <form onSubmit={tab === 'create' ? handleCreate : handleJoin}>

            {/* Icon + Name row */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 7 }}>
                Icon &amp; Name
              </label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <button type="button" onClick={() => setEmojiOpen((o) => !o)}
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: `2px solid ${emojiOpen ? '#3B5BDB' : error === 'Pick an icon' ? '#E63329' : emoji ? '#3B5BDB' : '#E8E0D6'}`,
                    background: '#FAFAFA', fontSize: emoji ? '1.5rem' : '1rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'border-color 0.15s',
                  }}
                >
                  {emoji || '＋'}
                </button>
                <input className="input" type="text" placeholder="Your name"
                  maxLength={20} value={name}
                  onChange={(e) => { setName(e.target.value); setError(''); }}
                  style={{ flex: 1, height: 48, fontSize: '0.9rem' }}
                />
              </div>

              {/* Emoji grid */}
              {emojiOpen && (
                <div style={{
                  marginTop: 8, padding: 10,
                  background: 'white', border: '2px solid #E8E0D6', borderRadius: 12,
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: 4,
                }}>
                  {EMOJIS.map((e) => (
                    <button key={e} type="button"
                      onClick={() => { setEmoji(e); setEmojiOpen(false); setError(''); }}
                      style={{
                        background: emoji === e ? '#EEF0FF' : 'transparent',
                        border: `2px solid ${emoji === e ? '#3B5BDB' : 'transparent'}`,
                        borderRadius: 7, fontSize: '1.25rem', padding: '3px',
                        cursor: 'pointer', lineHeight: 1,
                      }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Room code — join only */}
            {tab === 'join' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#888', display: 'block', marginBottom: 7 }}>
                  Room Code
                </label>
                <input className="input" type="text" placeholder="ABCD"
                  maxLength={4} value={code}
                  onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); }}
                  style={{ letterSpacing: '0.24em', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}
                />
              </div>
            )}

            {error && <p style={{ fontSize: '0.78rem', color: '#E63329', marginBottom: 10 }}>{error}</p>}

            <button type="submit" disabled={loading || !connected}
              style={{
                width: '100%', padding: '13px',
                fontSize: '0.72rem', fontWeight: 800,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                border: 'none', borderRadius: 100,
                background: tab === 'create' ? '#E63329' : '#3B5BDB',
                color: 'white', cursor: loading || !connected ? 'not-allowed' : 'pointer',
                opacity: loading || !connected ? 0.45 : 1,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              {loading ? 'Please wait…' : tab === 'create' ? 'Create Room' : 'Join Room'}
            </button>

            {!connected && (
              <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#aaa', marginTop: 8 }}>
                Connecting to server…
              </p>
            )}
          </form>

          {/* How to play — always visible */}
          <div style={{ marginTop: 16, borderTop: '1.5px dashed #E8E0D6', paddingTop: 14 }}>
            <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', marginBottom: 12 }}>
              How to play
            </p>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                "One player is the Buyer. They see a luxury item and write a clue — a word, a vibe, or a phrase. Don't be too obvious (everyone guesses = 0 pts) or too cryptic (nobody guesses = 0 pts). Aim for the sweet spot.",
                "Everyone else picks a card from their hand that best matches the clue. Make others vote for yours instead of the Buyer's.",
                "Cards are revealed anonymously. Vote for the Buyer's card.",
                "Score points for correct guesses — and for fooling others with your decoys.",
              ].map((step, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                    background: STEP_COLORS[i], color: 'white',
                    fontSize: '0.6rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#555', lineHeight: 1.5 }}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Decorative label */}
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9088' }}>
          3–9 PLAYERS · FASHION · GAME
        </p>
      </div>

      {/* ── Left figure — FIXED, never moves ──────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0,
        width: 'clamp(72px, 17vw, 130px)',
        zIndex: 1, pointerEvents: 'none',
      }}>
        <FigureLeft />
      </div>

      {/* ── Right figure — FIXED, never moves ─────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, right: 0,
        width: 'clamp(72px, 17vw, 130px)',
        zIndex: 1, pointerEvents: 'none',
      }}>
        <FigureRight />
      </div>

      {/* Sparkles bottom strip */}
      <svg style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', height: 80, pointerEvents: 'none', zIndex: 0 }}
        viewBox="0 0 400 80" preserveAspectRatio="xMidYMax meet">
        <Sparkle x={55}  y={30} size={16} color="#F5B800" />
        <Sparkle x={348} y={22} size={14} color="#E91E8C" />
        <circle cx={20}  cy={55} r={7}   fill="#3B5BDB" opacity="0.6" />
        <circle cx={380} cy={50} r={5}   fill="#E63329" opacity="0.55" />
      </svg>
    </div>
  );
}
