import { aL as isHostedClientAuthMode, aN as jsxRuntimeExports, G as object, H as string } from "./index-CSpjggkr.js";
import { i as Route, n as normalizeAuthRedirect, e as useForm, b as authClient, A as AuthPageShell, f as getFormError, a as AuthPageCard, h as getFieldError, L as Link, g as getSignInSearch } from "./router-8qflvY1T.js";
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
const forgotPasswordSchema = object({
  email: string().trim().email("Enter a valid email address.")
});
function ForgotPasswordPage() {
  const search = Route.useSearch();
  const redirectTo = normalizeAuthRedirect(search.redirect);
  const isHostedMode = isHostedClientAuthMode();
  const form = useForm({
    defaultValues: {
      email: ""
    },
    validators: {
      onSubmit: forgotPasswordSchema
    },
    onSubmit: async ({
      formApi,
      value
    }) => {
      try {
        const redirectUrl = new URL("/reset-password", window.location.origin);
        if (redirectTo !== "/") redirectUrl.searchParams.set("redirect", redirectTo);
        const result = await authClient.requestPasswordReset({
          email: value.email.trim(),
          redirectTo: redirectUrl.toString()
        });
        if (result.error) {
          formApi.setErrorMap({
            onSubmit: {
              form: result.error.message || "We couldn't send the reset email.",
              fields: {}
            }
          });
          return;
        }
      } catch {
        formApi.setErrorMap({
          onSubmit: {
            form: "We couldn't send the reset email right now. Please try again.",
            fields: {}
          }
        });
      }
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(form.Subscribe, { selector: (state) => ({
    isSuccess: state.isSubmitSuccessful && !state.errorMap.onSubmit,
    submittedEmail: state.values.email,
    submitError: state.errorMap.onSubmit,
    isSubmitting: state.isSubmitting
  }), children: ({
    isSuccess,
    submittedEmail,
    submitError,
    isSubmitting
  }) => {
    const errorMessage = getFormError(submitError);
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthPageCard, { title: isSuccess ? "Check your email" : "Forgot password", helperText: isSuccess ? `If an account exists for ${submittedEmail}, we sent a reset link.` : isHostedMode ? "Enter your email and we'll send you a password reset link." : "Password reset isn't available right now.", footer: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/sign-in", search: getSignInSearch(redirectTo), className: "text-base-content/50 hover:text-base-content transition-colors", children: "Back to sign in" }) }), children: isSuccess ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "alert alert-success", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "If an account exists for that email, you'll receive password reset instructions shortly." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "space-y-4", onSubmit: (event) => {
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
      errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-error", children: errorMessage }) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn btn-soft w-full", disabled: !isHostedMode || isSubmitting, children: isSubmitting ? "Sending reset link..." : "Send reset link" })
    ] }) });
  } }) });
}
export {
  ForgotPasswordPage as component
};
