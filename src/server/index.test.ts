import { describe, expect, it } from "vitest";
import worker, { type Env } from "./index";

describe("production API access gate", () => {
  it("fails closed when the internal token is not configured", async () => {
    const response = await worker.fetch(
      new Request("https://pact-api.example.workers.dev/api/health"),
      { APP_ENV: "production" },
    );

    expect(response.status).toBe(503);
  });

  it("rejects direct requests without the frontend service token", async () => {
    const response = await worker.fetch(
      new Request("https://pact-api.example.workers.dev/api/health"),
      { APP_ENV: "production", PACT_API_TOKEN: "expected-token" },
    );

    expect(response.status).toBe(401);
  });

  it("allows authenticated health checks", async () => {
    const response = await worker.fetch(
      new Request("https://pact-api.example.workers.dev/api/health", {
        headers: { "X-Pact-Internal-Token": "expected-token" },
      }),
      {
        APP_ENV: "production",
        PACT_API_TOKEN: "expected-token",
      } satisfies Env,
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      env: "production",
    });
  });
});
