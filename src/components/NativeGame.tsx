import { useState } from "react";
import type { MouseEvent } from "react";

import {
  ArrowLeft,
  Check,
  RotateCcw,
  LockKeyhole,
} from "lucide-react";

import {
  cafeMission,
  instructorViews,
  stateStep,
} from "../data/cafeMission";

import type { GameSession } from "../hooks/useGameSession";

type Props = {
  session: GameSession;
  connection: "disconnected" | "connecting" | "connected";
  error: boolean;
  onAdvance: () => Promise<void>;
  onRestart: () => Promise<void>;
  onExit: () => void;
};

export function NativeGame({
  session,
  connection,
  error,
  onAdvance,
  onRestart,
  onExit,
}: Props) {
  const [advancing, setAdvancing] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const current = instructorViews[session.game_state];

  const complete = session.game_state === "completed";
  const step = stateStep[session.game_state];

  const isConnected = connection === "connected";

  // ==========================================
  // SPEAKER-ONLY MISSION PROGRESSION
  // ==========================================

  async function confirmGate(
    event: MouseEvent<HTMLButtonElement>
  ) {
    if (
      complete ||
      advancing ||
      !isConnected ||
      event.detail > 1
    ) {
      return;
    }

    setAdvancing(true);

    try {
      await onAdvance();
    } catch {
      // Errors are handled by useGameSession.
    } finally {
      setAdvancing(false);
    }
  }

  // ==========================================
  // RESTART SHARED MISSION
  // ==========================================

  async function restartMission() {
    if (restarting || !isConnected) return;

    setRestarting(true);

    try {
      await onRestart();
    } catch {
      // Errors are handled by useGameSession.
    } finally {
      setRestarting(false);
    }
  }

  // ==========================================
  // PRIVATE INFORMATION
  // ==========================================

  // Show current prices only; do not reveal the upcoming stock issue.
  const privateInfo =
    session.game_state === "ordering"
      ? current.privateInfo.slice(0, 3)
      : current.privateInfo;

  function renderPrivateInfo(
    info: string,
    index: number
  ) {
    const separatorIndex = info.indexOf(":");

    if (separatorIndex === -1) {
      return (
        <div
          className="instructor-private__item"
          key={`${index}-${info}`}
        >
          <span>{info}</span>
        </div>
      );
    }

    const label = info
      .slice(0, separatorIndex)
      .trim();

    const value = info
      .slice(separatorIndex + 1)
      .trim();

    return (
      <div
        className="instructor-private__item"
        key={`${index}-${info}`}
      >
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    );
  }

  return (
    <main className="instructor-screen">

      {/* =====================================
          TOP NAVIGATION
         ===================================== */}

      <header className="instructor-topbar">

        <button
          className="instructor-back"
          onClick={onExit}
          type="button"
          aria-label="Change role"
        >
          <ArrowLeft size={20} />
        </button>

        <h1>Paris Cafe</h1>

        <span className="instructor-step">
          {step} / 6
        </span>

      </header>

      {/* =====================================
          MAIN CONTENT
         ===================================== */}

      <section
        className="instructor-current"
        key={session.game_state}
      >

        {complete ? (

          /* =================================
             MISSION COMPLETE
             ================================= */

          <div className="instructor-complete">

            <span className="instructor-overline">
              MISSION COMPLETE
            </span>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "60px",
                height: "60px",
                marginTop: "12px",
                borderRadius: "50%",
                background: "#EAF7EF",
                color: "#16834A",
              }}
            >
              <Check size={28} />
            </div>

            <h2>
              {cafeMission.nativeCompletion.title}
            </h2>

            <p className="instructor-instruction">
              {cafeMission.nativeCompletion.description}
            </p>

          </div>

        ) : (

          <>
            {/* =================================
                SPEAKER ROLE
               ================================= */}

            <div className="instructor-role">

              <span
                className="learner-section-label"
              >
                YOUR ROLE
              </span>

              <p>
                Cafe employee
              </p>

            </div>

            {/* =================================
                MAIN ACTION

                Keep the Speaker's action as the main objective.
               ================================= */}

            <div className="instructor-objective">

              <span className="instructor-overline">
                YOUR ACTION
              </span>

              <h2>
                {current.instruction}
              </h2>

            </div>

            {current.guidance && (
              <div className="instructor-guidance">
                <span className="learner-section-label">
                  GUIDANCE
                </span>
                <p>{current.guidance}</p>
              </div>
            )}

            {/* =================================
                PRIVATE INFORMATION

                Only the Speaker can see this information.
               ================================= */}

            {privateInfo.length > 0 && (

              <div className="instructor-information-section">

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "14px",
                  }}
                >
                  <LockKeyhole
                    size={15}
                    color="#6B7280"
                  />

                  <span
                    className="learner-section-label"
                  >
                    PRIVATE INFORMATION
                  </span>
                </div>

                <div className="instructor-private">

                  {privateInfo.map(
                    renderPrivateInfo
                  )}

                </div>

              </div>

            )}

            {/* =================================
                WHEN TO CONTINUE

                A stage completion condition, not a scripted line.
               ================================= */}

            {current.gateLabel && (

              <div className="instructor-gate-section">

                <span
                  className="learner-section-label"
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  WHEN TO CONTINUE
                </span>

                <p>
                  {current.gateLabel.replace(
                    /^✓\s*/,
                    ""
                  )}
                </p>

              </div>

            )}

          </>
        )}

      </section>

      {/* =====================================
          BOTTOM ACTION

          ONLY SPEAKER CAN ADVANCE
         ===================================== */}

      <footer className="instructor-action-area">

        {/* ===== CONNECTION ERROR ===== */}

        {error && (

          <p
            className="instructor-error"
            role="alert"
          >
            {complete
              ? "The mission could not be restarted. Please try again."
              : "Connection interrupted. Reconnecting…"}
          </p>

        )}

        {/* ===== CONNECTION STATUS ===== */}

        {!isConnected && !error && (

          <p
            style={{
              marginBottom: "12px",
              color: "#777D89",
              fontSize: "13px",
              textAlign: "center",
            }}
          >
            {connection === "connecting"
              ? "Connecting..."
              : "Waiting for connection..."}
          </p>

        )}

        {complete ? (

          /* ===== REPLAY MISSION ===== */

          <button
            className="instructor-primary-action"
            disabled={
              restarting ||
              !isConnected
            }
            onClick={() => void restartMission()}
            type="button"
          >

            <RotateCcw size={19} />

            {restarting
              ? "Restarting..."
              : "Replay Mission"}

          </button>

        ) : (

          /* ===== CONFIRM & NEXT ===== */

          <button
            className="instructor-primary-action"
            disabled={
              advancing ||
              !isConnected
            }
            onClick={(event) =>
              void confirmGate(event)
            }
            type="button"
          >

            <Check size={19} />

            {advancing
              ? "Updating..."
              : "Confirm & Next"}

          </button>

        )}

      </footer>

    </main>
  );
}