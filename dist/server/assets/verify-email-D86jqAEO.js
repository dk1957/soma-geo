import { aL as isHostedClientAuthMode, aM as reactExports, aN as jsxRuntimeExports, a2 as _enum, aO as isEmailVerificationBypassed } from "./index-CSpjggkr.js";
import { R as Route, n as normalizeAuthRedirect, u as useSession, c as captureClientEvent, A as AuthPageShell, a as AuthPageCard, L as Link, g as getSignInSearch, b as authClient, t as toast } from "./router-8qflvY1T.js";
import "node:events";
import "node:stream";
import "node:async_hooks";
import "cloudflare:workers";
import "node:diagnostics_channel";
import "node:buffer";
import "node:crypto";
import "node:stream/web";
import "cloudflare:workflows";
import "./middleware-CNUfdy2z.js";
import "./selfHostedOAuth-CrKFUiz1.js";
import "./ai-search-gke0D25z.js";
import "./keywords-B1vFn2Y-.js";
import "./audit-qXiCYzw5.js";
import "stream";
import "./lighthouse-BaqnXs-3.js";
import "./lighthouse-CxIZIYPF.js";
const verificationIssueSchema = _enum(["invalid_token", "token_expired", "user_not_found", "unknown"]).catch("unknown");
function getVerificationErrorMessage(error) {
  switch ((error ?? "").toLowerCase()) {
    case "invalid_token":
      return "This link is no longer valid. Request a new email to keep going.";
    case "token_expired":
      return "This link has expired. Request a new email to keep going.";
    case "user_not_found":
      return "We couldn't find this account anymore. Try creating it again.";
    default:
      return error ? "We couldn't confirm this email. Request a new email and try again." : null;
  }
}
function getVerifyEmailPageCopy({
  isHostedMode,
  errorMessage,
  isPending,
  isRedirecting,
  email
}) {
  if (!isHostedMode) {
    return {
      title: "Verify email",
      helperText: "Email confirmation isn't available right now."
    };
  }
  if (errorMessage) {
    return {
      title: "We couldn't confirm your email",
      helperText: errorMessage
    };
  }
  if (isRedirecting) {
    return {
      title: "Email confirmed",
      helperText: "You're all set. Taking you to your account now."
    };
  }
  if (isPending) {
    return {
      title: "Verify email",
      helperText: "Checking your email confirmation."
    };
  }
  return {
    title: "Verify your email",
    helperText: email ? `Click the link we sent to ${email} to verify your email.` : "Check your inbox for the link to verify your email."
  };
}
function VerifyEmailPage() {
  const search = Route.useSearch();
  const redirectTo = normalizeAuthRedirect(search.redirect);
  const isHostedMode = isHostedClientAuthMode();
  const {
    data: session,
    isPending
  } = useSession();
  const bypassEmailVerification = isEmailVerificationBypassed();
  const errorMessage = getVerificationErrorMessage(search.error);
  const verificationIssueType = search.error ? verificationIssueSchema.parse(search.error) : null;
  const email = search.email ?? session?.user?.email;
  const isVerified = !!session?.user?.emailVerified;
  const [isResending, setIsResending] = reactExports.useState(false);
  const isRedirecting = isVerified || bypassEmailVerification;
  const pageCopy = getVerifyEmailPageCopy({
    isHostedMode,
    errorMessage,
    isPending,
    isRedirecting,
    email
  });
  reactExports.useEffect(() => {
    if (isPending || !isVerified && true) {
      return;
    }
    if (isVerified) {
      captureClientEvent("auth:verification_success", {
        redirect_to: redirectTo
      });
    }
    window.location.replace(redirectTo);
  }, [bypassEmailVerification, isPending, isVerified, redirectTo, session?.user?.id]);
  reactExports.useEffect(() => {
    if (!verificationIssueType) {
      return;
    }
    captureClientEvent("auth:verification_issue", {
      issue_type: verificationIssueType
    });
  }, [verificationIssueType]);
  async function handleResend() {
    if (!email) return;
    setIsResending(true);
    try {
      const callbackURL = new URL("/verify-email", window.location.origin);
      if (redirectTo !== "/") callbackURL.searchParams.set("redirect", redirectTo);
      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: callbackURL.toString()
      });
      if (result.error) {
        toast.error(result.error.message || "We couldn't send another email.");
        return;
      }
      captureClientEvent("auth:verification_resend");
      toast.success("A new email is on the way.");
    } catch {
      toast.error("We couldn't send another email right now. Please try again.");
    } finally {
      setIsResending(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageCard, { title: pageCopy.title, helperText: pageCopy.helperText, footer: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/sign-in", search: getSignInSearch(redirectTo), className: "text-base-content/50 hover:text-base-content transition-colors", children: "Back to sign in" }) }), children: !isHostedMode ? null : errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert alert-error", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: errorMessage }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/sign-in", search: getSignInSearch(redirectTo), className: "btn btn-soft w-full", children: "Back to sign in" })
  ] }) : isPending || isRedirecting ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "loading loading-spinner loading-md" }) }) : email ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "btn btn-soft w-full", onClick: () => void handleResend(), disabled: isResending, children: isResending ? "Sending email..." : "Resend email" }) : null }) });
}
export {
  VerifyEmailPage as component
};
