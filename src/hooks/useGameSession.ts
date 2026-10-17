import { useCallback, useEffect, useRef, useState } from "react";
import { nextGameState, type GameState } from "../data/cafeMission";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export type SessionRole = "learner" | "instructor";

const clientIdStorageKey = "french-life-client-id";

export type GameSession = {
  id: string;
  mission_id: string;
  game_state: GameState;
  status: "active" | "completed";
  learner_choice: string | null;
  hint_count: number;
  created_at: string;
  learner_ready: boolean;
  mission_started: boolean;
};

function getClient() {
  if (!supabase) throw new Error("The game service is unavailable.");
  return supabase;
}

function getOrCreateClientId() {
  const existingId = window.localStorage.getItem(clientIdStorageKey);
  if (existingId) return existingId;

  const clientId = window.crypto.randomUUID();
  window.localStorage.setItem(clientIdStorageKey, clientId);
  return clientId;
}

export function useGameSession() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState<"disconnected" | "connecting" | "connected">("connecting");
  const [error, setError] = useState(false);
  const gateInFlight = useRef(false);

  const reportError = useCallback(() => {
    setError(true);
  }, []);

  const loadGame = useCallback(async () => {
    const client = getClient();
    const { data, error: queryError } = await client
      .from("sessions")
      .select("id, mission_id, game_state, status, learner_choice, hint_count, created_at, learner_ready, mission_started")
      .eq("is_shared", true)
      .maybeSingle();

    if (queryError) throw queryError;
    if (!data) throw new Error("Shared game state is missing.");
    setSession(data as GameSession);
    setError(false);
  }, []);

  const claimInstructor = useCallback(async () => {
    const currentClientId = getOrCreateClientId();
    const client = getClient();
    const { data, error: rpcError } = await client.rpc("claim_shared_instructor", {
      p_client_id: currentClientId,
    });

    if (rpcError) {
      reportError();
      throw rpcError;
    }
    if (data !== true) return false;

    setClientId(currentClientId);
    await loadGame();
    return true;
  }, [loadGame, reportError]);

  const setLearnerReady = useCallback(async () => {
    if (!session || session.mission_started || session.game_state !== "ordering") {
      throw new Error("The briefing is no longer open.");
    }

    const client = getClient();
    const { data, error: rpcError } = await client.rpc("set_shared_learner_ready");
    if (rpcError) {
      reportError();
      throw rpcError;
    }
    if (data !== true) {
      reportError();
      throw new Error("Learner readiness could not be saved.");
    }

    setSession((current) => current ? { ...current, learner_ready: true } : current);
    setError(false);
  }, [reportError, session]);

  const startMission = useCallback(async () => {
    if (!session || !clientId) {
      throw new Error("This browser does not hold the Speaker role.");
    }
    if (!session.learner_ready) {
      throw new Error("The Learner must be ready before the mission starts.");
    }

    const client = getClient();
    const { data, error: rpcError } = await client.rpc("start_shared_game", {
      p_client_id: clientId,
    });
    if (rpcError) {
      reportError();
      throw rpcError;
    }
    if (data !== true) {
      reportError();
      throw new Error("The mission could not be started.");
    }

    setSession((current) => current ? { ...current, mission_started: true } : current);
    setError(false);
  }, [clientId, reportError, session]);

  const advanceCommunicationGate = useCallback(async () => {
    if (gateInFlight.current) return;
    if (!session || !clientId || !session.mission_started) {
      throw new Error("This browser does not hold the Speaker role.");
    }

    const nextState = nextGameState[session.game_state];
    if (!nextState) throw new Error("There is no gate for the current game state.");

    gateInFlight.current = true;
    try {
      const client = getClient();
      const { data, error: rpcError } = await client.rpc("advance_shared_game", {
        p_client_id: clientId,
        p_expected_state: session.game_state,
        p_next_state: nextState,
      });
      if (rpcError) {
        reportError();
        throw rpcError;
      }
      if (!data) {
        reportError();
        throw new Error("The shared game did not advance.");
      }

      setSession(data as GameSession);
      setError(false);
    } finally {
      gateInFlight.current = false;
    }
  }, [clientId, reportError, session]);

  const restartMission = useCallback(async () => {
    if (!session || !clientId) {
      throw new Error("This browser does not hold the Speaker role.");
    }

    const client = getClient();
    const { data, error: rpcError } = await client.rpc("restart_shared_game", {
      p_client_id: clientId,
    });
    if (rpcError) {
      reportError();
      throw rpcError;
    }
    if (!data) {
      reportError();
      throw new Error("The shared game could not be restarted.");
    }

    setSession(data as GameSession);
    setError(false);
  }, [clientId, reportError, session]);

  const recordHint = useCallback(async () => {
    if (!session?.mission_started) return;
    const client = getClient();
    const { data, error: rpcError } = await client.rpc("record_learner_hint");
    if (rpcError) {
      reportError();
      return;
    }
    if (typeof data === "number") {
      setSession((current) => current ? { ...current, hint_count: data } : current);
    }
  }, [reportError, session]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      setConnection("disconnected");
      setError(true);
      return;
    }

    const client = supabase;
    let mounted = true;
    setConnection("connecting");
    setLoading(true);

    const channel = client
      .channel("shared-game-state")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sessions" },
        (payload) => {
          const updated = payload.new as GameSession & { is_shared?: boolean };
          if (updated.is_shared) {
            setSession(updated);
            setError(false);
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          if (mounted) setConnection("connected");
          void loadGame()
            .catch(reportError)
            .finally(() => {
              if (mounted) setLoading(false);
            });
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (mounted) {
            setConnection("disconnected");
            setLoading(false);
            setError(true);
          }
        }
      });

    return () => {
      mounted = false;
      setConnection("disconnected");
      void client.removeChannel(channel);
    };
  }, [loadGame, reportError]);

  return {
    session,
    loading,
    connection,
    error,
    configured: isSupabaseConfigured,
    claimInstructor,
    setLearnerReady,
    startMission,
    advanceCommunicationGate,
    restartMission,
    recordHint,
  };
}
