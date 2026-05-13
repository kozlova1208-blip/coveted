import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import Card from '../components/Card';
import Timer from '../components/Timer';
import { avatarChar } from '../utils/avatar';

const PHASE_LABELS = {
  clue:     'Giving a Clue',
  picking:  'Picking Cards',
  voting:   'Voting',
  results:  'Round Results',
};

const AVATAR_COLORS = ['#FF6B6B', '#9B5DE5', '#00C9C8', '#F4845F', '#06D6A0', '#FF99C8', '#FFD166', '#F4845F', '#00C9C8'];

export default function Game() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket();

  const [room, setRoom] = useState(location.state?.room ?? null);
  const [clueInput, setClueInput] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [voteCard, setVoteCard] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const myId = socket?.id;
  const isBuyer = room?.buyerId === myId;

  const prevStatus = useRef(null);
  useEffect(() => {
    if (!room) return;
    if (room.status !== prevStatus.current) {
      prevStatus.current = room.status;
      setSelectedCard(null);
      setVoteCard(null);
      setSubmitted(false);
      setClueInput('');
    }
    if (room.status === 'end') {
      navigate(`/end/${code}`, { state: { room } });
    }
  }, [room?.status, code, navigate]);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on('room-update', (updatedRoom) => setRoom(updatedRoom));

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
  }, [socket, connected, code, navigate]);

  function submitClue(e) {
    e.preventDefault();
    if (!clueInput.trim() || !isBuyer) return;
    setSubmitted(true);
    socket.emit('submit-clue', { code, clue: clueInput.trim() });
  }

  function playCard() {
    if (!selectedCard) return;
    setSubmitted(true);
    socket.emit('play-card', { code, cardId: selectedCard.id });
  }

  function submitVote() {
    if (!voteCard) return;
    setSubmitted(true);
    socket.emit('submit-vote', { code, cardId: voteCard.cardId });
  }

  function nextRound() {
    socket.emit('next-round', { code });
  }

  if (!room) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--mid-grey)' }}>Loading game…</p>
      </div>
    );
  }

  const buyer = room.players.find((p) => p.id === room.buyerId);
  const myPlayer = room.players.find((p) => p.id === myId);
  const nonBuyerCount = room.players.filter((p) => p.id !== room.buyerId && !p.disconnected).length;
  const isHost = room.players[0]?.id === myId;
  const buyerIndex = room.players.findIndex((p) => p.id === room.buyerId);

  return (
    <div className="page" style={{ background: 'var(--cream)', minHeight: '100dvh' }}>

      {/* Header */}
      <header className="site-header" style={{ background: 'var(--cream)' }}>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: '1.2rem', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1 }}>
          {'LUXIT'.split('').map((l, i) => (
            <span key={i} style={{ color: ['#E63329','#F5B800','#3B5BDB','#FF6B35','#E91E8C'][i] }}>{l}</span>
          ))}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="phase-badge">
            <span className="phase-dot" />
            {PHASE_LABELS[room.status] ?? room.status}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--mid-grey)', letterSpacing: '0.04em' }}>
            {room.round + 1}/{room.maxRounds}
          </span>
        </div>
      </header>

      {/* Scoreboard strip — sorted high→low */}
      <div style={{ overflowX: 'auto', borderBottom: '2px solid var(--border)', background: 'var(--white)' }}>
        <div style={{ display: 'flex', minWidth: 'max-content' }}>
          {[...room.players].sort((a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)).map((p) => {
            const origIdx = room.players.findIndex((pl) => pl.id === p.id);
            const dotColor = AVATAR_COLORS[origIdx % AVATAR_COLORS.length];
            return (
            <div
              key={p.id}
              style={{
                padding: '10px 16px',
                borderRight: '1px solid var(--border)',
                textAlign: 'center',
                background: p.id === myId ? 'var(--light)' : 'transparent',
                minWidth: 76,
              }}
            >
              {/* tiny colored avatar dot */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: dotColor,
                  margin: '0 auto 4px',
                  boxShadow: p.id === room.buyerId ? `0 0 0 2px ${dotColor}55` : 'none',
                }}
              />
              <p
                style={{
                  fontSize: '0.62rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: p.id === room.buyerId ? 'var(--black)' : 'var(--mid-grey)',
                  fontWeight: p.id === room.buyerId ? 700 : 400,
                  marginBottom: 2,
                  whiteSpace: 'nowrap',
                  maxWidth: 72,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.name}{p.id === room.buyerId && ' ★'}
              </p>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', color: 'var(--black)' }}>
                {room.scores[p.id] ?? 0}
              </p>
            </div>
          );})}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 120px' }}>
        <div className="container">

          {room.status === 'clue' && (
            <CluePhase
              isBuyer={isBuyer}
              buyer={buyer}
              buyerColor={AVATAR_COLORS[buyerIndex % AVATAR_COLORS.length]}
              hand={room.hand}
              clueInput={clueInput}
              setClueInput={setClueInput}
              submitted={submitted}
              onSubmit={submitClue}
              phaseStartTime={room.phaseStartTime}
              phaseDuration={room.phaseDuration}
            />
          )}

          {room.status === 'picking' && (
            <PickingPhase
              isBuyer={isBuyer}
              clue={room.clue}
              buyer={buyer}
              buyerColor={AVATAR_COLORS[buyerIndex % AVATAR_COLORS.length]}
              hand={room.hand}
              selectedCard={selectedCard}
              setSelectedCard={setSelectedCard}
              submitted={submitted || room.hasPlayed}
              onPlay={playCard}
              tableCount={room.tableCount}
              totalPickers={nonBuyerCount}
              phaseStartTime={room.phaseStartTime}
              phaseDuration={room.phaseDuration}
            />
          )}

          {room.status === 'voting' && (
            <VotingPhase
              isBuyer={isBuyer}
              clue={room.clue}
              buyer={buyer}
              buyerColor={AVATAR_COLORS[buyerIndex % AVATAR_COLORS.length]}
              tableCards={room.tableCards ?? []}
              voteCard={voteCard}
              setVoteCard={setVoteCard}
              submitted={submitted || room.hasVoted}
              onVote={submitVote}
              votesCount={room.votesCount}
              totalVoters={nonBuyerCount}
              phaseStartTime={room.phaseStartTime}
              phaseDuration={room.phaseDuration}
            />
          )}

          {room.status === 'results' && (
            <ResultsPhase
              room={room}
              myId={myId}
              isHost={isHost}
              onNextRound={nextRound}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Phase sub-components ─────────────────────────────────────────────────────

function ClueBanner({ label, clue }) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '20px',
        background: 'var(--light)',
        border: '2px solid var(--border)',
        borderRadius: 'var(--radius)',
        marginBottom: 24,
      }}
    >
      <p className="label" style={{ marginBottom: 8 }}>{label}</p>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.3rem, 5vw, 2.2rem)',
          lineHeight: 1.3,
        }}
      >
        &ldquo;{clue}&rdquo;
      </p>
    </div>
  );
}

