(() => {
  const config = window.ELDERCARE_CONFIG || {};
  const apiBaseUrl = String(config.apiBaseUrl || "https://eldercare-api-vaee.onrender.com").replace(/\/+$/, "");
  const status = document.getElementById("api-status");
  const statusHeading = document.getElementById("api-status-heading");
  const downloadLink = document.getElementById("download-link");
  const downloadHeading = document.getElementById("download-heading");
  const downloadMessage = document.getElementById("download-message");

  function showStatus(available) {
    if (!status || !statusHeading) return;
    if (available) {
      statusHeading.textContent = "API reachable";
      status.textContent = "The API health endpoint responded. This does not confirm Firebase authentication, account roles, or care data are enabled.";
      status.dataset.state = "available";
    } else {
      statusHeading.textContent = "Service temporarily unavailable";
      status.textContent = "The API health check did not succeed. Sign-in and care data are unavailable; the website has not fallen back to demo records.";
      status.dataset.state = "unavailable";
    }
  }

  async function checkApi() {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${apiBaseUrl}/api/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      });
      if (!response.ok) return false;
      const body = await response.json();
      return body && body.ok === true;
    } catch {
      return false;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function configureDownload() {
    if (!downloadLink) return;
    let url;
    try {
      url = new URL(String(config.downloadUrl || ""));
    } catch {
      url = null;
    }
    if (!url || url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      downloadLink.href = "#download";
      downloadLink.setAttribute("aria-disabled", "true");
      downloadLink.textContent = "APK not available";
      if (downloadHeading) downloadHeading.textContent = "Test build not yet available.";
      if (downloadMessage) downloadMessage.textContent = "A download link will appear only after an approved build has been validated.";
      return;
    }
    downloadLink.href = url.toString();
    downloadLink.target = "_blank";
    downloadLink.rel = "noopener noreferrer";
    downloadLink.removeAttribute("aria-disabled");
    downloadLink.textContent = "Download approved build";
    if (downloadHeading) downloadHeading.textContent = "Download the approved test build.";
    if (downloadMessage) downloadMessage.textContent = "This link is configured for distribution. Confirm the artifact is current before sharing.";
  }

  if (status) void checkApi().then(showStatus);
  configureDownload();
})();
