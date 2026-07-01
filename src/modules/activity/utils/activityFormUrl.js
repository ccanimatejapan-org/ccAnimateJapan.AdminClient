const webClientBaseUrl = (
  import.meta.env.VITE_WEB_CLIENT_BASE_URL || 'https://cc-animate-japan-web-client.vercel.app'
).replace(/\/+$/, '')

// Front-end (WebClient) public form link for an activity, used by the "copy form link" action.
export const buildActivityFormUrl = (activityId) =>
  `${webClientBaseUrl}/activity/${encodeURIComponent(String(activityId))}`
