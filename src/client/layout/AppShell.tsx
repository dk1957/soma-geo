import * as React from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, MessageCircle } from "lucide-react";
import {
  MissingSeoSetupModal,
  MobileSidebarDrawer,
  SeoApiStatusBanners,
} from "@/client/layout/AppShellParts";
import { GscReEngagementModal } from "@/client/features/gsc/GscReEngagementModal";
import { ProjectSwitcher } from "@/client/features/projects/ProjectSwitcher";
import { ChatFlyout } from "@/client/features/sam/ChatFlyout";
import { Sidebar } from "@/client/components/Sidebar";
import { BILLING_ROUTE } from "@/shared/billing";
import { getSeoApiKeyStatus } from "@/serverFunctions/config";
import { getProjects } from "@/serverFunctions/projects";
import { getLastProjectId } from "@/client/lib/active-project";

const DATAFORSEO_HELP_PATH = "/help/dataforseo-api-key";

export function AuthenticatedAppLayout({
  children,
  projectId,
  banner,
}: {
  children: React.ReactNode;
  projectId?: string;
  banner?: React.ReactNode;
}) {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const setupModalRef = React.useRef<HTMLDivElement | null>(null);
  const [showMissingSeoApiKeyModal, setShowMissingSeoApiKeyModal] =
    React.useState(false);
  // On non-project pages (e.g. /settings) there's no projectId in the URL, so
  // derive one for the nav/switcher: prefer the last-visited project, else the
  // most recent. The whole app tree is client-only (see root ClientOnly), so we
  // can read localStorage synchronously during the first render — this lets the
  // sidebar show the full project nav on the very first paint instead of briefly
  // flashing only the always-visible Connect group while projects load.
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
    enabled: !projectId,
  });
  const [rememberedProjectId] = React.useState<string | null>(() =>
    getLastProjectId(),
  );
  const fallbackProjects = projectsQuery.data ?? [];
  const fallbackProjectId =
    fallbackProjects.find((project) => project.id === rememberedProjectId)
      ?.id ??
    fallbackProjects[0]?.id ??
    null;
  // Once the projects list loads, fallbackProjectId is the validated choice
  // (remembered-if-valid, else most recent). Before it loads, fall back to the
  // remembered id so the project nav renders immediately; a stale id here only
  // builds links that self-correct via the route guard once data arrives.
  const sidebarProjectId =
    projectId ?? fallbackProjectId ?? rememberedProjectId;
  const shouldCheckSeoApiKeyStatus = location.pathname !== BILLING_ROUTE;
  const seoApiKeyStatusQuery = useQuery({
    queryKey: ["seoApiKeyStatus"],
    queryFn: () => getSeoApiKeyStatus(),
    enabled: shouldCheckSeoApiKeyStatus,
  });
  const isSeoApiKeyConfigured = shouldCheckSeoApiKeyStatus
    ? (seoApiKeyStatusQuery.data?.configured ?? null)
    : null;
  const seoApiKeyStatusError =
    shouldCheckSeoApiKeyStatus && seoApiKeyStatusQuery.isError;

  React.useEffect(() => {
    if (!shouldCheckSeoApiKeyStatus) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }

    if (seoApiKeyStatusQuery.isError) {
      setShowMissingSeoApiKeyModal(false);
      return;
    }

    if (!seoApiKeyStatusQuery.isSuccess) return;
    setShowMissingSeoApiKeyModal(!seoApiKeyStatusQuery.data.configured);
  }, [
    location.pathname,
    seoApiKeyStatusQuery.data,
    seoApiKeyStatusQuery.isError,
    seoApiKeyStatusQuery.isSuccess,
    shouldCheckSeoApiKeyStatus,
  ]);

  const shouldShowMissingSeoApiKeyModal =
    showMissingSeoApiKeyModal && location.pathname !== DATAFORSEO_HELP_PATH;

  const shouldShowSeoApiWarning =
    !seoApiKeyStatusError &&
    isSeoApiKeyConfigured === false &&
    !shouldShowMissingSeoApiKeyModal;

  React.useEffect(() => {
    if (!shouldShowMissingSeoApiKeyModal) return;

    setupModalRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMissingSeoApiKeyModal(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [shouldShowMissingSeoApiKeyModal]);

  return (
    <div className="flex h-[100dvh] bg-base-200">
      <div className="hidden shrink-0 md:block">
        <Sidebar projectId={sidebarProjectId} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar
          drawerOpen={drawerOpen}
          onOpenDrawer={() => setDrawerOpen(true)}
          onOpenChat={() => setChatOpen(true)}
          projectId={sidebarProjectId}
        />

        {/* PostHog-style cutout: the main content sits on a raised panel with a
            thin strip of the sidebar background above it and a hairline border. */}
        <div className="flex min-h-0 flex-1 flex-col md:pt-2">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-base-100 md:rounded-tl-lg md:border-l md:border-t md:border-base-300">
            <DesktopTopBar
              projectId={sidebarProjectId}
              chatOpen={chatOpen}
              onToggleChat={() => setChatOpen((v) => !v)}
            />

            <SeoApiStatusBanners
              shouldShowSeoApiWarning={shouldShowSeoApiWarning}
              seoApiKeyStatusError={seoApiKeyStatusError}
            />

            {banner}

            <div className="min-h-0 flex-1 overflow-auto">{children}</div>
          </div>
        </div>
      </div>

      {/* Gemini-style push-to-left chat pane. On desktop it takes up layout
          space (flex sibling) so the app content shrinks/pushes left instead of
          being covered. On mobile it slides in as a full-width overlay. */}
      <div
        className={`shrink-0 overflow-hidden border-l border-base-300 bg-base-100 transition-[width] duration-300 ease-in-out md:pt-2 ${
          chatOpen ? "hidden md:block md:w-[420px] lg:w-[460px]" : "md:w-0"
        }`}
      >
        <div className="h-full w-[420px] lg:w-[460px]">
          <ChatFlyout
            projectId={sidebarProjectId}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        </div>
      </div>

      {/* Mobile chat: full-screen overlay pane. */}
      {chatOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <ChatFlyout
            projectId={sidebarProjectId}
            open={chatOpen}
            onClose={() => setChatOpen(false)}
          />
        </div>
      ) : null}

      {/* Floating action button (bottom-right) to open the chat pane. Hidden
          while the pane is open so it doesn't overlap the conversation. */}
      {!chatOpen && sidebarProjectId ? (
        <button
          type="button"
          aria-label="Open SAM chat"
          onClick={() => setChatOpen(true)}
          className="btn btn-primary btn-circle fixed bottom-5 right-5 z-40 size-12 shadow-lg"
        >
          <MessageCircle className="size-5" />
        </button>
      ) : null}

      <MobileSidebarDrawer
        open={drawerOpen}
        projectId={sidebarProjectId}
        onClose={() => setDrawerOpen(false)}
      />

      <MissingSeoSetupModal
        ref={setupModalRef}
        isOpen={shouldShowMissingSeoApiKeyModal}
        onClose={() => setShowMissingSeoApiKeyModal(false)}
      />

      <GscReEngagementModal
        projectId={sidebarProjectId}
        suppressed={shouldShowMissingSeoApiKeyModal}
      />
    </div>
  );
}

