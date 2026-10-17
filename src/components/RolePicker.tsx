import { useState } from "react";
import { ArrowRight, Coffee, GraduationCap } from "lucide-react";
import type { SessionRole } from "../hooks/useGameSession";

type Props = {
  onPick: (role: SessionRole) => Promise<boolean>;
};

export function RolePicker({ onPick }: Props) {
  const [claimError, setClaimError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function choose(role: SessionRole) {
    setClaimError(null);
    setPending(true);
    try {
      const accepted = await onPick(role);
      if (!accepted) setClaimError("A Speaker has already joined this mission.");
    } catch {
      setClaimError("Unable to join the mission. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="role-screen">
      <div className="app-wordmark"><Coffee size={18} /> Ratatouille </div>
      <section className="role-choice">

        <h1>Practice English<br /><span>in real life.</span></h1>
        <p className="role-subtitle">Choose how you want to play.</p>

        <div className="role-options">
          <button
            className="role-option"
            disabled={pending}
            onClick={() => void choose("learner")}
            type="button"
          >
            <span className="role-option__icon role-option__icon--learner"><GraduationCap size={22} /></span>
            <span className="role-option__copy"><strong>Learner</strong><small>Practice the conversation</small></span>
            <ArrowRight size={19} />
          </button>
          <button
            className="role-option"
            disabled={pending}
            onClick={() => void choose("instructor")}
            type="button"
          >
            <span className="role-option__icon role-option__icon--instructor"><Coffee size={21} /></span>
            <span className="role-option__copy"><strong>Speaker</strong><small>Guide the conversation</small></span>
            <ArrowRight size={19} />
          </button>
        </div>
        {claimError && <p className="role-error" role="alert">{claimError}</p>}
      </section>
    </main>
  );
}