function BuyerChip({ buyer, color }) {
  if (!buyer) return null;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px 6px 8px',
        background: `${color}22`,
        border: `1.5px solid ${color}55`,
        borderRadius: 100,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          width: 24, height: 24, borderRadius: '50%',
          background: color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 700,
        }}
      >
        {avatarChar(buyer.name)}
      </div>
      <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>{buyer.name}</span>
      <span style={{ fontSize: '0.65rem', color: 'var(--mid-grey)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Buyer
      </span>
    </div>
  );
}

function CluePhase({ isBuyer, buyer, buyerColor, hand, clueInput, setClueInput, submitted, onSubmit, phaseStartTime, phaseDuration }) {
  const myCard = hand?.[0];
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Timer phaseStartTime={phaseStartTime} phaseDuration={phaseDuration} />
      </div>

      {isBuyer ? (
        <>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 4 }}>Your card</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--mid-grey)', marginBottom: 24 }}>
            Write a clue that hints at your item without giving it away.
          </p>
          {myCard && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <Card card={myCard} />
            </div>
          )}
          <form onSubmit={onSubmit}>
            <label className="label" htmlFor="clue-input">Your Clue</label>
            <input
              id="clue-input"
              className="input"
              type="text"
              placeholder="e.g. 'barely there', 'quiet luxury', 'Italian summer'…"
              maxLength={60}
              value={clueInput}
              onChange={(e) => setClueInput(e.target.value)}
              disabled={submitted}
              autoFocus
              style={{ marginBottom: 6 }}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--mid-grey)', textAlign: 'right', marginBottom: 16 }}>
              {clueInput.length} / 60
            </p>
            <button type="submit" className="btn btn-purple" style={{ width: '100%' }} disabled={!clueInput.trim() || submitted}>
              {submitted ? 'Clue Submitted ✓' : 'Submit Clue'}
            </button>
          </form>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <BuyerChip buyer={buyer} color={buyerColor} />
          <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>is thinking…</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: 32 }}>
            They're crafting a clue for their mystery item.
          </p>
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', padding: '16px 28px', background: 'var(--light)', border: '2px solid var(--border)', borderRadius: 'var(--radius)' }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: AVATAR_COLORS[i],
                  animation: `pulse 1.2s ease-in-out ${i * 0.22}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PickingPhase({ isBuyer, clue, buyer, buyerColor, hand, selectedCard, setSelectedCard, submitted, onPlay, tableCount, totalPickers, phaseStartTime, phaseDuration }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Timer phaseStartTime={phaseStartTime} phaseDuration={phaseDuration} />
      </div>
      <ClueBanner label={`${buyer?.name}'s Clue`} clue={clue} />

      {isBuyer ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: 8 }}>
            Others are picking their cards…
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--mid-grey)' }}>{tableCount} of {totalPickers} submitted</p>
          <ProgressDots done={tableCount} total={totalPickers} />
        </div>
      ) : submitted ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--dark-grey)', marginBottom: 6 }}>Card submitted ✓</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--mid-grey)' }}>Waiting for others… {tableCount} of {totalPickers} submitted</p>
          <ProgressDots done={tableCount} total={totalPickers} />
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Pick your card</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--mid-grey)', marginBottom: 16 }}>
            Choose the one that best matches the clue.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            {hand?.map((card) => (
              <div key={card.id} style={{ width: 'clamp(130px, 42vw, 175px)' }}>
                <Card card={card} fill selected={selectedCard?.id === card.id} onClick={(c) => setSelectedCard(c)} />
              </div>
            ))}
          </div>
          <button
            className="btn btn-teal"
            style={{ width: '100%' }}
            disabled={!selectedCard}
            onClick={onPlay}
          >
            {selectedCard ? `Play "${selectedCard.name}"` : 'Select a Card'}
          </button>
        </>
      )}
    </div>
  );
}

