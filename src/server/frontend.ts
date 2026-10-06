interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface FrontendEnv {
  ASSETS: Fetcher;
  API: Fetcher;
  PACT_ACCESS_PASSWORD?: string;
  PACT_API_TOKEN?: string;
}

const unauthorized = () =>
  new Response("Pact sign-in required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Pact", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });

const constantTimeEqual = (left: string, right: string): boolean => {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.length !== rightBytes.length) return false;

  let difference = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }
  return difference === 0;
};

const isAuthorized = (request: Request, password: string): boolean => {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Basic ")) return false;

  try {
    const credentials = atob(authorization.slice(6));
    const separator = credentials.indexOf(":");
    if (separator < 0 || credentials.slice(0, separator) !== "pact") {
      return false;
    }
    return constantTimeEqual(credentials.slice(separator + 1), password);
  } catch {
    return false;
  }
};

export default {
  async fetch(request: Request, env: FrontendEnv): Promise<Response> {
    if (!env.PACT_ACCESS_PASSWORD || !env.PACT_API_TOKEN) {
      return new Response("Pact deployment secrets are not configured.", {
        status: 503,
      });
    }

    if (!isAuthorized(request, env.PACT_ACCESS_PASSWORD)) {
      return unauthorized();
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const headers = new Headers(request.headers);
      headers.delete("Authorization");
      headers.set("X-Pact-Internal-Token", env.PACT_API_TOKEN);
      return env.API.fetch(new Request(request, { headers }));
    }

    const headers = new Headers(request.headers);
    headers.delete("Authorization");
    return env.ASSETS.fetch(new Request(request, { headers }));
  },
};
