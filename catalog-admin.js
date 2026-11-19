const catalogURL = 'https://semlys-api.semlissavazov.workers.dev/api/catalog';

export async function loadCatalog() {
  const response = await fetch(catalogURL, {signal: AbortSignal.timeout(5000)});
  if (!response.ok) throw new Error('Catalog unavailable');
  return response.json();
}

export async function openCatalogAdmin(initData, selection = {}) {
  const data = await loadCatalog();
  const dialog = document.createElement('dialog');
  dialog.className = 'demo-dialog';
  dialog.setAttribute('aria-label', 'Управление каталогом');
  dialog.innerHTML = `<div class="demo-dialog-inner">
    <h2>Админка SEMLYS</h2>
    <form method="dialog"><button>Закрыть</button></form>
    <nav class="admin-tabs" aria-label="Разделы админки"><button type="button" data-tab="catalog">Каталог</button><button type="button" data-tab="texts">Управление текстом</button><button type="button" data-tab="news">Рассылка</button></nav>
    <form data-panel="news" hidden>
      <p>Сообщение получат подписчики бота SEMLYS.</p>
      <label>Текст сообщения <textarea name="message" required maxlength="1500" rows="5"></textarea></label>
      <p><label>Фото (необязательно) <input type="file" accept="image/jpeg,image/png,image/webp"></label></p>
      <img data-news-photo alt="Фото к рассылке" width="220" hidden>
      <button type="button" data-clear-news-photo hidden>Убрать фото</button>
      <p><label>Текст кнопки <input name="buttonText" maxlength="64"></label></p>
      <p><label>Ссылка кнопки <input name="buttonUrl" type="url" maxlength="2048" placeholder="https://…"></label></p>
      <p>Пустой текст — сообщение без кнопки. С фото можно написать до 950 символов.</p>
      <button type="submit">Отправить подписчикам</button>
      <p role="status" data-news-status></p>
    </form>
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
  const mount = selection.mount || document.body;
  mount.append(dialog);
  const productForm = dialog.querySelector('[data-type="product"]');
  const status = dialog.querySelector('[role="status"]:not([data-news-status])');
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
  const sectionPhotos = new Map();
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
      '<p><label>Фото из галереи <input type="file" accept="image/jpeg,image/png,image/webp"></label></p><input type="hidden" name="photo"><img data-section-photo alt="Фото раздела" width="160" hidden> <button type="button" data-remove-section-photo>Убрать фото</button><p data-section-photo-status role="status" hidden></p>');
    const input = form.querySelector('[type="file"]');
    const image = form.querySelector('[data-section-photo]');
    const feedback = form.querySelector('[data-section-photo-status]');
    const state = {data:'', version:0, pending:false, select(source) {
      ++this.version;
      this.pending = false;
      this.data = '';
      input.value = '';
      form.elements.photo.value = source || '';
      image.hidden = !source;
      if (source) image.src = source;
      else image.removeAttribute('src');
      feedback.hidden = true;
    }};
    sectionPhotos.set(form, state);
    form.querySelector('[data-remove-section-photo]').onclick = () => state.select('');
    input.onchange = async () => {
      const file = input.files[0];
      input.value = '';
      if (!file) return;
      const version = ++state.version;
      state.pending = true;
      feedback.hidden = false;
      feedback.textContent = 'Готовим фото…';
      try {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
          throw new Error('Выбери JPG, PNG или WebP до 10 МБ.');
        }
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        let src;
        for (const quality of [0.82,0.68,0.5,0.32]) {
          src = canvas.toDataURL('image/webp',quality);
          if (src.length < 750000) break;
        }
        if (!src.startsWith('data:image/webp;base64,') || src.length >= 750000) throw Error();
        if (version !== state.version) return;
        state.data = src.split(',')[1];
        image.src = src;
        image.hidden = false;
        feedback.textContent = 'Фото готово. Сохрани раздел.';
      } catch (error) {
        if (version === state.version) feedback.textContent = error.message || 'Не удалось обработать фото.';
      } finally {
        if (version === state.version) state.pending = false;
      }
    };
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
      sectionPhotos.get(subcategoryForm).select('');
      subcategoryForm.querySelector('[data-delete]').disabled = true;
    };
    subcategoryForm.elements.parent_id.onchange = showSubcategories;
    subcategoryForm.elements.id.onchange = () => {
      subcategoryForm.elements.name.value = names.get(Number(subcategoryForm.elements.id.value)) || '';
      sectionPhotos.get(subcategoryForm).select(categories.find(item => String(item.id) === subcategoryForm.elements.id.value)?.photo);
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
      sectionPhotos.get(categoryForm).select(category?.photo);
      categoryForm.querySelector('[data-delete]').disabled = !category || category.id === -1;
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
  if (selection.categoryToEdit != null) {
    const section = data.categories.find(item => item.id === selection.categoryToEdit);
    if (section) {
      const form = section.parent_id == null ? categoryForm : subcategoryForm;
      if (section.parent_id != null) {
        form.elements.parent_id.value = String(section.parent_id);
        form.elements.parent_id.onchange();
      }
      form.elements.id.value = String(section.id);
      form.elements.id.onchange();
      selection.section = section.parent_id == null ? 'category' : 'subcategory';
    }
  }
  if (selection.productId != null) {
    productForm.elements.id.value = String(selection.productId);
    productForm.elements.id.onchange();
  } else if (selection.categoryId != null) {
    const section = data.categories.find(item => item.id === selection.categoryId);
    if (section) {
      productForm.elements.category.value = String(section.parent_id ?? section.id);
      productForm.elements.category.onchange();
      if (section.parent_id != null) productForm.elements.subcategory.value = String(section.id);
    }
  }
  let saved = false;
  let submitting = false;
  const newsForm = dialog.querySelector('[data-panel="news"]');
  const newsPicker = newsForm.querySelector('[type="file"]');
  const newsPreview = newsForm.querySelector('[data-news-photo]');
  const clearNewsPhoto = newsForm.querySelector('[data-clear-news-photo]');
  const newsFeedback = newsForm.querySelector('[data-news-status]');
  let newsImage = '', newsPhotoVersion = 0, processingNewsPhoto = false;
  clearNewsPhoto.onclick = () => {
    ++newsPhotoVersion;
    processingNewsPhoto = false;
    newsImage = '';
    newsPicker.value = '';
    newsPreview.removeAttribute('src');
    newsPreview.hidden = clearNewsPhoto.hidden = true;
    newsForm.elements.message.maxLength = 1500;
  };
  newsPicker.onchange = async () => {
    const file = newsPicker.files[0];
    clearNewsPhoto.onclick();
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      newsFeedback.textContent = 'Выбери JPG, PNG или WebP до 10 МБ.';
      return;
    }
    const version = newsPhotoVersion;
    processingNewsPhoto = true;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      let source;
      for (const quality of [0.82, 0.68, 0.5, 0.32]) {
        source = canvas.toDataURL('image/jpeg', quality);
        if (source.length < 750000) break;
      }
      if (version !== newsPhotoVersion) return;
      if (!source.startsWith('data:image/jpeg;base64,') || source.length >= 750000 ||
          Math.max(canvas.width, canvas.height) > 20 * Math.min(canvas.width, canvas.height)) throw Error();
      newsImage = source.split(',')[1];
      newsPreview.src = source;
      newsPreview.hidden = clearNewsPhoto.hidden = false;
      newsForm.elements.message.maxLength = 950;
      newsFeedback.textContent = 'Фото готово.';
    } catch {
      if (version === newsPhotoVersion) newsFeedback.textContent = 'Не удалось подготовить фото. Выбери другое изображение.';
    } finally {
      if (version === newsPhotoVersion) processingNewsPhoto = false;
    }
  };
  newsForm.onsubmit = async event => {
    event.preventDefault();
    const message = newsForm.elements.message.value.trim();
    if (submitting || !message) return;
    if (processingNewsPhoto) { newsFeedback.textContent = 'Дождись обработки фото.'; return; }
    if (newsImage && message.length > 950) { newsFeedback.textContent = 'Сократи подпись к фото до 950 символов.'; return; }
    const buttonText = newsForm.elements.buttonText.value.trim();
    const buttonUrl = newsForm.elements.buttonUrl.value.trim();
    if (Boolean(buttonText) !== Boolean(buttonUrl) || (buttonUrl && !/^https?:\/\//i.test(buttonUrl))) {
      newsFeedback.textContent = 'Для кнопки укажи текст и ссылку с https:// или http://.';
      return;
    }
    if (!confirm('Отправить это сообщение всем подписчикам?')) return;
    submitting = true;
    const controls = [...dialog.querySelectorAll('button,textarea,input')].filter(control => !control.disabled);
    controls.forEach(control => { control.disabled = true; });
    const feedback = newsForm.querySelector('[data-news-status]');
    let next = '', sent = 0, failed = 0;
    feedback.textContent = 'Отправляем… Оставь админку открытой.';
    try {
      do {
        const response = await fetch(new URL('/api/news/broadcast', catalogURL), {
          method:'POST', redirect:'error', body:JSON.stringify({message, buttonText, buttonUrl,
            photo:newsImage || undefined, after:next, initData})
        });
        if (!response.ok) throw Error();
        const batch = await response.json();
        sent += batch.sent;
        failed += batch.failed;
        next = batch.next;
        feedback.textContent = 'Доставлено: ' + sent + '. Не доставлено: ' + failed + '.';
        if (next) await new Promise(resolve => setTimeout(resolve, 1000));
      } while (next);
      if (!sent && !failed) feedback.textContent = 'Подписчиков пока нет.';
      newsForm.reset();
      clearNewsPhoto.onclick();
    } catch {
      feedback.textContent = 'Рассылка прервалась. Подтверждено доставок: ' + sent + '. Повторная рассылка может создать дубликаты.';
    } finally {
      submitting = false;
      controls.forEach(control => { control.disabled = false; });
    }
  };
  for (const form of [categoryForm, subcategoryForm, productForm]) {
    const button = form.querySelector('[data-delete]');
    button.onclick = async () => {
      form.append(status);
      const isProduct = form === productForm;
      if (submitting || (!isProduct && form.elements.id.value === '-1') || (isProduct && !confirm('Удалить выбранный товар?'))) return;
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
        dialog.dataset.catalogChanged = 'true';
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
      form.append(status);
      const values = Object.fromEntries(new FormData(form));
      const sectionPhoto = sectionPhotos.get(form);
      if (sectionPhoto?.pending) { status.textContent = 'Дождись обработки фото.'; return; }
      if (sectionPhoto?.data) values.photo_data = sectionPhoto.data;
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
        dialog.dataset.catalogChanged = 'true';
        form.reset();
        sectionPhoto?.select('');
        if (form === productForm) { photoData = ''; showPhoto(); }
        status.textContent = form === productForm ? 'Товар сохранён.'
          : (form === subcategoryForm ? 'Подкатегория' : 'Категория') + ' «' +
            values.name.trim() + '» ' + (values.id ? 'сохранена.' : 'добавлена.');
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
  if (selection.tab) dialog.querySelector('[data-tab="' + selection.tab + '"]')?.click();
  if (selection.section) dialog.querySelector('[data-catalog-tab="' + selection.section + '"]')?.click();
  if (selection.mount) {
    dialog.classList.add('owner-inline-editor');
    dialog.show();
    dialog.scrollIntoView({block:'nearest'});
    if (selection.focus) dialog.querySelector(selection.focus)?.focus({preventScroll:true});
  } else dialog.showModal();
}