function VotingPhase({ isBuyer, clue, buyer, buyerColor, tableCards, voteCard, setVoteCard, submitted, onVote, votesCount, totalVoters, phaseStartTime, phaseDuration }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Timer phaseStartTime={phaseStartTime} phaseDuration={phaseDuration} />
      </div>
      <ClueBanner label="The Clue" clue={clue} />

      {isBuyer ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: 8 }}>
            Everyone is voting… you sit this one out.
          </p>
          <ProgressDots done={votesCount} total={totalVoters} />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            {tableCards.map((t) => (
              <div key={t.cardId} style={{ width: 'clamp(130px, 42vw, 175px)' }}>
                <Card card={t.card} fill />
              </div>
            ))}
          </div>
        </div>
      ) : submitted ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--dark-grey)', marginBottom: 6 }}>Vote submitted ✓</p>
          <ProgressDots done={votesCount} total={totalVoters} />
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Which is the Buyer's card?</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--mid-grey)', marginBottom: 16 }}>
            Tap a card to select, then confirm your vote.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            {tableCards.map((t) => (
              <div key={t.cardId} style={{ width: 'clamp(130px, 42vw, 175px)' }}>
                <Card card={t.card} fill selected={voteCard?.cardId === t.cardId} onClick={() => setVoteCard(t)} />
              </div>
            ))}
          </div>
          <button
            className="btn btn-coral"
            style={{ width: '100%', marginTop: 16 }}
            disabled={!voteCard}
            onClick={onVote}
          >
            {voteCard ? `Vote for "${voteCard.card?.name}"` : 'Select a Card to Vote'}
          </button>
        </>
      )}
    </div>
  );
}

