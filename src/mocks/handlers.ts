/**
 * MSW Handlers for mocking all backend/API calls in development.
 *
 * Add or modify handlers below to mock any endpoint your app uses.
 * For Supabase REST endpoints, match the URL pattern (e.g., /rest/v1/members).
 * For custom APIs, use the path your frontend calls (e.g., /api/members).
 *
 * See: https://mswjs.io/docs/getting-started/mocks/rest-api
 */
import { http } from "msw";

export const handlers = [
  // Example: Mock Supabase REST endpoint for members
  http.get("https://*/rest/v1/members", () => {
    return Response.json([
      {
        id: "1",
        name: "Alice Example",
        status: "active",
        email: "alice@example.com",
      },
      {
        id: "2",
        name: "Bob Example",
        status: "inactive",
        email: "bob@example.com",
      },
    ]);
  }),

  // Example: Mock Supabase REST endpoint for classes
  http.get("https://*/rest/v1/classes", () => {
    return Response.json([
      {
        id: "101",
        name: "Yoga",
        start_time: "2024-07-05T10:00:00Z",
        end_time: "2024-07-05T11:00:00Z",
      },
      {
        id: "102",
        name: "Pilates",
        start_time: "2024-07-05T12:00:00Z",
        end_time: "2024-07-05T13:00:00Z",
      },
    ]);
  }),

  // Example: Mock Supabase Auth sign-in
  http.post("https://*/auth/v1/token", () => {
    return Response.json({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      user: { id: "user-1", email: "test@example.com" },
    });
  }),

  // Example: Mock any other GET/POST as needed
  // http.get('/api/your-endpoint', ...)
  // http.post('/api/your-endpoint', ...)
];
