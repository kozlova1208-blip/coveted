import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import Card from '../components/Card';
import Timer from '../components/Timer';

const PHASE_LABELS = {
  clue: 'Giving a Clue',
  picking: 'Picking Cards',
  voting: 'Voting',
  results: 'Round Results',
};

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

  // Reset selection state on phase change
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

    socket.on('room-update', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    // Page-refresh recovery
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

  return (
    <div className="page" style={{ background: 'var(--white)', minHeight: '100dvh' }}>
      {/* Header */}
      <header className="site-header">
        <span className="wordmark">Luxit</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="phase-badge">
            <span className="phase-dot" />
            {PHASE_LABELS[room.status] ?? room.status}
          </span>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--mid-grey)',
              letterSpacing: '0.04em',
            }}
          >
            {room.round + 1} / {room.maxRounds}
          </span>
        </div>
      </header>

      {/* Scoreboard strip */}
      <div
        style={{
          overflowX: 'auto',
          borderBottom: '1px solid var(--border)',
          background: 'var(--off-white)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 0,
            minWidth: 'max-content',
          }}
        >
          {room.players.map((p) => (
            <div
              key={p.id}
              style={{
                padding: '10px 18px',
                borderRight: '1px solid var(--border)',
                textAlign: 'center',
                background: p.id === myId ? 'var(--white)' : 'transparent',
                minWidth: 80,
              }}
            >
              <p
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: p.id === room.buyerId ? 'var(--black)' : 'var(--mid-grey)',
                  fontWeight: p.id === room.buyerId ? 600 : 400,
                  marginBottom: 2,
                  whiteSpace: 'nowrap',
                  maxWidth: 80,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {p.name}
                {p.id === room.buyerId && ' ★'}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.1rem',
                  color: 'var(--black)',
                }}
              >
                {room.scores[p.id] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 120px' }}>
        <div className="container">
          {/* ── CLUE PHASE ── */}
          {room.status === 'clue' && (
            <CluePhase
              isBuyer={isBuyer}
              buyer={buyer}
              hand={room.hand}
              clueInput={clueInput}
              setClueInput={setClueInput}
              submitted={submitted}
              onSubmit={submitClue}
              phaseStartTime={room.phaseStartTime}
              phaseDuration={room.phaseDuration}
            />
          )}

          {/* ── PICKING PHASE ── */}
          {room.status === 'picking' && (
            <PickingPhase
              isBuyer={isBuyer}
              clue={room.clue}
              buyer={buyer}
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

          {/* ── VOTING PHASE ── */}
          {room.status === 'voting' && (
            <VotingPhase
              isBuyer={isBuyer}
              clue={room.clue}
              buyer={buyer}
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

          {/* ── RESULTS PHASE ── */}
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

function CluePhase({ isBuyer, buyer, hand, clueInput, setClueInput, submitted, onSubmit, phaseStartTime, phaseDuration }) {
  const myCard = hand?.[0];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Timer phaseStartTime={phaseStartTime} phaseDuration={phaseDuration} />
      </div>

      {isBuyer ? (
        <>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 6 }}>Your card</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--mid-grey)', marginBottom: 24 }}>
            Write a clue that hints at your item without giving it away.
          </p>

          {myCard && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <Card card={myCard} showDetails />
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
            <button
              type="submit"
              className="btn"
              style={{ width: '100%' }}
              disabled={!clueInput.trim() || submitted}
            >
              {submitted ? 'Clue Submitted ✓' : 'Submit Clue'}
            </button>
          </form>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>
            {buyer?.name} is thinking…
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: 32 }}>
            They're crafting a clue for their mystery item.
          </p>
          <div
            style={{
              display: 'inline-flex',
              gap: 6,
              alignItems: 'center',
              padding: '14px 24px',
              background: 'var(--off-white)',
              border: '1px solid var(--border)',
              borderRadius: 4,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--mid-grey)',
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PickingPhase({
  isBuyer, clue, buyer, hand, selectedCard, setSelectedCard,
  submitted, onPlay, tableCount, totalPickers, phaseStartTime, phaseDuration
}) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Timer phaseStartTime={phaseStartTime} phaseDuration={phaseDuration} />
      </div>

      {/* Clue banner */}
      <div
        style={{
          textAlign: 'center',
          padding: '20px',
          background: 'var(--off-white)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          marginBottom: 28,
        }}
      >
        <p className="label" style={{ marginBottom: 8 }}>
          {buyer?.name}'s Clue
        </p>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.2rem, 4vw, 2rem)',
            
            letterSpacing: '0.02em',
          }}
        >
          "{clue}"
        </p>
      </div>

      {isBuyer ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: 8 }}>
            Others are picking their cards…
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--mid-grey)' }}>
            {tableCount} of {totalPickers} submitted
          </p>
          <ProgressDots done={tableCount} total={totalPickers} />
        </div>
      ) : submitted ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--dark-grey)', marginBottom: 6 }}>
            Card submitted ✓
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--mid-grey)' }}>
            Waiting for others… {tableCount} of {totalPickers} submitted
          </p>
          <ProgressDots done={tableCount} total={totalPickers} />
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Pick your card</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--mid-grey)', marginBottom: 20 }}>
            Choose the one that best matches the clue.
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 16,
              scrollSnapType: 'x mandatory',
            }}
          >
            {hand?.map((card) => (
              <div key={card.id} style={{ scrollSnapAlign: 'start' }}>
                <Card
                  card={card}
                  selected={selectedCard?.id === card.id}
                  onClick={(c) => setSelectedCard(c)}
                  showDetails
                />
              </div>
            ))}
          </div>

          <button
            className="btn"
            style={{ width: '100%', marginTop: 16 }}
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

