(() => {
  const key = 'semlys-visual-v2';
  const store = semlysHistory.open(key);
  let saved = {};
  try { saved = store.read().current; } catch {}
  const textTargets = '.hero h2,.hero p,.hero-meta span,.section-heading h2,.info-copy h2,[data-store],.catalog-title,.demo-product h3,.demo-product p,.catalog-filter summary';
  const fields = [...document.querySelectorAll(textTargets)].map((node, index) => {
    const card = node.closest('[data-item-id]');
    const field = card ? 'item:' + card.dataset.itemId + ':' + [...card.children].indexOf(node)
      : 'text:' + location.pathname + ':' + index;
    return [field, node];
  });
  const photos = [...document.querySelectorAll('.demo-product .product-image,#store-image')].map(node => [
    node.id ? 'store-photo' : 'photo:' + node.closest('button').dataset.itemId, node
  ]);
  function showPhoto(node, source) {
    let image = node.querySelector('.visual-photo');
    if (!image) {
      image = new Image();
      image.className = 'visual-photo';
      image.alt = '';
      node.append(image);
    }
    image.src = source;
  }
  const storeSettingsKey = 'semlys-store-settings';
  function applyLegacyStoreFields() {
    try {
      if (localStorage.getItem(storeSettingsKey) !== null) return;
    } catch { return; }
    for (const [name, node] of fields) {
      if (node.hasAttribute('data-store') && typeof saved[name] === 'string') node.textContent = saved[name];
    }
    for (const [name, node] of photos) {
      if (node.id === 'store-image' && saved[name]) showPhoto(node, saved[name]);
    }
  }
  applyLegacyStoreFields();
  addEventListener('pageshow', applyLegacyStoreFields);
  for (const [name, node] of fields) {
    if (!node.hasAttribute('data-store') && typeof saved[name] === 'string') node.textContent = saved[name];
  }
  for (const [name, node] of photos) {
    if (node.id !== 'store-image' && saved[name]) showPhoto(node, saved[name]);
  }
  const editorSessionKey = 'semlys-demo-editor-unlocked';
  let unlocked = false;
  try { unlocked = sessionStorage.getItem(editorSessionKey) === '1'; } catch {}
  const currentPage = new URL(location.href);
  const editMode = currentPage.searchParams.get('edit') === '1' || unlocked;
  addEventListener('storage', event => {
    if (event.key === storeSettingsKey) document.querySelector('#store-image .visual-photo')?.remove();
    if (event.key === key && !editMode) location.reload();
  });
  if (!editMode) return;

  if (currentPage.searchParams.get('edit') !== '1') {
    currentPage.searchParams.set('edit', '1');
    try { history.replaceState(history.state, '', currentPage); } catch {}
  }

  for (const link of document.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href');
    if (!href || !/^(?:#|(?:index|products)\.html(?:[?#]|$))/.test(href)) continue;
    const url = new URL(href, currentPage);
    url.searchParams.set('edit', '1');
    link.setAttribute('href', url.pathname.split('/').pop() + url.search + url.hash);
  }

  const bar = document.createElement('form');
  bar.className = 'visual-toolbar';
  bar.innerHTML = '<label>Демо-пароль <input type="password" required></label><button>Войти</button><output role="status"></output>';
  document.body.prepend(bar);
  bar.onsubmit = event => {
    event.preventDefault();
    if (bar.querySelector('input').value !== 'SEMLYS-demo') {
      bar.querySelector('output').textContent = 'Неверный пароль.';
      return;
    }
    try { sessionStorage.setItem(editorSessionKey, '1'); } catch {}
    enableEditor();
  };

  function enableEditor() {
    bar.onsubmit = event => event.preventDefault();
    bar.innerHTML = '<strong>Редактирование SEMLYS</strong><button type="button">Сохранить изменения</button><a>К витрине</a><a href="admin.html">Настройки магазина</a><details><summary>История сохранений</summary></details><button type="button" data-editor-logout>Выйти</button><output role="status"></output>';
    const view = new URL(location.href);
    view.searchParams.delete('edit');
    const storefront = bar.querySelector('a');
    storefront.href = view.href;
    storefront.onclick = event => {
      event.preventDefault();
      try { sessionStorage.removeItem(editorSessionKey); } catch {}
      location.assign(view.href);
    };
    bar.querySelector('[data-editor-logout]').onclick = () => {
      try { sessionStorage.removeItem(editorSessionKey); } catch {}
      location.reload();
    };
    const status = bar.querySelector('output');
    const save = bar.querySelector('button');
    const pending = new Set();
    const entrance = document.querySelector('#store-image');
    if (entrance) {
      const photoStore = semlysHistory.open(storeSettingsKey);
      const label = document.createElement('label');
      label.className = 'visual-picker';
      label.textContent = 'Фото входа ';
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      label.append(input);
      const savePhoto = document.createElement('button');
      savePhoto.type = 'button';
      savePhoto.textContent = 'Сохранить фото входа';
      savePhoto.disabled = true;
      const controls = document.createElement('div');
      const photoStatus = document.createElement('output');
      photoStatus.setAttribute('role', 'status');
      controls.append(label, savePhoto, photoStatus);
      entrance.parentElement.after(controls);
      let photo;
      input.onchange = async () => {
        const file = input.files[0];
        savePhoto.disabled = true;
        photoStatus.textContent = '';
        if (!file) return;
        if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 25 * 1024 * 1024) {
          photoStatus.textContent = 'Выбери JPEG, PNG или WebP до 25 МБ.';
          return;
        }
        try {
          const bitmap = await createImageBitmap(file);
          const canvas = document.createElement('canvas');
          try {
            const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
            canvas.width = Math.max(1, Math.round(bitmap.width * scale));
            canvas.height = Math.max(1, Math.round(bitmap.height * scale));
            const context = canvas.getContext('2d', {alpha: false});
            context.fillStyle = '#fff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          } finally {
            bitmap.close();
          }
          if (input.files[0] !== file) return;
          photo = canvas.toDataURL('image/jpeg', 0.82);
          showPhoto(entrance, photo);
          savePhoto.disabled = false;
          photoStatus.textContent = 'Фото готово к сохранению.';
        } catch {
          if (input.files[0] === file) photoStatus.textContent = 'Не удалось открыть фото.';
        }
      };
      savePhoto.onclick = () => {
        try {
          photoStore.save(current => ({...current, photo}));
          entrance.querySelector('.visual-photo')?.remove();
          dispatchEvent(new Event('semlys-store-photo-saved'));
          savePhoto.disabled = true;
          photoStatus.textContent = 'Фото входа сохранено.';
        } catch {
          photoStatus.textContent = 'Не удалось сохранить фото. Попробуй файл меньшего размера.';
        }
      };
    }
    const refreshHistory = semlysHistory.mount(
      bar.querySelector('details'), store, status, () => location.reload()
    );
    const draft = {};
    if (document.body.classList.contains('catalog-page')) {
      for (const [section, isProduct] of [['categories', false], ['products', true]]) {
        const title = isProduct ? 'Добавить товар' : 'Добавить категорию';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'theme-toggle';
        button.textContent = title;
        document.querySelector(`#${section} .section-heading`).append(button);
        const dialog = document.createElement('dialog');
        dialog.className = 'demo-dialog';
        dialog.setAttribute('aria-label', title);
        dialog.innerHTML = `<form class="demo-dialog-inner">
          <h2>${title}</h2>
          <p><label>Название <input name="title" required maxlength="100"></label></p>
          ${isProduct ? '<p><label>Категория <select name="category" required></select></label></p><p><label>Бренд <input name="brand" maxlength="80"></label></p><p><label>Описание <textarea name="description" maxlength="500"></textarea></label></p>' : ''}
          <button type="submit">Добавить и сохранить</button>
          <button type="button">Отмена</button>
          <p role="status"></p>
        </form>`;
        document.body.append(dialog);
        const form = dialog.querySelector('form');
        const message = form.querySelector('[role="status"]');
        if (isProduct) categoryNames.forEach((name, id) => form.elements.category.add(new Option(name, id)));
        button.onclick = () => {
          form.reset();
          message.textContent = '';
          dialog.showModal();
        };
        form.querySelector('[type="button"]').onclick = () => dialog.close();
        form.onsubmit = event => {
          event.preventDefault();
          if (pending.size) {
            message.textContent = 'Дождись подготовки фото.';
            return;
          }
          const name = form.elements.title.value.trim();
          if (!name) {
            message.textContent = 'Введи название.';
            return;
          }
          if (!isProduct && categoryNames.some(category => category.toLowerCase() === name.toLowerCase())) {
            message.textContent = 'Такая категория уже есть.';
            return;
          }
          try {
            store.save(current => {
              const catalog = current.catalog || {categories: [], items: []};
              const categories = [...catalog.categories];
              const items = [...catalog.items];
              if (isProduct) {
                const brand = form.elements.brand.value.trim();
                items.push({name, brand, group: brand, category: Number(form.elements.category.value), description: form.elements.description.value.trim()});
              } else {
                categories.push(name);
              }
              return {...current, ...draft, catalog: {categories, items}};
            });
            const next = new URL(location.href);
            next.search = '?edit=1';
            next.hash = section;
            location.replace(next);
            if (next.pathname === location.pathname && next.search === location.search) location.reload();
          } catch {
            message.textContent = 'Не удалось сохранить изменения в браузере.';
          }
        };
      }
    }
    for (const [name, node] of fields) {
      if (node.hasAttribute('data-store')) continue;
      node.contentEditable = 'plaintext-only';
      node.classList.add('visual-editable');
      node.onclick = event => { event.preventDefault(); event.stopPropagation(); node.focus(); };
      node.oninput = () => { draft[name] = node.textContent; };
    }
    for (const [name, node] of photos) {
      if (node.id === 'store-image') continue;
      node.classList.add('visual-upload');
      const label = document.createElement('label');
      label.textContent = 'Загрузить фото';
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp';
      label.append(input);
      const card = node.closest('.demo-product');
      if (card) {
        const slot = document.createElement('div');
        slot.className = 'visual-card-slot';
        card.before(slot);
        slot.append(card, label);
      } else {
        node.after(label);
      }
      label.className = 'visual-picker';
      label.onclick = event => event.stopPropagation();
      input.onchange = async () => {
        pending.delete(input);
        save.disabled = pending.size > 0;
        const file = input.files[0];
        if (!file) return;
        if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
          status.textContent = 'Выбери JPEG, PNG или WebP до 2 МБ.';
          return;
        }
        const reader = new FileReader();
        pending.add(input);
        save.disabled = true;
        reader.onload = () => {
          if (input.files[0] !== file) return;
          pending.delete(input);
          save.disabled = pending.size > 0;
          draft[name] = reader.result;
          showPhoto(node, reader.result);
          status.textContent = 'Фото добавлено. Нажми «Сохранить».';
        };
        reader.onerror = () => {
          if (input.files[0] !== file) return;
          pending.delete(input);
          save.disabled = pending.size > 0;
          status.textContent = 'Не удалось прочитать фото.';
        };
        reader.readAsDataURL(file);
      };
    }
    save.onclick = () => {
      try {
        store.save(current => ({...current, ...draft}));
        Object.keys(draft).forEach(name => delete draft[name]);
        refreshHistory();
        status.textContent = 'Сохранено в этом браузере.';
      } catch {
        status.textContent = 'Не удалось сохранить. Попробуй фото меньшего размера.';
      }
    };
  }
  if (unlocked) enableEditor();
})();
