import { aL as isHostedClientAuthMode, aN as jsxRuntimeExports, aP as HOSTED_PASSWORD_MAX_LENGTH, aQ as HOSTED_PASSWORD_MIN_LENGTH, G as object, H as string } from "./index-CSpjggkr.js";
import { d as Route, n as normalizeAuthRedirect, e as useForm, b as authClient, A as AuthPageShell, f as getFormError, a as AuthPageCard, L as Link, g as getSignInSearch, h as getFieldError } from "./router-8qflvY1T.js";
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
const resetPasswordSchema = object({
  password: string().min(HOSTED_PASSWORD_MIN_LENGTH, `Password must be at least ${HOSTED_PASSWORD_MIN_LENGTH} characters.`).max(HOSTED_PASSWORD_MAX_LENGTH, `Password must be at most ${HOSTED_PASSWORD_MAX_LENGTH} characters.`),
  confirmPassword: string()
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"]
});
function getResetPasswordErrorMessage(error) {
  switch ((error ?? "").toLowerCase()) {
    case "invalid_token":
      return "This reset link is no longer valid. Request a new one to keep going.";
    case "token_expired":
      return "This reset link has expired. Request a new one to keep going.";
    default:
      return error ? "This reset link can't be used anymore. Request a new one and try again." : null;
  }
}
function getResetPasswordPageCopy({
  isHostedMode,
  isComplete,
  routeError,
  hasToken
}) {
  if (!isHostedMode) {
    return {
      title: "Reset password",
      helperText: "Password reset isn't available right now."
    };
  }
  if (isComplete) {
    return {
      title: "Password updated",
      helperText: "Your password has been updated. Sign in with your new password."
    };
  }
  if (routeError || !hasToken) {
    return {
      title: "Reset link expired",
      helperText: routeError || "This reset link is no longer valid. Request a new one to keep going."
    };
  }
  return {
    title: "Reset password",
    helperText: "Choose a new password for your account."
  };
}
function ResetPasswordPage() {
  const search = Route.useSearch();
  const redirectTo = normalizeAuthRedirect(search.redirect);
  const isHostedMode = isHostedClientAuthMode();
  const routeError = getResetPasswordErrorMessage(search.error);
  const token = typeof search.token === "string" ? search.token : null;
  const form = useForm({
    defaultValues: {
      password: "",
      confirmPassword: ""
    },
    validators: {
      onSubmit: resetPasswordSchema
    },
    onSubmit: async ({
      formApi,
      value
    }) => {
      if (!token) {
        formApi.setErrorMap({
          onSubmit: {
            form: "This reset link is no longer valid. Request a new one and try again.",
            fields: {}
          }
        });
        return;
      }
      try {
        const result = await authClient.resetPassword({
          newPassword: value.password,
          token
        });
        if (result.error) {
          formApi.setErrorMap({
            onSubmit: {
              form: "This reset link is no longer valid. Request a new one and try again.",
              fields: {}
            }
          });
          return;
        }
      } catch {
        formApi.setErrorMap({
          onSubmit: {
            form: "We couldn't update your password right now. Please try again.",
            fields: {}
          }
        });
      }
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(form.Subscribe, { selector: (state) => ({
    isComplete: state.isSubmitSuccessful && !state.errorMap.onSubmit,
    submitError: state.errorMap.onSubmit,
    isSubmitting: state.isSubmitting
  }), children: ({
    isComplete,
    submitError,
    isSubmitting
  }) => {
    const errorMessage = getFormError(submitError);
    const pageCopy = getResetPasswordPageCopy({
      isHostedMode,
      isComplete,
      routeError,
      hasToken: !!token
    });
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageCard, { title: pageCopy.title, helperText: pageCopy.helperText, footer: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/sign-in", search: getSignInSearch(redirectTo), className: "text-base-content/50 hover:text-base-content transition-colors", children: "Sign in" }) }), children: !isHostedMode ? null : isComplete ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: redirectTo === "/" ? "/sign-in" : `/sign-in?redirect=${encodeURIComponent(redirectTo)}`, className: "btn btn-soft w-full", children: "Continue to sign in" }) : routeError || !token ? /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/forgot-password", search: getSignInSearch(redirectTo), className: "btn btn-soft w-full", children: "Request a new reset link" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "space-y-4", onSubmit: (event) => {
      event.preventDefault();
      void form.handleSubmit();
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "password", children: (field) => {
        const error = getFieldError(field.state.meta.errors);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", className: "input input-bordered w-full", placeholder: "New password...", value: field.state.value, onChange: (event) => field.handleChange(event.target.value), autoComplete: "new-password", minLength: HOSTED_PASSWORD_MIN_LENGTH, maxLength: HOSTED_PASSWORD_MAX_LENGTH, required: true }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-error", children: error }) : null
        ] });
      } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(form.Field, { name: "confirmPassword", children: (field) => {
        const error = getFieldError(field.state.meta.errors);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "password", className: "input input-bordered w-full", placeholder: "Confirm new password...", value: field.state.value, onChange: (event) => field.handleChange(event.target.value), autoComplete: "new-password", minLength: HOSTED_PASSWORD_MIN_LENGTH, maxLength: HOSTED_PASSWORD_MAX_LENGTH, required: true }),
          error ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-error", children: error }) : null
        ] });
      } }),
      errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: errorMessage }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-soft w-full", disabled: isSubmitting, children: isSubmitting ? "Updating password..." : "Update password" })
    ] }) });
  } }) });
}
export {
  ResetPasswordPage as component
};
