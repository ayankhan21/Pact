import { describe, expect, it, vi } from "vitest";
import frontend from "./frontend";

describe("frontend Worker access gate", () => {
  const makeRequest = (authorization?: string) =>
    new Request("https://pact-web.example.workers.dev/", {
      headers: authorization ? { Authorization: authorization } : undefined,
    });

  const makeEnv = () => ({
    ASSETS: {
      fetch: vi.fn(async (_request: Request) => new Response("app")),
    },
    API: {
      fetch: vi.fn(async (_request: Request) => new Response("api")),
    },
    PACT_ACCESS_PASSWORD: "local-test-password",
    PACT_API_TOKEN: "local-test-token",
  });

  it("fails closed when deployment secrets are missing", async () => {
    const env = makeEnv();
    env.PACT_ACCESS_PASSWORD = "";

    const response = await frontend.fetch(makeRequest(), env);

    expect(response.status).toBe(503);
    expect(env.ASSETS.fetch).not.toHaveBeenCalled();
  });

  it("challenges requests without the single-user password", async () => {
    const response = await frontend.fetch(makeRequest(), makeEnv());

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain("Basic");
  });

  it("serves assets after valid Basic authentication", async () => {
    const env = makeEnv();
    const authorization = `Basic ${btoa("pact:local-test-password")}`;

    const response = await frontend.fetch(makeRequest(authorization), env);

    expect(response.status).toBe(200);
    expect(env.ASSETS.fetch).toHaveBeenCalledOnce();
    const assetRequest = env.ASSETS.fetch.mock.calls[0][0];
    expect(assetRequest.headers.has("Authorization")).toBe(false);
  });

  it("proxies API calls with an internal token, not browser credentials", async () => {
    const env = makeEnv();
    const authorization = `Basic ${btoa("pact:local-test-password")}`;
    const request = new Request(
      "https://pact-web.example.workers.dev/api/tasks",
      {
        headers: { Authorization: authorization },
      },
    );

    const response = await frontend.fetch(request, env);

    expect(response.status).toBe(200);
    expect(env.API.fetch).toHaveBeenCalledOnce();
    const apiRequest = env.API.fetch.mock.calls[0][0];
    expect(apiRequest.headers.get("X-Pact-Internal-Token")).toBe(
      "local-test-token",
    );
    expect(apiRequest.headers.has("Authorization")).toBe(false);
  });
});
