(() => {
  const key = 'semlys-store-settings';
  const defaults = {
    address: 'Уточняется',
    hours: 'Уточняются',
    description: 'SEMLYS — розничный магазин. Менеджер ответит на вопросы о товарах и поможет с обращением после покупки.'
  };
  const fields = Object.keys(defaults);
  function read() {
    try { return {...defaults, ...JSON.parse(localStorage.getItem(key))}; }
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
  let photo = read().photo || '';
  function showPhoto() {
    preview.hidden = !photo;
    if (photo) preview.src = photo;
    else preview.removeAttribute('src');
  }
  showPhoto();
  picker.onchange = () => {
    const file = picker.files[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      status.textContent = 'Выбери JPEG, PNG или WebP до 2 МБ.';
      picker.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (picker.files[0] !== file) return;
      photo = reader.result;
      showPhoto();
      status.textContent = 'Фото готово. Нажми «Сохранить».';
    };
    reader.onerror = () => { status.textContent = 'Не удалось прочитать фото.'; };
    reader.readAsDataURL(file);
  };
  document.querySelector('#remove-photo').onclick = () => {
    picker.value = '';
    photo = '';
    showPhoto();
    status.textContent = 'Фото убрано из предпросмотра. Нажми «Сохранить».';
  };
  const fill = values => fields.forEach(name => {
    form.elements[name].value = values[name];
  });
  fill(read());
  form.onsubmit = event => {
    event.preventDefault();
    const values = Object.fromEntries(fields.map(name => [
      name, form.elements[name].value.trim() || defaults[name]
    ]));
    values.photo = photo;
    try {
      localStorage.setItem(key, JSON.stringify(values));
      fill(values);
      status.textContent = 'Сохранено в этом браузере.';
    } catch {
      status.textContent = 'Браузер не разрешил сохранить изменения.';
    }
  };
  document.querySelector('#reset-store').onclick = () => {
    try {
      localStorage.removeItem(key);
      picker.value = '';
      photo = '';
      showPhoto();
      fill(defaults);
      status.textContent = 'Исходные данные восстановлены.';
    } catch {
      status.textContent = 'Не удалось сбросить изменения.';
    }
  };
})();
