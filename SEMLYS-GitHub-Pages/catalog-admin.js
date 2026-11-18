const catalogURL = 'https://semlys-api.semlissavazov.workers.dev/api/catalog';

export async function loadCatalog() {
  const response = await fetch(catalogURL, {signal: AbortSignal.timeout(5000)});
  if (!response.ok) throw new Error('Catalog unavailable');
  return response.json();
}

export async function openCatalogAdmin(initData) {
  const data = await loadCatalog();
  const dialog = document.createElement('dialog');
  dialog.className = 'demo-dialog';
  dialog.setAttribute('aria-label', 'Управление каталогом');
  dialog.innerHTML = `<div class="demo-dialog-inner">
    <h2>Управление каталогом</h2>
    <form method="dialog"><button>Закрыть</button></form>
    <form data-type="category">
      <p><label>Новая категория <input name="name" required maxlength="100"></label></p>
      <button>Добавить категорию</button>
    </form>
    <form data-type="product">
      <h3>Новый товар</h3>
      <p><label>Название <input name="name" required maxlength="100"></label></p>
      <p><label>Категория <select name="category" required></select></label></p>
      <p><label>Бренд <input name="brand" maxlength="80"></label></p>
      <p><label>Описание <textarea name="description" maxlength="500"></textarea></label></p>
      <p><label>Ссылка на фото (HTTPS) <input name="photo" type="url" maxlength="1024"></label></p>
      <button>Добавить товар</button>
    </form>
    <p role="status" aria-live="polite"></p>
  </div>`;
  document.body.append(dialog);
  const productForm = dialog.querySelector('[data-type="product"]');
  const status = dialog.querySelector('[role="status"]');
  const fillCategories = categories => {
    productForm.elements.category.replaceChildren(...categories.map(({id, name}) => new Option(name, id)));
  };
  fillCategories(data.categories);
  let saved = false;
  let submitting = false;
  dialog.addEventListener('close', () => {
    dialog.remove();
    if (saved) location.reload();
  }, {once: true});
  dialog.addEventListener('cancel', event => {
    if (submitting) event.preventDefault();
  });
  for (const form of dialog.querySelectorAll('[data-type]')) {
    form.onsubmit = async event => {
      event.preventDefault();
      if (submitting) return;
      const values = Object.fromEntries(new FormData(form));
      if (form === productForm) values.category = Number(values.category);
      const buttons = [...dialog.querySelectorAll('button')];
      buttons.forEach(button => { button.disabled = true; });
      submitting = true;
      status.textContent = 'Сохраняем…';
      try {
        const response = await fetch(catalogURL, {
          method: 'POST',
          body: JSON.stringify({...values, type: form.dataset.type, initData}),
          redirect: 'error'
        });
        if (response.status === 401) {
          status.textContent = 'Сеанс истёк. Закрой магазин и открой его заново в Telegram.';
          return;
        }
        if (response.status === 409) {
          status.textContent = 'Категория с таким названием уже есть.';
          return;
        }
        if (!response.ok) throw new Error('Save failed');
        saved = true;
        form.reset();
        status.textContent = form === productForm ? 'Товар добавлен.' : 'Категория добавлена.';
        if (form !== productForm) {
          try { fillCategories((await loadCatalog()).categories); }
          catch { status.textContent = 'Категория сохранена. Закрой окно, чтобы обновить список.'; }
        }
      } catch {
        status.textContent = 'Не удалось сохранить. Проверь поля и подключение.';
      } finally {
        submitting = false;
        buttons.forEach(button => { button.disabled = false; });
      }
    };
  }
  dialog.showModal();
}
