(function () {
  const BOOKING_WEB_APP_URL =
    "https://script.google.com/macros/s/AKfycbx1TDqAQAcQaz91wf9tu0bW5kdiZ-P1_d-xSmIrC4gCpNzjNcs-XKaV64DAS1g4n0s9/exec";

  function setFormStatus(form, message, type) {
    const statusEl = form.querySelector(".booking-form__status");
    if (!statusEl) return;
    if (!message) {
      statusEl.hidden = true;
      statusEl.textContent = "";
      statusEl.classList.remove("is-error", "is-success");
      return;
    }
    statusEl.hidden = false;
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", type === "error");
    statusEl.classList.toggle("is-success", type === "success");
    statusEl.classList.toggle("is-loading", type === "loading");
  }

  function setSubmitting(form, isSubmitting) {
    const submitBtn = form.querySelector('[type="submit"]');
    const label = submitBtn?.querySelector(".booking-form__submit-label");
    const loading = submitBtn?.querySelector(".booking-form__submit-loading");

    form.classList.toggle("is-submitting", isSubmitting);
    form.setAttribute("aria-busy", isSubmitting ? "true" : "false");

    if (submitBtn) {
      submitBtn.disabled = isSubmitting;
      submitBtn.setAttribute("aria-busy", isSubmitting ? "true" : "false");
    }

    if (label) label.hidden = isSubmitting;
    if (loading) loading.hidden = !isSubmitting;
  }

  function showBookingSuccessPopup() {
    const dialog = document.getElementById("booking-success-dialog");
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      return;
    }
    window.alert(
      "Thank you for choosing Thao Eyelash. Our team will contact you shortly to confirm your appointment details."
    );
  }

  const successDialog = document.getElementById("booking-success-dialog");
  if (successDialog) {
    if (successDialog.hasAttribute("open")) {
      successDialog.close();
    }
    successDialog.addEventListener("click", (e) => {
      if (e.target === successDialog || e.target.closest("[data-close-booking-success]")) {
        successDialog.close();
      }
    });
  }

  const form = document.querySelector(".booking-form");
  if (!form) return;

  const bookingDateTimeInput = form.querySelector('[name="bookingDateTime"]');
  const bookingDateTimeField = form.querySelector(".booking-datetime-field");

  const syncDateTimeHint = () => {
    if (!bookingDateTimeField || !bookingDateTimeInput) return;
    bookingDateTimeField.classList.toggle("has-value", Boolean(bookingDateTimeInput.value));
  };

  if (bookingDateTimeInput) {
    const openNativePicker = () => {
      if (typeof bookingDateTimeInput.showPicker === "function") {
        try {
          bookingDateTimeInput.showPicker();
        } catch (_err) {
          // Some browsers block showPicker outside trusted gestures.
        }
      }
    };

    syncDateTimeHint();
    bookingDateTimeInput.addEventListener("input", syncDateTimeHint);
    bookingDateTimeInput.addEventListener("change", syncDateTimeHint);
    bookingDateTimeInput.addEventListener("focus", openNativePicker);
    bookingDateTimeInput.addEventListener("click", openNativePicker);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]')?.value.trim() || "";
    const phone = form.querySelector('[name="phone"]')?.value.trim() || "";
    const selectedServices = Array.from(form.querySelectorAll('input[name="service"]:checked')).map(
      (el) => el.value.trim()
    );
    const service = selectedServices.join(", ");
    const bookingDateTime = form.querySelector('[name="bookingDateTime"]')?.value || "";
    const honeypot = form.querySelector('[name="website"]')?.value.trim() || "";
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const serviceList = form.querySelector(".booking-services-list");
    const dateTimeField = form.querySelector(".booking-datetime-field");

    [nameInput, phoneInput, serviceList, dateTimeField].forEach((el) => el?.classList.remove("is-invalid"));

    if (!name || !phone || !service || !bookingDateTime) {
      if (!name) nameInput?.classList.add("is-invalid");
      if (!phone) phoneInput?.classList.add("is-invalid");
      if (!service) serviceList?.classList.add("is-invalid");
      if (!bookingDateTime) dateTimeField?.classList.add("is-invalid");
      setFormStatus(
        form,
        "Please fill in all required fields: name, phone, service(s), and date/time.",
        "error"
      );
      return;
    }

    if (honeypot) {
      setFormStatus(form, "", null);
      return;
    }

    setSubmitting(form, true);
    setFormStatus(form, "Please wait while we send your booking…", "loading");

    try {
      const response = await fetch(BOOKING_WEB_APP_URL, {
        method: "POST",
        redirect: "follow",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          name,
          phone,
          service,
          bookingDateTime,
        }),
      });

      const rawBody = await response.text();
      let result = null;
      try {
        result = rawBody ? JSON.parse(rawBody) : null;
      } catch (_parseErr) {
        result = null;
      }

      if (!response.ok || result?.ok === false) {
        throw new Error(result?.error || `Booking API returned HTTP ${response.status}`);
      }

      setFormStatus(form, "", null);
      showBookingSuccessPopup();
      form.reset();
      syncDateTimeHint();
    } catch (_err) {
      setFormStatus(
        form,
        "We could not send your booking right now. Please try again or contact us on WhatsApp/Zalo.",
        "error"
      );
    } finally {
      setSubmitting(form, false);
    }
  });
})();
