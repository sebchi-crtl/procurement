export async function fetchWithAutoRefresh(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const doFetch = () =>
    fetch(input, {
      ...init,
      credentials: "include",
    });

  let response = await doFetch();
  if (response.status !== 401) {
    return response;
  }

  const refreshRes = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return response;
  }

  response = await doFetch();
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }
  return response;
}
