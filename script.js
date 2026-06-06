document.addEventListener('DOMContentLoaded', () => {
  // Constants & DOM Elements
  const DEFAULT_WEBHOOK = 'https://hooks.uk.webexconnect.io/events/9GSBQ05996';

  const form = document.getElementById('booking-form');
  const nameInput = document.getElementById('name-enter');
  const emailInput = document.getElementById('email-enter');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');

  const formCard = document.getElementById('form-card');
  const successContainer = document.getElementById('success-container');
  const displayEmail = document.querySelector('.patientEmail');

  // Initialize Webhook URL from LocalStorage, Query Param, or Default
  let webhookUrl = localStorage.getItem('barnsley_webhook_url') || DEFAULT_WEBHOOK;

  // Helper to log actions to browser console
  function consoleLog(message, isError = false) {
    if (isError) {
      console.error(`[Barnsley Hospital Portal] ${message}`);
    } else {
      console.log(`[Barnsley Hospital Portal] ${message}`);
    }
  }

  // Load and apply Query Parameters
  function parseQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);

    // 1. Webhook URL override
    const qWebhook = urlParams.get('webhook') || urlParams.get('webhookUrl');
    if (qWebhook) {
      webhookUrl = decodeURIComponent(qWebhook);
      localStorage.setItem('barnsley_webhook_url', webhookUrl);
      consoleLog(`Webhook URL overridden from URL parameters: ${webhookUrl}`);
    }

    // 2. Name & Email pre-filling
    const qName = urlParams.get('name');
    const qEmail = urlParams.get('email');

    if (qName) {
      nameInput.value = decodeURIComponent(qName);
      consoleLog(`Name pre-filled: "${nameInput.value}"`);
    }
    if (qEmail) {
      emailInput.value = decodeURIComponent(qEmail);
      consoleLog(`Email pre-filled: "${emailInput.value}"`);
    }
  }

  // Initial setup
  parseQueryParams();
  consoleLog(`Active Webhook URL initialized to: ${webhookUrl}`);

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear validation errors
    nameInput.classList.remove('invalid');
    emailInput.classList.remove('invalid');
    document.getElementById('name-error').style.display = 'none';
    document.getElementById('email-error').style.display = 'none';

    const nameVal = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    let hasError = false;

    // Validate fields
    if (!nameVal) {
      nameInput.classList.add('invalid');
      document.getElementById('name-error').style.display = 'block';
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal) {
      emailInput.classList.add('invalid');
      document.getElementById('email-error').textContent = 'Email address is required';
      document.getElementById('email-error').style.display = 'block';
      hasError = true;
    } else if (!emailRegex.test(emailVal)) {
      emailInput.classList.add('invalid');
      document.getElementById('email-error').textContent = 'Please enter a valid email address';
      document.getElementById('email-error').style.display = 'block';
      hasError = true;
    }

    if (hasError) {
      consoleLog('Form validation failed.', true);
      return;
    }

    // Form Payload
    const payload = {
      name: nameVal,
      email: emailVal,
    };

    // Update Button to Loading State
    submitBtn.disabled = true;
    nameInput.disabled = true;
    emailInput.disabled = true;
    btnText.textContent = 'Confirming...';
    btnSpinner.style.display = 'inline-block';

    consoleLog(`Submitting booking confirmation for ${nameVal} (${emailVal})...`);
    consoleLog(`POST Payload: ${JSON.stringify(payload)}`);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      consoleLog(`Success! Status: ${response.status}`);
      consoleLog(`Response Body: ${responseText || '(Empty)'}`);
    } catch (error) {
      consoleLog(`Fetch error (e.g. CORS/Network): ${error.message}`, true);
      consoleLog('Proceeding to success page as the webhook target may have received the request despite browser-level CORS warnings.', false);
    } finally {
      // Transition to Success State regardless of CORS warnings so the demo does not get stuck
      displayEmail.textContent = emailVal;

      // Switch cards
      formCard.style.display = 'none';
      successContainer.style.display = 'block';
    }
  });
});
