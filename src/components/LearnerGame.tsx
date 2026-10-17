import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Lightbulb,
  MessageCircle,
} from "lucide-react";

import {
  cafeMission,
  learnerViews,
  stateStep,
} from "../data/cafeMission";

import type { GameSession } from "../hooks/useGameSession";

type Props = {
  session: GameSession;
  error: boolean;
  onHint: () => Promise<void>;
  onExit: () => void;
};

export function LearnerGame({
  session,
  error,
  onHint,
  onExit,
}: Props) {
  const [showHint, setShowHint] = useState(false);

  const [countedHints, setCountedHints] = useState<string[]>([]);

  const current = learnerViews[session.game_state];

  const completed = session.game_state === "completed";

  const currentStep = stateStep[session.game_state];

  // Hide the hint when the shared game state changes.
  useEffect(() => {
    setShowHint(false);
  }, [session.game_state]);

  function toggleHint() {
    const opening = !showHint;

    // Count each stage's hint only once.
    if (
      opening &&
      !countedHints.includes(session.game_state)
    ) {
      setCountedHints((previous) => [
        ...previous,
        session.game_state,
      ]);

      void onHint();
    }

    setShowHint(opening);
  }

  return (
    <main className="learner-screen">
      {/* ===== TOP NAVIGATION ===== */}
      <header className="simple-topbar">
        <button
          className="simple-back"
          onClick={onExit}
          type="button"
          aria-label="Change role"
        >
          <ArrowLeft size={20} />
        </button>

        <h1>Paris Cafe</h1>

        <span className="simple-step">
          {currentStep} / 6
        </span>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <section
        className="learner-current"
        key={session.game_state}
      >
        {/* ===== LEVEL AND BUDGET ===== */}
        <div className="learner-meta">
          <span>
            {cafeMission.level} · BREAKFAST
          </span>

          <span className="learner-budget">
            €{cafeMission.budget}
          </span>
        </div>

        {completed ? (
          /* ===== MISSION COMPLETE ===== */
          <div className="learner-complete">
            <span className="learner-complete__check">
              <Check size={24} />
            </span>

            <span className="learner-overline">
              MISSION COMPLETE
            </span>

            <h2>
              {cafeMission.learnerCompletion.title}
            </h2>

            <p className="learner-task">
              {cafeMission.learnerCompletion.description}
            </p>

            {current.information &&
              current.information.length > 0 && (
                <div className="learner-known">
                  <span className="learner-section-label">
                    YOUR INFORMATION
                  </span>

                  <div className="learner-info-list">
                    {current.information.map((info, index) => (
                      <p key={`${index}-${info}`}>
                        {info}
                      </p>
                    ))}
                  </div>
                </div>
              )}
          </div>
        ) : (
          <>
            {/* =====================================
                MAIN OBJECTIVE

                Keep the learner's task as the main objective.
               ===================================== */}

            <div className="learner-objective-main">
              <span className="learner-overline">
                WHAT YOU NEED TO EXPRESS
              </span>

              <h2>
                {current.task}
              </h2>
            </div>

            {/* ===== SITUATION ===== */}
            {session.game_state === "ordering" && (
              <p className="learner-context">
                {cafeMission.context}
              </p>
            )}

            {/* ===== NECESSARY INFORMATION ===== */}
            {current.information &&
              current.information.length > 0 && (
                <div className="learner-known">
                  <span className="learner-section-label">
                    YOUR INFORMATION
                  </span>

                  <div className="learner-info-list">
                    {current.information.map(
                      (info, index) => (
                        <p key={`${index}-${info}`}>
                          {info}
                        </p>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* ===== USEFUL FRENCH WORDS ===== */}
            {current.usefulWords &&
              current.usefulWords.length > 0 && (
                <div className="learner-vocabulary">
                  <span className="learner-section-label">
                    USEFUL WORDS
                  </span>

                  <div className="learner-word-list">
                    {current.usefulWords.map(
                      (word, index) => (
                        <span
                          key={`${index}-${word}`}
                          className="learner-word"
                        >
                          {word}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* ===== OPTIONAL HELP ===== */}
            {current.hint && (
              <div className="learner-help">
                <button
                  className="help-toggle"
                  onClick={toggleHint}
                  type="button"
                  aria-expanded={showHint}
                  aria-controls="learner-hint-content"
                >
                  <Lightbulb size={17} />

                  {showHint
                    ? "Hide help"
                    : "Need help?"}
                </button>

                {showHint && (
                  <div
                    id="learner-hint-content"
                    className="help-content"
                  >
                    <p>
                      {current.hint.guidance}
                    </p>

                    {/* Show vocabulary only, not a scripted sentence. */}
                    {current.hint.words &&
                      current.hint.words.length > 0 && (
                        <div className="learner-hint-words">
                          {current.hint.words.map(
                            (word, index) => (
                              <span
                                key={`${index}-${word}`}
                                className="learner-hint-word"
                              >
                                {word}
                              </span>
                            )
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ===== CONNECTION ERROR ===== */}
        {error && (
          <p
            className="simple-error"
            role="alert"
          >
            Connection interrupted. Reconnecting…
          </p>
        )}
      </section>

      {/* ===== PASSIVE WAITING STATUS ===== */}
      {!completed && (
        <footer className="learner-action">
          <div
            className="learner-primary"
            role="status"
          >
            <MessageCircle size={17} />
            <span>Waiting for Speaker</span>
          </div>
        </footer>
      )}
    </main>
  );
}