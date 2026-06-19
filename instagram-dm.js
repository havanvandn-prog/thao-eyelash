(function () {
  const USERNAME = "eyelashdanang";
  const DM_URL = `https://ig.me/m/${USERNAME}`;
  const PROFILE_URL = `https://www.instagram.com/${USERNAME}/`;

  const dialog = document.getElementById("instagram-dm-dialog");
  const links = document.querySelectorAll("[data-instagram-dm]");

  if (!links.length) return;

  function isMobile() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function isInAppBrowser() {
    const ua = navigator.userAgent || "";
    return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat|TikTok|BytedanceWebview|musical_ly|WhatsApp|MicroMessenger/i.test(ua);
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  function navigateToAppDm() {
    if (isAndroid()) {
      window.location.href = `intent://ig.me/m/${USERNAME}#Intent;package=com.instagram.android;scheme=https;end`;
      window.setTimeout(() => {
        window.location.href = DM_URL;
      }, 1200);
      return;
    }

    window.location.href = DM_URL;
  }

  function openDialog() {
    if (dialog && !dialog.open) dialog.showModal();
  }

  function closeDialog() {
    if (dialog?.open) dialog.close();
  }

  function handleInstagramClick(event) {
    event.preventDefault();

    if (!isMobile()) {
      window.open(PROFILE_URL, "_blank", "noopener,noreferrer");
      return;
    }

    if (isInAppBrowser()) {
      openDialog();
      return;
    }

    navigateToAppDm();
  }

  links.forEach((link) => {
    link.addEventListener("click", handleInstagramClick);
  });

  dialog?.querySelector("[data-instagram-open]")?.addEventListener("click", () => {
    closeDialog();
    navigateToAppDm();
  });

  dialog?.querySelector("[data-instagram-copy]")?.addEventListener("click", async () => {
    const copyBtn = dialog.querySelector("[data-instagram-copy]");
    const originalLabel = copyBtn?.textContent || "Copy link";

    try {
      await navigator.clipboard.writeText(DM_URL);
      if (copyBtn) {
        copyBtn.textContent = "Link copied";
        window.setTimeout(() => {
          copyBtn.textContent = originalLabel;
        }, 2000);
      }
    } catch (_) {
      window.prompt("Copy this link and open it in Safari or Chrome:", DM_URL);
    }
  });

  dialog?.querySelectorAll("[data-close-instagram-dm]").forEach((btn) => {
    btn.addEventListener("click", closeDialog);
  });

  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
})();
