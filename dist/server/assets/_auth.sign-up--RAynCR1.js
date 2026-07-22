import { aM as reactExports, aN as jsxRuntimeExports, aP as HOSTED_PASSWORD_MAX_LENGTH, aQ as HOSTED_PASSWORD_MIN_LENGTH, G as object, H as string } from "./index-CSpjggkr.js";
import { W as Route, j as useNavigate, E as useAuthPageState, e as useForm, c as captureClientEvent, l as getVerifyEmailSearch, b as authClient, a as AuthPageCard, F as AuthMethodChooser, h as getFieldError, f as getFormError, L as Link, g as getSignInSearch } from "./router-8qflvY1T.js";
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
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
const TURNSTILE_SITE_KEY = "YOUR_TURNSTILE_SITE_KEY"?.trim();
function useTurnstileCaptcha() {
  const tokenRef = reactExports.useRef(null);
  const [hasToken, setHasToken] = reactExports.useState(false);
  const [resetNonce, setResetNonce] = reactExports.useState(0);
  const onToken = reactExports.useCallback((token) => {
    tokenRef.current = token;
    setHasToken(Boolean(token));
  }, []);
  const reset = reactExports.useCallback(() => {
    tokenRef.current = null;
    setHasToken(false);
    setResetNonce((nonce) => nonce + 1);
  }, []);
  return { tokenRef, hasToken, resetNonce, onToken, reset };
}
function TurnstileWidget({
  onToken,
  resetNonce
}) {
  const containerRef = reactExports.useRef(null);
  const widgetIdRef = reactExports.useRef(null);
  const onTokenRef = reactExports.useRef(onToken);
  onTokenRef.current = onToken;
  reactExports.useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || widgetIdRef.current !== null || !containerRef.current || !window.turnstile) {
        return;
      }
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onTokenRef.current(null),
        "error-callback": () => onTokenRef.current(null)
      });
    };
    if (window.turnstile) {
      renderWidget();
    } else {
      const existing = document.querySelector(
        `script[src="${TURNSTILE_SCRIPT_SRC}"]`
      );
      const script = existing ?? document.createElement("script");
      script.addEventListener("load", renderWidget);
      if (!existing) {
        script.src = TURNSTILE_SCRIPT_SRC;
        script.async = true;
        document.head.appendChild(script);
      }
    }
    return () => {
      cancelled = true;
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, []);
  reactExports.useEffect(() => {
    if (resetNonce === 0) return;
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenRef.current(null);
    }
  }, [resetNonce]);
  if (!TURNSTILE_SITE_KEY) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: containerRef, className: "flex justify-center" });
}
const signUpSchema = object({
  name: string().trim(),
  email: string().trim().email("Enter a valid email address."),
  password: string().min(HOSTED_PASSWORD_MIN_LENGTH, `Password must be at least ${HOSTED_PASSWORD_MIN_LENGTH} characters.`).max(HOSTED_PASSWORD_MAX_LENGTH, `Password must be at most ${HOSTED_PASSWORD_MAX_LENGTH} characters.`),
  confirmPassword: string()
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
});
function SignUpPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const {
    redirectTo,
    isHostedMode
  } = useAuthPageState(search.redirect);
  const postSignupRedirect = redirectTo === "/" ? "/onboarding" : redirectTo;
  const [showEmailForm, setShowEmailForm] = reactExports.useState(false);
  const google = useGoogleSignUp({
    redirectTo,
    postSignupRedirect
  });
  const isTurnstileEnabled = isHostedMode && Boolean(TURNSTILE_SITE_KEY);
  const captcha = useTurnstileCaptcha();
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: ""
    },
    validators: {
      onSubmit: signUpSchema
    },
    onSubmit: async ({
      formApi,
      value
    }) => {
      const captchaToken = captcha.tokenRef.current;
      if (isTurnstileEnabled && !captchaToken) {
        formApi.setErrorMap({
          onSubmit: {
            form: "Please complete the captcha to continue.",
            fields: {}
          }
        });
        return;
      }
      try {
        const email = value.email.trim();
        captureClientEvent("auth:sign_up_submit", {
          redirect_to: redirectTo
        });
        const resolvedName = value.name.trim() || email.split("@")[0] || "OpenSEO User";
        const verificationCallbackURL = new URL("/verify-email", window.location.origin);
        const verificationSearch = getVerifyEmailSearch(void 0, postSignupRedirect);
        if (verificationSearch.redirect) {
          verificationCallbackURL.searchParams.set("redirect", verificationSearch.redirect);
        }
        const result = await authClient.signUp.email({
          name: resolvedName,
          email,
          password: value.password,
          callbackURL: verificationCallbackURL.toString(),
          ...isTurnstileEnabled && captchaToken ? {
            fetchOptions: {
              headers: {
                "x-captcha-response": captchaToken
              }
            }
          } : {}
        });
        if (result.error) {
          if (isTurnstileEnabled) captcha.reset();
          formApi.setErrorMap({
            onSubmit: {
              form: result.error.message || "Unable to create account.",
              fields: {}
            }
          });
          return;
        }
        captureClientEvent("auth:sign_up_success", {
          redirect_to: redirectTo
        });
        void navigate({
          to: "/verify-email",
          search: getVerifyEmailSearch(email, postSignupRedirect),
          replace: true
        });
      } catch {
        if (isTurnstileEnabled) captcha.reset();
        formApi.setErrorMap({
          onSubmit: {
            form: "Unable to create account right now. Please try again.",
            fields: {}
          }
        });
      }
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageCard, { title: "Create your account", footer: isHostedMode ? showEmailForm ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", className: "text-sm text-base-content underline underline-offset-2 hover:text-base-content/80 transition-colors", onClick: () => {
    setShowEmailForm(false);
    google.clearError();
  }, children: "Back to signup" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm leading-relaxed text-base-content/60", children: [
      "By signing up, you agree to our",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://openseo.so/terms-and-conditions", target: "_blank", rel: "noreferrer", className: "text-base-content underline underline-offset-2 hover:text-base-content/80 transition-colors", children: "Terms" }),
      " ",
      "and",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://openseo.so/privacy", target: "_blank", rel: "noreferrer", className: "text-base-content underline underline-offset-2 hover:text-base-content/80 transition-colors", children: "Privacy Policy" }),
      "."
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-base-content/50", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/sign-in", search: getSignInSearch(redirectTo), className: "text-base-content underline underline-offset-2 hover:text-base-content/80 transition-colors", children: "Sign in" })
    ] })
  ] }) : null, children: !showEmailForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AuthMethodChooser, { googleLabel: "Continue with Google", disabled: !isHostedMode, isBusy: google.isStarting, onContinueWithGoogle: () => {
      void google.start();
    }, onContinueWithEmail: () => {
      setShowEmailForm(true);
      google.clearError();
    } }),
    google.error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: google.error }) : null
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "space-y-4", onSubmit: (event) => {
    event.preventDefault();
    void form.handleSubmit();
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "name", children: (field) => {
      const error = getFieldError(field.state.meta.errors);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", className: "input input-bordered w-full", placeholder: "Name (optional)...", value: field.state.value, onChange: (event) => field.handleChange(event.target.value), autoComplete: "name", disabled: !isHostedMode }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-error", children: error }) : null
      ] });
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "email", children: (field) => {
      const error = getFieldError(field.state.meta.errors);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", className: "input input-bordered w-full", placeholder: "Email address...", value: field.state.value, onChange: (event) => field.handleChange(event.target.value), autoComplete: "email", disabled: !isHostedMode, required: true }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-error", children: error }) : null
      ] });
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "password", children: (field) => {
      const error = getFieldError(field.state.meta.errors);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", className: "input input-bordered w-full", placeholder: "Password...", value: field.state.value, onChange: (event) => field.handleChange(event.target.value), autoComplete: "new-password", disabled: !isHostedMode, required: true, minLength: HOSTED_PASSWORD_MIN_LENGTH, maxLength: HOSTED_PASSWORD_MAX_LENGTH }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-error", children: error }) : null
      ] });
    } }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "confirmPassword", children: (field) => {
      const error = getFieldError(field.state.meta.errors);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", className: "input input-bordered w-full", placeholder: "Confirm password...", value: field.state.value, onChange: (event) => field.handleChange(event.target.value), autoComplete: "new-password", disabled: !isHostedMode, required: true, minLength: HOSTED_PASSWORD_MIN_LENGTH, maxLength: HOSTED_PASSWORD_MAX_LENGTH }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-error", children: error }) : null
      ] });
    } }),
    isTurnstileEnabled ? /* @__PURE__ */ jsxRuntimeExports.jsx(TurnstileWidget, { onToken: captcha.onToken, resetNonce: captcha.resetNonce }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(form.Subscribe, { selector: (state) => ({
      submitError: state.errorMap.onSubmit,
      isSubmitting: state.isSubmitting
    }), children: ({
      submitError,
      isSubmitting
    }) => {
      const errorMessage = getFormError(submitError);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: errorMessage }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-soft w-full", disabled: !isHostedMode || isSubmitting || isTurnstileEnabled && !captcha.hasToken, children: isSubmitting ? "Creating account..." : "Create account" })
      ] });
    } })
  ] }) });
}
function useGoogleSignUp({
  redirectTo,
  postSignupRedirect
}) {
  const [isStarting, setIsStarting] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const start = async () => {
    setError(null);
    setIsStarting(true);
    try {
      captureClientEvent("auth:sign_up_google_start", {
        redirect_to: redirectTo
      });
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
        newUserCallbackURL: postSignupRedirect,
        requestSignUp: true
      });
      if (result.error) {
        setError(result.error.message || "Google sign up is not available right now.");
        setIsStarting(false);
      }
    } catch {
      setError("Google sign up is not available right now.");
      setIsStarting(false);
    }
  };
  return {
    isStarting,
    error,
    start,
    clearError: () => setError(null)
  };
}
export {
  SignUpPage as component
};
