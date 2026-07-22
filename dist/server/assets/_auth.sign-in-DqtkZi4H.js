import { aM as reactExports, aN as jsxRuntimeExports, G as object, H as string } from "./index-CSpjggkr.js";
import { D as Route, j as useNavigate, E as useAuthPageState, e as useForm, c as captureClientEvent, b as authClient, l as getVerifyEmailSearch, a as AuthPageCard, F as AuthMethodChooser, h as getFieldError, f as getFormError, L as Link, g as getSignInSearch } from "./router-8qflvY1T.js";
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
const signInSchema = object({
  email: string().trim().email("Enter a valid email address."),
  password: string().min(1, "Enter your password.")
});
function SignInPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const {
    redirectTo,
    oauthQuery,
    isHostedMode
  } = useAuthPageState(search.redirect);
  const authCallbackURL = redirectTo;
  const [showEmailForm, setShowEmailForm] = reactExports.useState(false);
  const [isStartingGoogle, setIsStartingGoogle] = reactExports.useState(false);
  const [socialError, setSocialError] = reactExports.useState(null);
  const form = useForm({
    defaultValues: {
      email: "",
      password: ""
    },
    validators: {
      onSubmit: signInSchema
    },
    onSubmit: async ({
      formApi,
      value
    }) => {
      try {
        const email = value.email.trim();
        captureClientEvent("auth:sign_in_submit", {
          redirect_to: redirectTo
        });
        const result = await authClient.signIn.email({
          email,
          password: value.password,
          callbackURL: authCallbackURL,
          ...oauthQuery ? {
            oauth_query: oauthQuery
          } : {}
        });
        if (!result.error) {
          captureClientEvent("auth:sign_in_success", {
            redirect_to: redirectTo
          });
          return;
        }
        if (result.error.status === 403) {
          captureClientEvent("auth:sign_in_block_unverified", {
            redirect_to: redirectTo
          });
          void navigate({
            to: "/verify-email",
            search: getVerifyEmailSearch(email, redirectTo)
          });
          return;
        }
        formApi.setErrorMap({
          onSubmit: {
            form: result.error.message || "We couldn't sign you in.",
            fields: {}
          }
        });
      } catch {
        formApi.setErrorMap({
          onSubmit: {
            form: "Unable to sign in right now. Please try again.",
            fields: {}
          }
        });
      }
    }
  });
  async function handleContinueWithGoogle() {
    setSocialError(null);
    setIsStartingGoogle(true);
    try {
      captureClientEvent("auth:sign_in_google_start", {
        redirect_to: redirectTo
      });
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: authCallbackURL
      });
      if (result.error) {
        setSocialError(result.error.message || "Google sign in is not available right now.");
        setIsStartingGoogle(false);
      }
    } catch {
      setSocialError("Google sign in is not available right now.");
      setIsStartingGoogle(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageCard, { title: "Sign in", footer: isHostedMode ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: showEmailForm ? "flex justify-between text-sm text-base-content/50" : "text-sm text-base-content/50", children: [
    showEmailForm ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/forgot-password", search: getSignInSearch(redirectTo), className: "text-base-content underline underline-offset-2 hover:text-base-content/80 transition-colors", children: "Forgot password?" }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/sign-up", search: getSignInSearch(redirectTo), className: "text-base-content underline underline-offset-2 hover:text-base-content/80 transition-colors", children: "Create account" })
  ] }) : null, children: !showEmailForm ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AuthMethodChooser, { googleLabel: "Continue with Google", disabled: !isHostedMode, isBusy: isStartingGoogle, onContinueWithGoogle: () => {
      void handleContinueWithGoogle();
    }, onContinueWithEmail: () => {
      setShowEmailForm(true);
      setSocialError(null);
    } }),
    socialError ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: socialError }) : null
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "space-y-4", onSubmit: (event) => {
    event.preventDefault();
    void form.handleSubmit();
  }, children: [
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", className: "input input-bordered w-full", placeholder: "Password...", value: field.state.value, onChange: (event) => field.handleChange(event.target.value), autoComplete: "current-password", disabled: !isHostedMode, required: true }),
        error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-error", children: error }) : null
      ] });
    } }),
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-soft w-full", disabled: !isHostedMode || isSubmitting, children: isSubmitting ? "Signing in..." : "Sign in" })
      ] });
    } })
  ] }) });
}
export {
  SignInPage as component
};
