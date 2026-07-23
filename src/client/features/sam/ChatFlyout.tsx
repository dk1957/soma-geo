import { useMutation, useQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import { Archive, Loader2, Plus, Wrench, X } from "lucide-react";
import { archiveSamSession, createSamSession } from "@/serverFunctions/sam";
import {
  invalidateSamSessions,
  samSessionsQueryOptions,
} from "@/client/features/sam/samQueries";
import { SamConversation } from "@/client/features/sam/SamConversation";
import { useSamAccess } from "@/client/features/sam/useSamAccess";
import { SamSetupGate } from "@/client/features/sam/SamSetupGate";

// Compact age label for the session list (PostHog-style "3h" / "12d").
// Timestamps come back as UTC from both backends: D1 as "YYYY-MM-DD HH:MM:SS"
// (no zone marker), Postgres as ISO-8601 with a trailing Z.
function ageLabel(timestamp: string): string {
  const iso = timestamp.includes("T") ? timestamp : `${timestamp}Z`;
  const then = new Date(iso.replace(" ", "T")).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - then) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/**
 * Gemini-style chat flyout. Instead of navigating to the /sam route, the chat
 * opens as a right-side pane that pushes the app content left (see AppShell).
 * It owns the active-session state locally so opening/closing/switching chats
 * never triggers a route change or full-page feel.
 */
export function ChatFlyout({
  projectId,
  open,
  onClose,
}: {
  projectId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
    undefined,
  );
  const [showHistory, setShowHistory] = useState(false);

  const access = useSamAccess(projectId ?? "");
  const sessionsQuery = useQuery({
    ...samSessionsQueryOptions(projectId ?? ""),
    enabled: Boolean(projectId),
  });
  const sessions = sessionsQuery.data ?? [];

  // Auto-select the most recent session once the panel is open and sessions
  // have loaded, mirroring the previous route behavior.
  const firstSessionId = sessions[0]?.id;
  useEffect(() => {
    if (!open || activeSessionId || !firstSessionId) return;
    setActiveSessionId(firstSessionId);
  }, [open, activeSessionId, firstSessionId]);

  const createSession = useMutation({
    mutationFn: () => createSamSession({ data: { projectId: projectId ?? "" } }),
    onSuccess: ({ id }) => {
      if (projectId) invalidateSamSessions(projectId);
      setActiveSessionId(id);
      setShowHistory(false);
    },
  });

  const archiveSession = useMutation({
    mutationFn: (sessionId: string) =>
      archiveSamSession({ data: { sessionId } }),
    onSuccess: (_result, sessionId) => {
      if (projectId) invalidateSamSessions(projectId);
      if (sessionId === activeSessionId) {
        setActiveSessionId(sessions.find((s) => s.id !== sessionId)?.id);
      }
    },
  });

  if (!projectId) return null;

  return (
    <div className="flex h-full w-full flex-col bg-base-100">
      {/* Header: title, new-chat, history toggle, close. */}
      <div className="flex shrink-0 items-center gap-1 border-b border-base-300 px-3 py-2">
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          aria-pressed={showHistory}
          className={`btn btn-ghost btn-sm gap-1.5 font-semibold ${
            showHistory ? "text-base-content" : "text-base-content/80"
          }`}
        >
          SAM
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="btn btn-ghost btn-sm gap-1.5 font-normal text-base-content/70 hover:text-base-content"
            disabled={createSession.isPending}
            onClick={() => createSession.mutate()}
          >
            {createSession.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            <span className="hidden sm:inline">New chat</span>
          </button>
          <button
            type="button"
            aria-label="Close chat"
            className="btn btn-ghost btn-sm btn-square text-base-content/60 hover:text-base-content"
            onClick={onClose}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* History drawer: slides over the conversation when toggled. */}
      {showHistory ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
          <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-base-content/40">
            History
          </div>
          {sessionsQuery.isLoading ? (
            <div className="flex justify-center py-6 text-base-content/50">
              <Loader2 className="size-4 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-2 py-6 text-center text-xs text-base-content/50">
              No chats yet. Start a new one.
            </p>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  className={`group flex items-center gap-1 rounded-md px-1 ${
                    isActive ? "bg-base-300/50" : "hover:bg-base-300/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setShowHistory(false);
                    }}
                    className="min-w-0 flex-1 truncate px-2 py-1.5 text-left text-sm text-base-content/80"
                  >
                    {session.title}
                  </button>
                  <span className="shrink-0 text-xs text-base-content/40 group-hover:hidden">
                    {ageLabel(session.updatedAt)}
                  </span>
                  <button
                    type="button"
                    aria-label="Archive chat"
                    className="btn btn-ghost btn-xs btn-square hidden group-hover:inline-flex"
                    disabled={archiveSession.isPending}
                    onClick={() => archiveSession.mutate(session.id)}
                  >
                    <Archive className="size-3.5 text-base-content/50" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      ) : access.showSetupGate ? (
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          <SamSetupGate
            errorMessage={access.errorMessage}
            isRefetching={access.isRefetching}
            onRetry={access.onRetry}
          />
        </div>
      ) : activeSessionId ? (
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-base-content/40" />
            </div>
          }
        >
          <SamConversation
            key={activeSessionId}
            projectId={projectId}
            sessionId={activeSessionId}
          />
        </Suspense>
      ) : sessionsQuery.isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-base-content/40" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wrench className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium">What should we work on?</p>
            <p className="max-w-xs text-sm text-base-content/60">
              SAM is your in-app SEO agent with access to every OpenSEO research
              tool. Start a chat to get going.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm gap-1"
            disabled={createSession.isPending}
            onClick={() => createSession.mutate()}
          >
            {createSession.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            New chat
          </button>
        </div>
      )}
    </div>
  );
}
