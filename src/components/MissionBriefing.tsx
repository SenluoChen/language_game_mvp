import { useState } from "react";
import { ArrowLeft, Check, Clock3, Coffee, GraduationCap } from "lucide-react";
import { cafeMission, missionBriefing } from "../data/cafeMission";
import type { GameSession, SessionRole } from "../hooks/useGameSession";

type Props = {
  session: GameSession;
  role: SessionRole;
  connection: "disconnected" | "connecting" | "connected";
  error: boolean;
  onReady: () => Promise<void>;
  onStart: () => Promise<void>;
  onExit: () => void;
};

export function MissionBriefing({
  session,
  role,
  connection,
  error,
  onReady,
  onStart,
  onExit,
}: Props) {
  const [pending, setPending] = useState(false);
  const learner = role === "learner";
  const briefing = learner ? missionBriefing.learner : missionBriefing.instructor;
  const isConnected = connection === "connected";

  async function handleAction() {
    setPending(true);
    try {
      if (learner) {
        await onReady();
      } else {
        await onStart();
      }
    } catch {
      // The session hook exposes errors to this screen.
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="briefing-screen">
      <header className="briefing-topbar">
        <button
          className="briefing-back"
          onClick={onExit}
          type="button"
          aria-label="Change role"
        >
          <ArrowLeft size={19} />
        </button>
        <span>MISSION BRIEFING</span>
        <span className="briefing-connection" aria-label={isConnected ? "Connected" : "Connecting"}>
          {isConnected ? "Connected" : "Connecting…"}
        </span>
      </header>

      <section className="briefing-content">
        <div className="briefing-hero">
          <img src={missionBriefing.imageUrl} alt="A warm Parisian cafe interior" />
          <div className="briefing-hero__shade" />
          <div className="briefing-hero__title">
            <span>FRENCH LIFE · {cafeMission.level}</span>
            <h1>{briefing.title}</h1>
          </div>
        </div>

        <p className="briefing-context">{briefing.context}</p>

        <div className="briefing-role">
          <span className="briefing-role__icon">
            {learner ? <GraduationCap size={20} /> : <Coffee size={19} />}
          </span>
          <div>
            <span className="briefing-label">YOUR ROLE</span>
            <p>{briefing.role}</p>
          </div>
        </div>

        <div className="briefing-details">
          <div className="briefing-goal">
            <span className="briefing-label">YOUR GOAL</span>
            <p>{briefing.goal}</p>
          </div>
          {!learner && (
            <ul className="briefing-rules">
              {missionBriefing.instructor.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          )}
          <div className="briefing-meta">
            <span><GraduationCap size={15} /> {cafeMission.level}</span>
            <span><Clock3 size={15} /> {cafeMission.duration}</span>
            {learner && <span>Budget €10</span>}
          </div>
        </div>

        {error && (
          <p className="briefing-error" role="alert">
            The shared mission could not be updated. Check your connection and try again.
          </p>
        )}

        {learner && session.learner_ready ? (
          <div className="briefing-waiting" role="status">
            <Check size={18} />
            <span>Waiting for Speaker to start...</span>
          </div>
        ) : (
          <button
            className="briefing-primary-action"
            disabled={
              pending ||
              !isConnected ||
              (learner ? session.mission_started : !session.learner_ready)
            }
            onClick={() => void handleAction()}
            type="button"
          >
            {pending
              ? (learner ? "Saving…" : "Starting…")
              : (learner ? "I'm Ready" : "Start Mission")}
          </button>
        )}
      </section>
    </main>
  );
}
