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
    <h2>Админка SEMLYS</h2>
    <form method="dialog"><button>Закрыть</button></form>
    <nav class="admin-tabs" aria-label="Разделы админки"><button type="button" data-tab="catalog">Каталог</button><button type="button" data-tab="texts">Управление текстом</button></nav>
    <div data-panel="catalog">
    <nav class="admin-tabs" aria-label="Управление каталогом">
      <button type="button" data-catalog-tab="product">Товары</button>
      <button type="button" data-catalog-tab="category">Категории</button>
      <button type="button" data-catalog-tab="subcategory">Подкатегории</button>
    </nav>
    <form data-type="category">
      <h3>Категории</h3>
      <p><label>Категория <select name="id"></select></label></p>
      <p><label>Название <input name="name" required maxlength="100"></label></p>
      <button type="submit">Сохранить категорию</button>
      <button type="button" data-delete disabled>Удалить категорию</button>
    </form>
    <form data-type="subcategory">
      <h3>Подкатегории</h3>
      <p><label>В какой категории? <select name="parent_id" required></select></label></p>
      <p><label>Подкатегория <select name="id"></select></label></p>
      <p><label>Название <input name="name" required maxlength="100"></label></p>
      <button type="submit">Сохранить подкатегорию</button>
      <button type="button" data-delete disabled>Удалить подкатегорию</button>
    </form>
    <form data-type="product">
      <h3>Товары</h3>
      <p><label>Товар <select name="id"></select></label></p>
      <p><label>Название <input name="name" required maxlength="100"></label></p>
      <p><label>Категория <select name="category" required></select></label></p>
      <p><label>Подкатегория <select name="subcategory"></select></label></p>
      <p data-new-subcategory hidden><label>Название новой подкатегории <input name="subcategory_name" maxlength="100" disabled></label></p>
      <p><label>Бренд <input name="brand" maxlength="80"></label></p>
      <p><label>Описание <textarea name="description" maxlength="500"></textarea></label></p>
      <p data-drop><label>Выбрать фото или перетащить сюда (JPG, PNG, WebP до 10 МБ)
        <input type="file" accept="image/jpeg,image/png,image/webp"></label></p>
      <input type="hidden" name="photo">
      <img data-photo-preview alt="" width="160" hidden>
      <button type="button" data-remove-photo>Удалить фото</button>
      <p><label>Описание фото (alt) <input name="photo_alt" maxlength="240"></label></p>
      <p><label>Цена, ₽ <input name="price" type="number" min="0" max="99999999" step="0.01"></label></p>
      <button type="submit">Сохранить товар</button>
      <button type="button" data-delete disabled>Удалить товар</button>
    </form>
    </div>
    <form data-panel="texts" id="admin-texts" hidden>
      <p>Тексты сохраняются в этом браузере. На сайте клиента для всех посетителей они пока не обновляются.</p>
      <p><label>Подзаголовок на главной <input name="heroTitle" maxlength="120"></label></p>
      <p><label>Описание на главной <textarea name="heroDescription" maxlength="300"></textarea></label></p>
      <p><label>О магазине <textarea name="storeDescription" maxlength="500"></textarea></label></p>
      <p><label>Адрес <input name="address" maxlength="160"></label></p>
      <p><label>Время работы <input name="hours" maxlength="160"></label></p>
      <button type="submit">Сохранить тексты</button>
    </form>
    <p role="status" aria-live="polite"></p>
  </div>`;
  document.body.append(dialog);
  const productForm = dialog.querySelector('[data-type="product"]');
  const status = dialog.querySelector('[role="status"]');
  const textForm = dialog.querySelector('#admin-texts');
  const textDefaults = {heroTitle:'',heroDescription:'Место для информации о магазине, его ассортименте и ежедневном графике работы.',storeDescription:'SEMLYS — розничный магазин. Менеджер ответит на вопросы о товарах и поможет с обращением после покупки.',address:'Уточняется',hours:'Уточняются'};
  let currentTexts = textDefaults;
  try { currentTexts = {...textDefaults,...JSON.parse(localStorage.getItem('semlys-admin-texts'))}; } catch {}
  for (const [key,value] of Object.entries(currentTexts)) textForm.elements[key].value = value;
  textForm.onsubmit = event => {
    event.preventDefault();
    const values = Object.fromEntries(Object.keys(textDefaults).map(key => [key,textForm.elements[key].value.trim()]));
    try { localStorage.setItem('semlys-admin-texts',JSON.stringify(values)); status.textContent='Тексты сохранены в этом браузере.'; }
    catch { status.textContent='Не удалось сохранить тексты в браузере.'; }
  };
  for (const tab of dialog.querySelectorAll('[data-tab]')) tab.onclick = () => {
    for (const panel of dialog.querySelectorAll('[data-panel]')) panel.hidden = panel.dataset.panel !== tab.dataset.tab;
    for (const button of dialog.querySelectorAll('[data-tab]')) button.setAttribute('aria-pressed',String(button === tab));
    status.textContent='';
  };
  dialog.querySelector('[data-tab="catalog"]').click();
  for (const tab of dialog.querySelectorAll('[data-catalog-tab]')) tab.onclick = () => {
    for (const form of dialog.querySelectorAll('[data-type]')) form.hidden = form.dataset.type !== tab.dataset.catalogTab;
    for (const button of dialog.querySelectorAll('[data-catalog-tab]')) button.setAttribute('aria-pressed', String(button === tab));
    status.textContent = '';
  };
  dialog.querySelector('[data-catalog-tab="product"]').click();
  const categoryForm = dialog.querySelector('[data-type="category"]');
  const subcategoryForm = dialog.querySelector('[data-type="subcategory"]');
  const picker = productForm.querySelector('[type="file"]');
  const preview = productForm.querySelector('[data-photo-preview]');
  let photoData = '';
  let photoVersion = 0;
  let processingPhoto = false;
  function showPhoto() {
    const src = photoData || productForm.elements.photo.value;
    preview.hidden = !src;
    if (src) preview.src = src;
    else preview.removeAttribute('src');
    preview.alt = productForm.elements.photo_alt.value;
  }
  async function choosePhoto(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      status.textContent = 'Выбери JPG, PNG или WebP размером до 10 МБ.';
      return;
    }
    const version = ++photoVersion;
    processingPhoto = true;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      let encoded;
      for (const quality of [0.82, 0.68, 0.5, 0.32]) {
        encoded = canvas.toDataURL('image/webp', quality);
        if (encoded.length < 750000) break;
      }
      if (!encoded.startsWith('data:image/webp;base64,') || encoded.length >= 750000) throw Error();
      if (version !== photoVersion) return;
      photoData = encoded;
      showPhoto();
      status.textContent = 'Фото готово. Сохрани товар.';
    } catch {
      if (version === photoVersion) status.textContent = 'Не удалось обработать фото. Попробуй другое изображение.';
    } finally {
      if (version === photoVersion) processingPhoto = false;
    }
  }
  picker.onchange = () => { choosePhoto(picker.files[0]); picker.value = ''; };
  const drop = productForm.querySelector('[data-drop]');
  drop.ondragover = event => event.preventDefault();
  drop.ondrop = event => { event.preventDefault(); choosePhoto(event.dataTransfer.files[0]); };
  productForm.elements.photo_alt.oninput = showPhoto;
  productForm.querySelector('[data-remove-photo]').onclick = () => {
    ++photoVersion;
    processingPhoto = false;
    photoData = '';
    productForm.elements.photo.value = '';
    productForm.elements.photo_alt.value = '';
    showPhoto();
  };
  for (const form of [categoryForm, subcategoryForm]) {
    form.querySelector('[type="submit"]').insertAdjacentHTML('beforebegin',
      '<p><label>Ссылка на фото (HTTPS) <input name="photo" type="url" maxlength="1024"></label></p>');
  }
  function fillCatalog({categories, products}) {
    const names = new Map(categories.map(category => [category.id, category.name]));
    const mainCategories = categories.filter(category => !category.parent_id);
    const mainOptions = () => mainCategories.map(({id, name}) => new Option(name, id));
    categoryForm.elements.id.replaceChildren(new Option('Новая категория', ''), ...mainOptions());
    subcategoryForm.elements.parent_id.replaceChildren(new Option('Выбрать категорию', ''), ...mainOptions());
    const showSubcategories = () => {
      const parent = subcategoryForm.elements.parent_id.value;
      subcategoryForm.elements.id.replaceChildren(new Option('Новая подкатегория', ''), ...categories
        .filter(item => String(item.parent_id) === parent).map(({id, name}) => new Option(name, id)));
      subcategoryForm.elements.name.value = '';
      subcategoryForm.elements.photo.value = '';
      subcategoryForm.querySelector('[data-delete]').disabled = true;
    };
    subcategoryForm.elements.parent_id.onchange = showSubcategories;
    subcategoryForm.elements.id.onchange = () => {
      subcategoryForm.elements.name.value = names.get(Number(subcategoryForm.elements.id.value)) || '';
      subcategoryForm.elements.photo.value = categories.find(item => String(item.id) === subcategoryForm.elements.id.value)?.photo || '';
      subcategoryForm.querySelector('[data-delete]').disabled = !subcategoryForm.elements.id.value;
    };
    showSubcategories();
    productForm.elements.category.replaceChildren(...mainOptions());
    const fillProductSubcategories = () => {
      const parent = Number(productForm.elements.category.value);
      productForm.elements.subcategory.replaceChildren(new Option('Без подкатегории', ''), ...categories
        .filter(item => Number(item.parent_id) === parent).map(({id,name}) => new Option(name,id)),
        new Option('Добавить подкатегорию…', 'new'));
      productForm.elements.subcategory.onchange();
    };
    productForm.elements.subcategory.onchange = () => {
      const adding = productForm.elements.subcategory.value === 'new';
      const input = productForm.elements.subcategory_name;
      input.closest('p').hidden = !adding;
      input.disabled = !adding;
      input.required = adding;
      if (!adding) input.value = '';
    };
    productForm.elements.category.onchange = fillProductSubcategories;
    fillProductSubcategories();
    productForm.elements.id.replaceChildren(new Option('Добавить товар', ''), ...products.map(({id, name}) => new Option(name, id)));
    categoryForm.elements.id.onchange = () => {
      const category = categories.find(item => String(item.id) === categoryForm.elements.id.value);
      categoryForm.elements.name.value = category?.name || '';
      categoryForm.elements.photo.value = category?.photo || '';
      categoryForm.querySelector('[data-delete]').disabled = !category;
    };
    productForm.elements.id.onchange = () => {
      const product = products.find(item => String(item.id) === productForm.elements.id.value);
      for (const key of ['name', 'brand', 'description', 'photo', 'photo_alt']) productForm.elements[key].value = product?.[key] || '';
      productForm.elements.price.value = product?.price ?? '';
      productForm.querySelector('[data-delete]').disabled = !product;
      productForm.elements.category.selectedIndex = 0;
      const section = categories.find(item => item.id === product?.category);
      if (section) productForm.elements.category.value = section.parent_id ?? section.id;
      fillProductSubcategories();
      if (section?.parent_id) productForm.elements.subcategory.value = section.id;
      ++photoVersion;
      processingPhoto = false;
      photoData = '';
      showPhoto();
    };
  };
  fillCatalog(data);
  let saved = false;
  let submitting = false;
  for (const form of [categoryForm, subcategoryForm, productForm]) {
    const button = form.querySelector('[data-delete]');
    button.onclick = async () => {
      const isProduct = form === productForm;
      if (submitting || !confirm(isProduct ? 'Удалить выбранный товар?' : 'Удалить выбранный раздел?')) return;
      submitting = true;
      button.disabled = true;
      try {
        const response = await fetch(catalogURL, {method:'POST', redirect:'error',
          body:JSON.stringify({type:isProduct ? 'delete_product' : 'delete_category', id:Number(form.elements.id.value), initData})});
        if (response.status === 409) {
          status.textContent = 'Сначала перенеси товары и удали пустые подкатегории этого раздела.';
          return;
        }
        if (!response.ok) throw Error();
        saved = true;
        form.reset();
        if (isProduct) { ++photoVersion; processingPhoto = false; photoData = ''; showPhoto(); }
        fillCatalog(await loadCatalog());
        status.textContent = isProduct ? 'Товар удалён.' : 'Раздел удалён.';
      } catch {
        status.textContent = 'Не удалось завершить удаление. Обнови список и проверь раздел.';
      } finally {
        submitting = false;
        button.disabled = !form.elements.id.value;
      }
    };
  }
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
      values.id = values.id ? Number(values.id) : null;
      if (form === subcategoryForm) values.parent_id = Number(values.parent_id);
      if (form === productForm) {
        if (processingPhoto) { status.textContent = 'Подожди, пока обработается фото.'; return; }
        if (values.subcategory === 'new') {
          values.subcategory_name = values.subcategory_name.trim();
          if (!values.subcategory_name) { status.textContent = 'Введи название новой подкатегории.'; return; }
        }
        values.category = Number(values.subcategory === 'new' ? values.category : values.subcategory || values.category);
        delete values.subcategory;
        values.price = values.price === '' ? null : Number(values.price);
        if (photoData) values.photo_data = photoData.split(',')[1];
      }
      const buttons = [...dialog.querySelectorAll('button')];
      buttons.forEach(button => { button.disabled = true; });
      submitting = true;
      status.textContent = 'Сохраняем…';
      try {
        const response = await fetch(catalogURL, {
          method: 'POST',
          body: JSON.stringify({...values, type: form === subcategoryForm ? 'category' : form.dataset.type, initData}),
          redirect: 'error'
        });
        if (response.status === 401) {
          status.textContent = 'Сеанс истёк. Закрой магазин и открой его заново в Telegram.';
          return;
        }
        if (response.status === 409) {
          status.textContent = values.subcategory_name
            ? 'Это название уже используется в другом разделе. Введи другое название подкатегории.'
            : 'Категория с таким названием уже есть.';
          return;
        }
        if (response.status === 400 && (await response.json()).error === 'invalid_photo') {
          status.textContent = 'Вставь прямую ссылку на фото, которая начинается с https://.';
          return;
        }
        if (response.status === 503) {
          status.textContent = 'Хранилище фото пока недоступно. Попробуй позже.';
          return;
        }
        if (!response.ok) throw new Error('Save failed');
        saved = true;
        form.reset();
        if (form === productForm) { photoData = ''; showPhoto(); }
        status.textContent = form === productForm ? 'Товар сохранён.'
          : form === subcategoryForm ? 'Подкатегория сохранена.' : 'Категория сохранена.';
        try { fillCatalog(await loadCatalog()); }
        catch { status.textContent += ' Открой админку заново, чтобы обновить списки.'; }
      } catch {
        status.textContent = 'Не удалось сохранить. Проверь поля и подключение.';
      } finally {
        submitting = false;
        buttons.forEach(button => { button.disabled = false; });
        for (const section of [categoryForm, subcategoryForm, productForm]) section.querySelector('[data-delete]').disabled = !section.elements.id.value;
      }
    };
  }
  dialog.showModal();
}