function ResultsPhase({ room, myId, isHost, onNextRound }) {
  const buyer = room.players.find((p) => p.id === room.buyerId);
  const buyerIndex = room.players.findIndex((p) => p.id === room.buyerId);
  const buyerTableEntry = room.tableCards?.find((t) => t.cardId === room.buyerCardId);

  return (
    <div>
      {/* Buyer's reveal */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p className="label" style={{ marginBottom: 4 }}>{buyer?.name}'s Clue</p>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.6rem', marginBottom: 20 }}>
          &ldquo;{room.clue}&rdquo;
        </p>
        {buyerTableEntry && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Card card={buyerTableEntry.card} votedBy={buyerTableEntry.votedBy} />
          </div>
        )}
      </div>

      {/* Leaderboard — sorted horizontal bars with round delta */}
      {(() => {
        const sorted = [...room.players].sort(
          (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
        );
        const maxScore = Math.max(...sorted.map((p) => room.scores[p.id] ?? 0), 1);
        return (
          <div style={{ marginBottom: 28 }}>
            <p className="label" style={{ marginBottom: 14 }}>Leaderboard</p>
            {sorted.map((p, i) => {
              const originalIndex = room.players.findIndex((pl) => pl.id === p.id);
              const color = AVATAR_COLORS[originalIndex % AVATAR_COLORS.length];
              const score = room.scores[p.id] ?? 0;
              const delta = room.scoreDeltas?.[p.id] ?? 0;
              const pct = Math.max((score / maxScore) * 100, 4);
              return (
                <div key={p.id} style={{ marginBottom: 10 }}>
                  {/* Name + rank + delta */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--mid-grey)', width: 14, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: p.id === myId ? 700 : 400, flex: 1 }}>
                      {p.name}
                      {p.id === myId && <span style={{ marginLeft: 5, fontSize: '0.62rem', color: 'var(--mid-grey)' }}>(you)</span>}
                    </span>
                    {delta !== 0 && (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700,
                        color: delta > 0 ? '#06D6A0' : 'var(--coral)',
                      }}>
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    )}
                  </div>
                  {/* Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 14, flexShrink: 0 }} />
                    <div style={{ flex: 1, background: 'var(--light)', borderRadius: 100, height: 26, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 100, transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.05rem', fontWeight: i === 0 ? 700 : 400, minWidth: 26, textAlign: 'right', flexShrink: 0 }}>
                      {score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* All cards */}
      <p className="label" style={{ marginBottom: 14 }}>All Cards This Round</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
        {room.tableCards?.map((t) => (
          <div key={t.cardId} style={{ width: 'clamp(130px, 42vw, 175px)' }}>
            <Card card={t.card} fill votedBy={t.votedBy} />
          </div>
        ))}
      </div>

      {isHost ? (
        <button className="btn btn-purple" style={{ width: '100%', marginTop: 20 }} onClick={onNextRound}>
          {room.round + 1 >= room.maxRounds ? 'View Final Scores' : 'Next Round →'}
        </button>
      ) : (
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--mid-grey)', marginTop: 20 }}>
          Waiting for {room.players[0]?.name} to continue…
        </p>
      )}
    </div>
  );
}

function ProgressDots({ done, total }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 9, height: 9,
            borderRadius: '50%',
            background: i < done ? 'var(--purple)' : 'var(--light-grey)',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  );
}
