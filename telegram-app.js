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
  const profileStatus = document.createElement('span');
  profileStatus.setAttribute('role', 'status');
  profileStatus.textContent = 'Подключаем Telegram…';
  document.querySelector('.notice')?.append(' · ', profileStatus);
  fetch('https://semlys-api.semlissavazov.workers.dev/api/telegram/profile', {
    method: 'POST',
    headers: {'Content-Type': 'text/plain;charset=UTF-8'},
    body: webApp.initData,
    credentials: 'omit',
    redirect: 'error'
  }).then(async response => {
    if (!response.ok) throw new Error('Telegram profile unavailable');
    const {user, isOwner} = await response.json();
    profileStatus.textContent = user.name ? 'Telegram: ' + user.name : 'Telegram подключён';
    if (isOwner) {
      const applyEditorView = enabled => {
        document.documentElement.classList.toggle('semlys-editor-view', enabled);
        try { sessionStorage.setItem('semlys-editor-view', String(enabled)); } catch {}
        viewButton.textContent = enabled ? 'Обычный вид' : 'Простой вид';
        viewButton.setAttribute('aria-pressed', String(enabled));
      };
      const viewButton = document.createElement('button');
      viewButton.type = 'button';
      viewButton.className = 'theme-toggle';
      viewButton.onclick = () => applyEditorView(!document.documentElement.classList.contains('semlys-editor-view'));
      let simpleView = false;
      try { simpleView = sessionStorage.getItem('semlys-editor-view') === 'true'; } catch {}
      applyEditorView(simpleView);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-toggle';
      button.textContent = 'Админка';
      profileStatus.after(' · ', button, ' ', viewButton);
      button.onclick = async () => {
        applyEditorView(true);
        button.disabled = true;
        try {
          const {openCatalogAdmin} = await import('./catalog-admin.js?v=release1');
          await openCatalogAdmin(webApp.initData);
        } catch {
          profileStatus.textContent = 'Не удалось открыть админку. Попробуй ещё раз.';
        } finally {
          button.disabled = false;
        }
      };
    }
  }).catch(() => {
    profileStatus.textContent = 'Вход не удался. Открой магазин заново в Telegram.';
  });
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






