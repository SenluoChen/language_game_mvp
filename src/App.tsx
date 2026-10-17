import { useState } from "react";
import { LearnerGame } from "./components/LearnerGame";
import { MissionBriefing } from "./components/MissionBriefing";
import { NativeGame } from "./components/NativeGame";
import { RolePicker } from "./components/RolePicker";
import { useGameSession, type SessionRole } from "./hooks/useGameSession";

export default function App() {
  const game = useGameSession();
  const [role, setRole] = useState<SessionRole | null>(null);

  if (!role) {
    return <RolePicker onPick={async (selectedRole) => {
      if (selectedRole === "instructor" && !(await game.claimInstructor())) return false;
      setRole(selectedRole);
      return true;
    }} />;
  }

  if (!game.session) {
    return (
      <main className="loading-screen" role={game.error ? "alert" : "status"}>
        {game.error ? "The shared mission is temporarily unavailable." : "Connecting…"}
      </main>
    );
  }

  if (!game.session.mission_started) {
    return (
      <MissionBriefing
        session={game.session}
        role={role}
        connection={game.connection}
        error={game.error}
        onReady={game.setLearnerReady}
        onStart={game.startMission}
        onExit={() => setRole(null)}
      />
    );
  }

  if (role === "learner") {
    return (
      <LearnerGame
        session={game.session}
        error={game.error}
        onHint={game.recordHint}
        onExit={() => setRole(null)}
      />
    );
  }

  return (
    <NativeGame
      session={game.session}
      connection={game.connection}
      error={game.error}
      onAdvance={game.advanceCommunicationGate}
      onRestart={game.restartMission}
      onExit={() => setRole(null)}
    />
  );
}