// Desktop top navigation bar. The project switcher lives here (right-aligned),
// leaving the left sidebar dedicated to the grouped feature navigation. The
// chat toggle sits at the far right (Gemini-style), opening the push-left pane.
function DesktopTopBar({
  projectId,
  chatOpen,
  onToggleChat,
}: {
  projectId: string | null;
  chatOpen: boolean;
  onToggleChat: () => void;
}) {
  return (
    <div className="hidden shrink-0 items-center justify-end gap-2 border-b border-base-300 bg-base-100 px-4 py-2 md:flex">
      <div className="w-64">
        <ProjectSwitcher activeProjectId={projectId} align="end" />
      </div>
      {projectId ? (
        <button
          type="button"
          aria-label="Toggle SAM chat"
          aria-pressed={chatOpen}
          onClick={onToggleChat}
          className={`btn btn-sm gap-1.5 ${
            chatOpen ? "btn-primary" : "btn-ghost"
          }`}
        >
          <MessageCircle className="size-4" />
          Chat
        </button>
      ) : null}
    </div>
  );
}

function MobileTopBar({
  drawerOpen,
  onOpenDrawer,
  onOpenChat,
  projectId,
}: {
  drawerOpen: boolean;
  onOpenDrawer: () => void;
  onOpenChat: () => void;
  projectId: string | null;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1 border-b border-base-300 bg-base-100 px-2 py-1.5 md:hidden">
      <button
        type="button"
        className="btn btn-square btn-ghost btn-sm"
        aria-label="Toggle sidebar"
        aria-expanded={drawerOpen}
        onClick={onOpenDrawer}
      >
        <Menu className="h-5 w-5" />
      </button>
      <Link to="/" className="ml-1 flex items-center">
        <img src="/soma-logo.png" alt="Soma" className="h-6 w-auto rounded" />
      </Link>
      <div className="ml-auto flex items-center gap-1">
        <div className="w-40 max-w-[50vw]">
          <ProjectSwitcher activeProjectId={projectId} align="end" />
        </div>
        {projectId ? (
          <button
            type="button"
            aria-label="Open SAM chat"
            className="btn btn-square btn-ghost btn-sm"
            onClick={onOpenChat}
          >
            <MessageCircle className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
