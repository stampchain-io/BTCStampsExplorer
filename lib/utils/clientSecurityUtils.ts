export async function getCSRFToken(): Promise<string> {
  try {
    const response = await fetch("/api/v2/csrf-token");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.token) {
      throw new Error("No token received from server");
    }
    return data.token;
  } catch (error) {
    console.error("Error fetching CSRF token:", error);
    throw error;
  }
}
