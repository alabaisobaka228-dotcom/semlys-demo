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
  const notice = document.querySelector('.notice');
  const header = document.querySelector('.header');
  profileStatus.setAttribute('role', 'status');
  profileStatus.textContent = 'Подключаем Telegram…';
  notice?.append(' · ', profileStatus);
  let profileFailure = 'Не удалось связаться с сервером. Открой магазин заново в Telegram.';
  fetch('https://semlys-api.semlissavazov.workers.dev/api/telegram/profile', {
    method: 'POST',
    headers: {'Content-Type': 'text/plain;charset=UTF-8'},
    body: webApp.initData,
    credentials: 'omit',
    redirect: 'error',
    signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined
  }).then(async response => {
    if (response.status === 401) profileFailure = 'Сеанс Telegram не подтверждён. Закрой магазин и открой через кнопку бота.';
    if (response.status >= 500) profileFailure = 'Сервер входа временно недоступен.';
    if (!response.ok) throw new Error('Telegram profile unavailable');
    const {user, isOwner} = await response.json();
    profileStatus.textContent = (user.name ? 'Telegram: ' + user.name : 'Telegram подключён') +
      (isOwner ? '' : ' · Гостевой доступ');
    addNewsSubscription();
    if (isOwner === true) {
      root.classList.add('semlys-owner');
      const applyEditorView = enabled => {
        document.documentElement.classList.toggle('semlys-editor-view', enabled);
        try { sessionStorage.setItem('semlys-editor-view', String(enabled)); } catch {}
        viewButton.textContent = enabled ? 'Выйти из редактирования' : 'Режим редактирования';
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
      button.textContent = 'Управление каталогом';
      const controls = document.createElement('div');
      controls.className = 'telegram-owner-controls';
      controls.append(button, viewButton);
      (header || notice)?.append(controls);
      async function openEditor(selection = {}) {
        if (button.disabled) return;
        const active = document.querySelector('dialog[open]');
        if (active) {
          if (!active.classList.contains('owner-inline-editor') ||
              !active.dispatchEvent(new Event('cancel', {cancelable:true}))) return;
          active.close();
          if (active.dataset.catalogChanged === 'true') return;
        }
        applyEditorView(true);
        button.disabled = true;
        try {
          const {openCatalogAdmin} = await import('./catalog-admin.js?v=section-gallery1');
          await openCatalogAdmin(webApp.initData, {mount:editorArea, ...selection});
        } catch {
          button.textContent = 'Повторить вход';
          profileStatus.textContent = 'Не удалось загрузить админку. Попробуй ещё раз.';
        } finally {
          button.disabled = false;
        }
      }
      const editorArea = document.createElement('div');
      document.querySelector('main')?.prepend(editorArea);
      button.onclick = () => openEditor({});
      for (const [tab, label] of [['texts','Управление текстом'],['news','Рассылка']]) {
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'theme-toggle';
        action.textContent = label;
        action.onclick = () => openEditor({tab});
        controls.append(action);
      }
      document.addEventListener('semlys:edit-product', event => openEditor(event.detail));
      document.addEventListener('semlys:delete-category', async event => {
        const {categoryId, button: action} = event.detail;
        if (action.disabled) return;
        const feedback = action.nextElementSibling?.matches('[data-category-status]')
          ? action.nextElementSibling : document.createElement('span');
        feedback.dataset.categoryStatus = '';
        feedback.setAttribute('role', 'status');
        action.after(feedback);
        action.disabled = true;
        feedback.textContent = 'Удаляем…';
        try {
          const response = await fetch('https://semlys-api.semlissavazov.workers.dev/api/catalog', {
            method:'POST', redirect:'error',
            body:JSON.stringify({type:'delete_category',id:categoryId,initData:webApp.initData})
          });
          if (response.status === 401) {
            feedback.textContent = 'Сеанс истёк. Открой магазин заново в Telegram.';
            return;
          }
          if (!response.ok) throw Error();
          const url = new URL(location.href);
          if (url.searchParams.get('cat') === String(categoryId)) {
            url.searchParams.delete('cat');
            url.searchParams.delete('sub');
          } else if (url.searchParams.get('sub') === String(categoryId)) url.searchParams.delete('sub');
          try { sessionStorage.setItem('semlys-category-deleted','1'); } catch {}
          history.replaceState(history.state,'',url);
          location.reload();
        } catch {
          feedback.textContent = 'Не удалось удалить раздел. Попробуй ещё раз.';
        } finally {
          action.disabled = false;
        }
      });
      try {
        if (sessionStorage.getItem('semlys-category-deleted') === '1') {
          sessionStorage.removeItem('semlys-category-deleted');
          const status = document.createElement('p');
          status.setAttribute('role','status');
          status.textContent = 'Раздел удалён.';
          document.querySelector('#categories .section-heading')?.after(status);
        }
      } catch {}
      const heading = document.querySelector('.catalog-page #products .section-heading');
      if (heading) {
        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'theme-toggle catalog-owner-action';
        add.textContent = 'Добавить товар';
        add.onclick = () => {
          const filters = new URLSearchParams(location.search);
          const categoryId = Number(filters.get('sub') || filters.get('cat'));
          openEditor({categoryId: categoryId || undefined});
        };
        heading.append(add);
        const categories = document.querySelector('#categories .section-heading');
        for (const [section, label] of [['category','Добавить категорию'],['subcategory','Добавить подкатегорию']]) {
          const action = document.createElement('button');
          action.type = 'button';
          action.className = 'theme-toggle catalog-owner-action';
          action.textContent = label;
          action.onclick = () => openEditor({section});
          categories?.append(action);
        }
      }
    }
  }).catch(() => {
    profileStatus.textContent = profileFailure;
  });
  async function addNewsSubscription() {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const update = async enabled => {
      const response = await fetch('https://semlys-api.semlissavazov.workers.dev/api/news/subscription', {
        method:'POST', redirect:'error', body:JSON.stringify({initData:webApp.initData, enabled})
      });
      if (!response.ok) throw Error();
      return (await response.json()).subscribed;
    };
    let subscribed;
    try { subscribed = await update(); } catch { return; }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    const status = document.createElement('span');
    status.setAttribute('role','status');
    const refresh = () => { button.textContent = subscribed ? 'Отписаться от новостей' : 'Получать новости в Telegram'; };
    refresh();
    footer.append(button, status);
    button.onclick = async () => {
      button.disabled = true;
      try {
        if (!subscribed && typeof webApp.requestWriteAccess === 'function') {
          const allowed = await new Promise(resolve => webApp.requestWriteAccess(resolve));
          if (!allowed) { status.textContent = 'Подписка не включена.'; return; }
        } else if (!subscribed) {
          status.textContent = 'Обнови Telegram, чтобы подписаться.';
          return;
        }
        subscribed = await update(!subscribed);
        refresh();
        status.textContent = subscribed ? 'Подписка включена.' : 'Подписка отключена.';
      } catch {
        status.textContent = 'Не удалось обновить подписку. Открой магазин заново.';
      } finally {
        button.disabled = false;
      }
    };
  }
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













