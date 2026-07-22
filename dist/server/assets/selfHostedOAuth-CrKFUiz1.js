import { Q as getGscOAuthClientConfig, R as AppError, S as getAuth, T as db, U as account, V as and, W as eq, X as GSC_OAUTH_PROVIDER_ID, G as object, Y as number, H as string, Z as decodeJwt, a0 as GSC_OAUTH_SCOPES, a1 as symmetricEncrypt, L as hasSelfHostedGscConfig } from "./index-CSpjggkr.js";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const oauthStateSchema = object({
  userId: string().min(1),
  callbackPath: string().min(1),
  exp: number().int()
});
const googleTokenResponseSchema = object({
  access_token: string().min(1),
  expires_in: number().optional(),
  refresh_token: string().optional(),
  scope: string().optional(),
  id_token: string().optional(),
  token_type: string().optional()
});
const googleIdTokenSchema = object({
  sub: string().min(1)
});
function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
function base64UrlToBytes(value) {
  const padded = `${value}${"=".repeat((4 - value.length % 4) % 4)}`;
  const binary = atob(padded.replaceAll("-", "+").replaceAll("_", "/"));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
async function getStateKey(clientSecret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`openseo:gsc:${clientSecret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}
async function signState(payload, clientSecret) {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await getStateKey(clientSecret),
    new TextEncoder().encode(payload)
  );
  return bytesToBase64Url(new Uint8Array(signature));
}
function getSafeCallbackPath(callbackURL, publicOrigin) {
  try {
    const url = new URL(callbackURL, publicOrigin);
    if (url.origin !== publicOrigin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}
async function createState(input) {
  const payload = bytesToBase64Url(
    new TextEncoder().encode(
      JSON.stringify({
        userId: input.userId,
        callbackPath: getSafeCallbackPath(
          input.callbackURL,
          input.publicOrigin
        ),
        exp: Date.now() + 10 * 60 * 1e3
      })
    )
  );
  const signature = await signState(payload, input.clientSecret);
  return `${payload}.${signature}`;
}
async function verifyState(state, clientSecret) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) {
    throw new AppError("VALIDATION_ERROR", "Invalid Search Console state");
  }
  const ok = await crypto.subtle.verify(
    "HMAC",
    await getStateKey(clientSecret),
    base64UrlToBytes(signature),
    new TextEncoder().encode(payload)
  );
  if (!ok) {
    throw new AppError("VALIDATION_ERROR", "Invalid Search Console state");
  }
  const parsed = oauthStateSchema.parse(
    JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)))
  );
  if (parsed.exp < Date.now()) {
    throw new AppError("VALIDATION_ERROR", "Expired Search Console state");
  }
  return parsed;
}
function getRedirectUri(publicOrigin) {
  return `${publicOrigin}/api/gsc/oauth/callback`;
}
function accessTokenExpiresAt(tokens) {
  return new Date(Date.now() + (tokens.expires_in ?? 3600) * 1e3);
}
function storedScope(tokens) {
  return tokens.scope ? tokens.scope.trim().split(/\s+/).join(",") : GSC_OAUTH_SCOPES.join(",");
}
function getGoogleAccountId(tokens) {
  if (!tokens.id_token) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Google did not return an ID token for Search Console."
    );
  }
  return googleIdTokenSchema.parse(decodeJwt(tokens.id_token)).sub;
}
async function upsertGrant(input) {
  const ctx = await getAuth().$context;
  const encrypt = (value) => ctx.options.account?.encryptOAuthTokens ? symmetricEncrypt({ key: ctx.secretConfig, data: value }) : value;
  const googleAccountId = getGoogleAccountId(input.tokens);
  const existing = await db.select({ id: account.id, refreshToken: account.refreshToken }).from(account).where(
    and(
      eq(account.userId, input.user.userId),
      eq(account.providerId, GSC_OAUTH_PROVIDER_ID),
      eq(account.accountId, googleAccountId)
    )
  ).limit(1);
  const accountValues = {
    accountId: googleAccountId,
    providerId: GSC_OAUTH_PROVIDER_ID,
    userId: input.user.userId,
    accessToken: await encrypt(input.tokens.access_token),
    // A fresh refresh token is encrypted here; an absent one falls back to the
    // already-encrypted value stored on the existing grant.
    refreshToken: input.tokens.refresh_token ? await encrypt(input.tokens.refresh_token) : existing[0]?.refreshToken ?? null,
    idToken: input.tokens.id_token ? await encrypt(input.tokens.id_token) : null,
    accessTokenExpiresAt: accessTokenExpiresAt(input.tokens),
    refreshTokenExpiresAt: null,
    scope: storedScope(input.tokens),
    password: null
  };
  if (existing[0]) {
    await db.update(account).set({ ...accountValues, updatedAt: /* @__PURE__ */ new Date() }).where(eq(account.id, existing[0].id));
    return;
  }
  await db.insert(account).values({
    id: crypto.randomUUID(),
    ...accountValues,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  });
}
async function exchangeCode(input) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: input.clientId,
      client_secret: input.clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code"
    })
  });
  if (!response.ok) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Google rejected the Search Console authorization code."
    );
  }
  return googleTokenResponseSchema.parse(await response.json());
}
async function createSelfHostedGscAuthorizationUrl(input) {
  const config = await getGscOAuthClientConfig();
  if (!config || !await hasSelfHostedGscConfig()) {
    throw new AppError(
      "AUTH_CONFIG_MISSING",
      "Search Console is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and BETTER_AUTH_SECRET."
    );
  }
  const redirectUri = getRedirectUri(input.publicOrigin);
  const state = await createState({
    clientSecret: config.clientSecret,
    userId: input.user.userId,
    callbackURL: input.callbackURL,
    publicOrigin: input.publicOrigin
  });
  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GSC_OAUTH_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "select_account consent");
  url.searchParams.set("state", state);
  return url.toString();
}
async function handleSelfHostedGscOAuthCallback(input) {
  const config = await getGscOAuthClientConfig();
  if (!config) {
    return new Response("Missing Google Search Console OAuth configuration", {
      status: 500
    });
  }
  const url = new URL(input.request.url);
  const stateParam = url.searchParams.get("state");
  if (!stateParam) {
    return new Response("Missing Search Console OAuth state", { status: 400 });
  }
  const state = await verifyState(stateParam, config.clientSecret);
  if (state.userId !== input.user.userId) {
    return new Response("Search Console OAuth user mismatch", { status: 403 });
  }
  const redirectToCallback = () => new Response(null, {
    status: 303,
    headers: { Location: state.callbackPath }
  });
  if (url.searchParams.get("error")) {
    return redirectToCallback();
  }
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing Search Console OAuth code", { status: 400 });
  }
  const tokens = await exchangeCode({
    code,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: getRedirectUri(input.publicOrigin)
  });
  await upsertGrant({ user: input.user, tokens });
  return redirectToCallback();
}
export {
  createSelfHostedGscAuthorizationUrl as c,
  handleSelfHostedGscOAuthCallback as h
};
