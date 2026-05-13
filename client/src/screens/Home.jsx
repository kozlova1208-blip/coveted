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

/* ─── Left figure: dark hair, pink top, red skirt ───────────────────────── */
function FigureLeft() {
  return (
    <svg viewBox="0 0 130 530" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect x="48" y="32" width="8"  height="240" rx="4" fill="#2C1810" />
      <rect x="59" y="32" width="8"  height="260" rx="4" fill="#3D2314" />
      <ellipse cx="76" cy="38" rx="22" ry="26" fill="#F4C09A" />
      <ellipse cx="76" cy="18" rx="24" ry="18" fill="#2C1810" />
      <rect x="52" y="18" width="14" height="30" fill="#2C1810" />
      <ellipse cx="68" cy="36" rx="3.5" ry="4"   fill="#1A0800" />
      <ellipse cx="84" cy="36" rx="3.5" ry="4"   fill="#1A0800" />
      <circle  cx="69.5" cy="34.5" r="1.4" fill="white" />
      <circle  cx="85.5" cy="34.5" r="1.4" fill="white" />
      <path d="M66,46 Q76,53 86,46" stroke="#C07060" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="57" cy="44" rx="8" ry="5" fill="#FFB0B0" opacity="0.4" />
      <ellipse cx="95" cy="44" rx="8" ry="5" fill="#FFB0B0" opacity="0.4" />
      <rect x="69" y="62" width="14" height="15" fill="#F4C09A" />
      <path d="M44,77 L108,77 L108,130 L44,130 Z" fill="#F5A0C0" />
      <path d="M62,77 Q76,89 90,77" fill="#F5A0C0" />
      <path d="M36,130 L116,130 L126,235 L26,235 Z" fill="#D93025" />
      <rect x="112" y="142" width="16" height="14" rx="3" fill="#F5B800" />
      <path d="M115,142 Q120,133 125,142" stroke="#C49000" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="44" y="235" width="18" height="253" rx="9" fill="#F4C09A" />
      <rect x="78" y="235" width="18" height="253" rx="9" fill="#F4C09A" />
      <rect x="34" y="483" width="32" height="7"  rx="3" fill="#1A1A1A" />
      <rect x="34" y="490" width="5"  height="16" rx="2.5" fill="#1A1A1A" />
      <rect x="68" y="483" width="32" height="7"  rx="3" fill="#1A1A1A" />
      <rect x="68" y="490" width="5"  height="16" rx="2.5" fill="#1A1A1A" />
    </svg>
  );
}

/* ─── Right figure: blonde, sunglasses, striped top, blue skirt ─────────── */
function FigureRight() {
  return (
    <svg viewBox="0 0 130 530" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: '100%', display: 'block' }}>
      <rect x="18" y="28" width="10" height="200" rx="5" fill="#D4A830" opacity="0.75" />
      <rect x="100" y="28" width="10" height="215" rx="5" fill="#D4A830" opacity="0.75" />
      <ellipse cx="64" cy="36" rx="22" ry="26" fill="#F4C09A" />
      <ellipse cx="64" cy="15" rx="25" ry="18" fill="#D4A830" />
      <rect x="84" y="15" width="14" height="28" fill="#D4A830" />
      <rect x="28" y="15" width="14" height="24" fill="#D4A830" />
      <rect x="46" y="28" width="15" height="10" rx="5" fill="#111" />
      <rect x="63" y="28" width="15" height="10" rx="5" fill="#111" />
      <rect x="61" y="31" width="4"  height="2"  fill="#111" />
      <rect x="41" y="32" width="7"  height="2"  fill="#111" />
      <rect x="78" y="32" width="7"  height="2"  fill="#111" />
      <path d="M55,47 Q64,54 74,47" stroke="#C07060" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="46" cy="43" rx="8" ry="5" fill="#FFB0B0" opacity="0.35" />
      <ellipse cx="82" cy="43" rx="8" ry="5" fill="#FFB0B0" opacity="0.35" />
      <rect x="57" y="60" width="14" height="15" fill="#F4C09A" />
      <rect x="35" y="75" width="68" height="55" fill="white" />
      {[0,1,2,3,4,5].map((i) => (
        <rect key={i} x="35" y={75 + i * 9} width="68" height="4.5" fill="#111" />
      ))}
      <path d="M27,130 L101,130 L110,235 L18,235 Z" fill="#3B5BDB" />
      <rect x="4"  y="142" width="16" height="14" rx="3" fill="#F5B800" />
      <path d="M7,142 Q12,133 17,142" stroke="#C49000" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="32" y="235" width="18" height="253" rx="9" fill="#F4C09A" />
      {[0,1,2,3,4,5,6,7,8,9].map((i) => (
        <circle key={i} cx="41" cy={258 + i * 23} r="2.2" fill="#555" opacity="0.35" />
      ))}
      <rect x="66" y="235" width="18" height="253" rx="9" fill="#F4C09A" />
      <rect x="22" y="483" width="32" height="7"  rx="3" fill="#1A1A1A" />
      <rect x="22" y="490" width="5"  height="16" rx="2.5" fill="#1A1A1A" />
      <rect x="56" y="483" width="32" height="7"  rx="3" fill="#1A1A1A" />
      <rect x="56" y="490" width="5"  height="16" rx="2.5" fill="#1A1A1A" />
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
  const [rulesOpen, setRulesOpen] = useState(false);

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
          <circle cx={20} cy={90} r={6} fill="#3B5BDB" opacity="0.7" />
          <circle cx={382} cy={85} r={5} fill="#E63329" opacity="0.6" />
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

      {/* ── 3-column: figure | form | figure ──────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', minHeight: 0 }}>

        {/* Left figure */}
        <div style={{
          width: 'clamp(72px, 17vw, 130px)', flexShrink: 0,
          alignSelf: 'flex-end', overflow: 'hidden',
        }}>
          <FigureLeft />
        </div>

        {/* ── Centre: form + rules ─────────────────────────────────────── */}
        <div style={{
          flex: 1, minWidth: 0,
          overflowY: 'auto',
          padding: '8px 10px 32px',
          display: 'flex', flexDirection: 'column',
          alignSelf: 'stretch',
          justifyContent: 'center',
        }}>

          {/* Form card */}
          <div style={{
            background: 'white',
            borderRadius: 18,
            padding: 'clamp(14px, 3vw, 24px)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
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
                    display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 3,
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

            {/* How to play — collapsible */}
            <div style={{ marginTop: 16, borderTop: '1.5px dashed #E8E0D6', paddingTop: 14 }}>
              <button
                type="button"
                onClick={() => setRulesOpen((o) => !o)}
                style={{
                  width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 0,
                }}
              >
                <span style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888' }}>
                  How to play
                </span>
                <span style={{ fontSize: '0.8rem', color: '#aaa', transition: 'transform 0.2s', display: 'inline-block', transform: rulesOpen ? 'rotate(180deg)' : 'none' }}>
                  ▾
                </span>
              </button>

              {rulesOpen && (
                <ol style={{ listStyle: 'none', padding: 0, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              )}
            </div>
          </div>

          {/* Rotated side labels — purely decorative */}
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: '0.55rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9A9088' }}>
            3–9 PLAYERS · FASHION · GAME
          </p>
        </div>

        {/* Right figure */}
        <div style={{
          width: 'clamp(72px, 17vw, 130px)', flexShrink: 0,
          alignSelf: 'flex-end', overflow: 'hidden',
        }}>
          <FigureRight />
        </div>
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
