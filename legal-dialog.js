(function () {
  const dialog = document.getElementById("legal-dialog");
  if (!dialog) return;

  const titleEl = dialog.querySelector(".legal-dialog__title");
  const panels = {
    privacy: dialog.querySelector("#legal-privacy"),
    terms: dialog.querySelector("#legal-terms"),
  };

  function showPanel(key) {
    Object.entries(panels).forEach(([id, panel]) => {
      if (!panel) return;
      panel.hidden = id !== key;
    });
  }

  function openLegal(key) {
    const panel = panels[key];
    if (!panel || !titleEl) return;
    titleEl.textContent = panel.dataset.title || "";
    showPanel(key);
    if (!dialog.open) dialog.showModal();
    dialog.querySelector(".legal-dialog__body")?.scrollTo(0, 0);
  }

  function closeLegal() {
    if (dialog.open) dialog.close();
  }

  document.querySelectorAll("[data-open-legal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openLegal(btn.getAttribute("data-open-legal"));
    });
  });

  dialog.querySelectorAll("[data-close-legal]").forEach((btn) => {
    btn.addEventListener("click", closeLegal);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeLegal();
  });

  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    closeLegal();
  });

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