function VotingPhase({
  isBuyer, clue, buyer, tableCards, voteCard, setVoteCard,
  submitted, onVote, votesCount, totalVoters, phaseStartTime, phaseDuration
}) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Timer phaseStartTime={phaseStartTime} phaseDuration={phaseDuration} />
      </div>

      {/* Clue banner */}
      <div
        style={{
          textAlign: 'center',
          padding: '16px',
          background: 'var(--off-white)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          marginBottom: 28,
        }}
      >
        <p className="label" style={{ marginBottom: 6 }}>The Clue</p>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.4rem',
            
          }}
        >
          "{clue}"
        </p>
      </div>

      {isBuyer ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--mid-grey)', marginBottom: 8 }}>
            Everyone is voting… you sit this one out.
          </p>
          <ProgressDots done={votesCount} total={totalVoters} />
          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 16,
              marginTop: 20,
              justifyContent: tableCards.length <= 3 ? 'center' : 'flex-start',
            }}
          >
            {tableCards.map((t) => (
              <Card key={t.cardId} card={t.card} compact />
            ))}
          </div>
        </div>
      ) : submitted ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--dark-grey)', marginBottom: 6 }}>
            Vote submitted ✓
          </p>
          <ProgressDots done={votesCount} total={totalVoters} />
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 6 }}>Which is the Buyer's card?</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--mid-grey)', marginBottom: 20 }}>
            Tap a card to select, then confirm your vote.
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 16,
              scrollSnapType: 'x mandatory',
            }}
          >
            {tableCards.map((t) => (
              <div key={t.cardId} style={{ scrollSnapAlign: 'start' }}>
                <Card
                  card={t.card}
                  selected={voteCard?.cardId === t.cardId}
                  onClick={() => setVoteCard(t)}
                  showDetails
                />
              </div>
            ))}
          </div>

          <button
            className="btn"
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
  const isBuyer = myId === room.buyerId;

  const buyerTableEntry = room.tableCards?.find((t) => t.cardId === room.buyerCardId);

  return (
    <div>
      {/* Buyer's reveal */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p className="label" style={{ marginBottom: 4 }}>{buyer?.name}'s Clue</p>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            
            marginBottom: 20,
          }}
        >
          "{room.clue}"
        </p>
        {buyerTableEntry && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Card
              card={buyerTableEntry.card}
              isBuyer
              showDetails
              votedBy={buyerTableEntry.votedBy}
            />
          </div>
        )}
      </div>

      {/* Score deltas */}
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 4,
          overflow: 'hidden',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--off-white)',
          }}
        >
          <p className="label" style={{ margin: 0 }}>Round Scores</p>
        </div>
        {room.players.map((p) => {
          const delta = room.scoreDeltas?.[p.id] ?? 0;
          return (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
                background: p.id === myId ? 'var(--off-white)' : 'var(--white)',
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--black)',
                  color: 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  marginRight: 12,
                  flexShrink: 0,
                }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ flex: 1, fontSize: '0.9rem' }}>
                {p.name}
                {p.id === room.buyerId && (
                  <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'var(--mid-grey)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Buyer
                  </span>
                )}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.1rem',
                  marginRight: 16,
                  color: 'var(--mid-grey)',
                }}
              >
                {room.scores[p.id] ?? 0}
              </span>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  color: delta > 0 ? '#27ae60' : delta < 0 ? '#c0392b' : 'var(--mid-grey)',
                  minWidth: 32,
                  textAlign: 'right',
                }}
              >
                {delta > 0 ? `+${delta}` : delta === 0 ? '–' : delta}
              </span>
            </div>
          );
        })}
      </div>

      {/* All cards reveal */}
      <p className="label" style={{ marginBottom: 14 }}>All Cards This Round</p>
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 16,
        }}
      >
        {room.tableCards?.map((t) => (
          <Card
            key={t.cardId}
            card={t.card}
            isBuyer={t.isBuyer}
            votedBy={t.votedBy}
            showDetails
            compact={room.tableCards.length > 3}
          />
        ))}
      </div>

      {/* Next round / end */}
      {isHost && (
        <button
          className="btn"
          style={{ width: '100%', marginTop: 20 }}
          onClick={onNextRound}
        >
          {room.round + 1 >= room.maxRounds ? 'View Final Scores' : 'Next Round →'}
        </button>
      )}
      {!isHost && (
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
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: i < done ? 'var(--black)' : 'var(--light-grey)',
            transition: 'background 0.3s',
          }}
        />
      ))}
    </div>
  );
}
