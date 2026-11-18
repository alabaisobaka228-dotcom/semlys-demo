(function () {
  const webApp = window.Telegram && window.Telegram.WebApp;
  const localPreview = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:';
  const previewRequested = new URLSearchParams(location.search).get('preview') === '1';
  if (previewRequested) { try { sessionStorage.setItem('semlys-client-preview', '1'); } catch (_) {} }
  let previewSession = false;
  try { previewSession = sessionStorage.getItem('semlys-client-preview') === '1'; } catch (_) {}
  const clientPreview = previewRequested || previewSession;
  const launchedByTelegram = Boolean(webApp && webApp.initData);

  if (!launchedByTelegram) {
    if (!localPreview && !clientPreview && document.body.hasAttribute('data-telegram-entry')) {
      document.body.classList.add('telegram-locked');
      const gate = document.querySelector('#telegram-gate');
      if (gate) gate.hidden = false;
    }
    if (clientPreview) document.body.classList.add('client-preview');
    return;
  }

  const root = document.documentElement;
  root.classList.add('telegram-app');
  document.body.classList.add('telegram-authorized');

  function applyTelegramTheme() {
    const dark = webApp.colorScheme === 'dark';
    root.dataset.theme = dark ? 'dark' : 'light';
    try { localStorage.setItem('semlys-theme', dark ? 'dark' : 'light'); } catch (_) {}

    const toggle = document.querySelector('#theme-toggle');
    if (toggle) {
      toggle.textContent = dark ? '☀ Светлая' : '☾ Тёмная';
      toggle.setAttribute('aria-pressed', String(dark));
    }

    const background = dark ? '#101010' : '#ececee';
    if (webApp.setHeaderColor) webApp.setHeaderColor(background);
    if (webApp.setBackgroundColor) webApp.setBackgroundColor(background);
    if (webApp.setBottomBarColor) webApp.setBottomBarColor(background);
  }

  function updateBackButton() {
    const dialogOpen = Boolean(document.querySelector('dialog[open]'));
    const isInnerPage = document.body.classList.contains('catalog-page');
    if (dialogOpen || isInnerPage) webApp.BackButton.show();
    else webApp.BackButton.hide();
  }

  function goBack() {
    const dialog = document.querySelector('dialog[open]');
    if (dialog) {
      dialog.close();
      updateBackButton();
      return;
    }
    if (document.body.classList.contains('catalog-page')) {
      location.href = 'index.html';
      return;
    }
    webApp.close();
  }

  webApp.ready();
  webApp.expand();
  applyTelegramTheme();
  webApp.onEvent('themeChanged', applyTelegramTheme);
  webApp.BackButton.onClick(goBack);

  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;

    if (href.startsWith('https://t.me/') || href.startsWith('tg://')) {
      event.preventDefault();
      webApp.openTelegramLink(link.href);
    } else if (/^https?:\/\//i.test(href)) {
      event.preventDefault();
      webApp.openLink(link.href);
    }
  });

  const dialogs = new MutationObserver(updateBackButton);
  dialogs.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
  addEventListener('pageshow', updateBackButton);
  updateBackButton();
})();
