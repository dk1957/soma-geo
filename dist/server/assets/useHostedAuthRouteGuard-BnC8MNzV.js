import { j as useNavigate, u as useSession, k as getCurrentAuthRedirectFromHref, g as getSignInSearch, l as getVerifyEmailSearch } from "./router-8qflvY1T.js";
import { aL as isHostedClientAuthMode, aO as isEmailVerificationBypassed, aM as reactExports } from "./index-CSpjggkr.js";
function useHostedAuthRouteGuard() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const isHostedMode = isHostedClientAuthMode();
  const emailVerified = session?.user?.emailVerified === true || isEmailVerificationBypassed();
  reactExports.useEffect(() => {
    if (isPending || !isHostedMode) {
      return;
    }
    const redirectTo = getCurrentAuthRedirectFromHref(window.location.href);
    if (!session?.user?.id) {
      void navigate({
        to: "/sign-in",
        search: getSignInSearch(redirectTo),
        replace: true
      });
      return;
    }
    if (!emailVerified) {
      void navigate({
        to: "/verify-email",
        search: getVerifyEmailSearch(session.user.email, redirectTo),
        replace: true
      });
    }
  }, [
    isPending,
    isHostedMode,
    emailVerified,
    session?.user?.email,
    session?.user?.id,
    navigate
  ]);
  const hasVerifiedHostedSession = !isPending && Boolean(session?.user?.id) && emailVerified;
  return {
    isHostedMode,
    canRenderAuthenticatedContent: !isHostedMode || hasVerifiedHostedSession
  };
}
export {
  useHostedAuthRouteGuard as u
};
