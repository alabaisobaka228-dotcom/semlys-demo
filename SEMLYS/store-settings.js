(() => {
  const key = 'semlys-store-settings';
  const defaults = {
    address: 'Уточняется',
    hours: 'Уточняются',
    description: 'SEMLYS — розничный магазин. Менеджер ответит на вопросы о товарах и поможет с обращением после покупки.'
  };
  const fields = Object.keys(defaults);
  const store = semlysHistory.open(key);
  function read() {
    try { return {...defaults, ...store.read().current}; }
    catch { return defaults; }
  }
  function refreshStore() {
    const values = read();
    document.querySelectorAll('[data-store]').forEach(element => {
      element.textContent = values[element.dataset.store];
    });
    const container = document.querySelector('#store-image');
    if (container) {
      const image = container.querySelector('img');
      image.hidden = !values.photo;
      container.querySelector('span').hidden = !!values.photo;
      if (values.photo) image.src = values.photo;
      else image.removeAttribute('src');
    }
  }
  refreshStore();
  addEventListener('pageshow', refreshStore);
  addEventListener('storage', event => {
    if (event.key === key) refreshStore();
  });
  addEventListener('semlys-store-photo-saved', refreshStore);
  const form = document.querySelector('#store-editor');
  if (!form) return;
  const status = document.querySelector('#store-status');
  const login = document.querySelector('#demo-login');
  login.onsubmit = event => {
    event.preventDefault();
    if (login.elements.password.value !== 'SEMLYS-demo') {
      login.querySelector('output').textContent = 'Неверный пароль.';
      return;
    }
    login.reset();
    login.hidden = true;
    form.hidden = false;
    form.elements.address.focus();
  };
  const picker = document.querySelector('#store-photo');
  const preview = document.querySelector('#photo-preview');
  const save = document.querySelector('#save-store');
  let upload = 0;
  let photo = read().photo || '';
  function showPhoto() {
    preview.hidden = !photo;
    if (photo) preview.src = photo;
    else preview.removeAttribute('src');
  }
  showPhoto();
  picker.onchange = async () => {
    const request = ++upload;
    save.disabled = false;
    const file = picker.files[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 25 * 1024 * 1024) {
      status.textContent = 'Выбери JPEG, PNG или WebP до 25 МБ.';
      picker.value = '';
      return;
    }
    save.disabled = true;
    status.textContent = 'Подготавливаю фото…';
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
      if (request !== upload) return;
      photo = canvas.toDataURL('image/jpeg', 0.82);
      showPhoto();
      status.textContent = 'Фото готово. Нажми «Сохранить изменения».';
    } catch {
      if (request !== upload) return;
      picker.value = '';
      status.textContent = 'Не удалось открыть фото. Попробуй другой файл.';
    } finally {
      if (request === upload) save.disabled = false;
    }
  };
  document.querySelector('#remove-photo').onclick = () => {
    upload++;
    save.disabled = false;
    picker.value = '';
    photo = '';
    showPhoto();
    status.textContent = 'Фото убрано из предпросмотра. Нажми «Сохранить».';
  };
  const featuredEditor = document.querySelector('#featured-editor');
  let names = {};
  try { names = semlysHistory.open('semlys-visual-v2').read().current; } catch {}
  const slots = featuredDefaults.map((_, index) => {
    const label = document.createElement('label');
    label.textContent = `Позиция ${index + 1}`;
    const select = document.createElement('select');
    items.forEach((item, id) => select.add(new Option(names[`item:${id}:1`] || item.name, id)));
    label.append(select);
    featuredEditor.append(label);
    return select;
  });
  const fill = values => {
    fields.forEach(name => { form.elements[name].value = values[name]; });
    featuredSelection(values.featured).forEach((id, index) => {
      slots[index].value = String(id);
    });
  };
  fill(read());
  const refreshHistory = semlysHistory.mount(
    document.querySelector('#store-history'), store, status, values => {
      upload++;
      save.disabled = false;
      picker.value = '';
      photo = values.photo || '';
      showPhoto();
      fill({...defaults, ...values});
      status.textContent = 'Версия восстановлена.';
    }
  );
  form.onsubmit = event => {
    event.preventDefault();
    if (save.disabled) return;
    const featured = slots.map(select => Number(select.value));
    if (new Set(featured).size !== slots.length) {
      status.textContent = 'Выбери четыре разных товара.';
      return;
    }
    const values = Object.fromEntries(fields.map(name => [
      name, form.elements[name].value.trim() || defaults[name]
    ]));
    values.photo = photo;
    values.featured = featured;
    try {
      store.save(values);
      refreshHistory();
      fill(values);
      status.textContent = 'Сохранено в этом браузере.';
    } catch {
      status.textContent = 'Не удалось сохранить. Проверь свободное место в браузере или выбери фото меньшего размера.';
    }
  };
})();
