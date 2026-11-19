if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const grid=document.querySelector('.category-grid');grid.addEventListener('pointermove',event=>{const card=event.target.closest('.category');if(!card)return;const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;card.style.transform=`perspective(800px) rotateX(${-y*14}deg) rotateY(${x*14}deg) translateY(-5px)`});grid.addEventListener('pointerout',event=>{const card=event.target.closest('.category');if(card&&!card.contains(event.relatedTarget))card.style.transform=''})}
const themeButton=document.querySelector('#theme-toggle');let theme='light';try{theme=localStorage.getItem('semlys-theme')==='dark'?'dark':'light'}catch(e){}function applyTheme(value){theme=value;document.documentElement.dataset.theme=value;themeButton.textContent=value==='dark'?'☀ Светлая':'☾ Тёмная';themeButton.setAttribute('aria-label',value==='dark'?'Включить светлую тему':'Включить тёмную тему');themeButton.setAttribute('aria-pressed',String(value==='dark'))}applyTheme(theme);themeButton.addEventListener('click',()=>{applyTheme(theme==='dark'?'light':'dark');try{localStorage.setItem('semlys-theme',theme)}catch(e){}});
if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){const drops=[],mouse={x:-500,y:-500};let speed=0,px=mouse.x,py=mouse.y;for(let i=0;i<9;i++){const el=document.createElement('div'),s=150-i*9;el.className='drop';el.style.width=el.style.height=s+'px';document.body.appendChild(el);drops.push({el,x:-500,y:-500,s})}addEventListener('mousemove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});function animate(){speed+=(Math.hypot(mouse.x-px,mouse.y-py)-speed)*.09;px=mouse.x;py=mouse.y;const opacity=Math.min(speed/24,1)*.55;drops.forEach((d,i)=>{const target=i?drops[i-1]:mouse,k=i?.24:.18,dx=target.x-d.x,dy=target.y-d.y;d.x+=dx*k;d.y+=dy*k;const angle=Math.atan2(dy,dx),stretch=1+Math.min(Math.hypot(dx,dy)/80,.35);d.el.style.transform=`translate(${d.x-d.s/2}px,${d.y-d.s/2}px) rotate(${angle}rad) scale(${stretch},${1/stretch})`;d.el.style.opacity=opacity*(1-i/drops.length*.6)});requestAnimationFrame(animate)}animate()}
const heroOrbits = document.createElement('div');
heroOrbits.className = 'hero-orbits';
heroOrbits.setAttribute('aria-hidden', 'true');
heroOrbits.innerHTML = '<div class="hero-orbit"><i class="orbit-object orbit-bottle"></i></div><div class="hero-orbit"><i class="orbit-object orbit-pod"></i></div>';
document.querySelector('.hero')?.prepend(heroOrbits);
const catalog = document.body.classList.contains('catalog-page');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
(async () => {
const items = [];
const names = ['Под-системы', 'Жидкости', 'Картриджи', 'Аксессуары'];
const categoryIds = new Map();
const categoryGrid = document.querySelector('.category-grid');
const catalogGroups = new Map();
let catalogLoaded = false;
function showCategoryPhoto(container, photo) {
  if (!container || typeof photo !== 'string' || !photo.startsWith('https://')) return;
  const image = document.createElement('img');
  image.src = photo;
  image.alt = '';
  image.loading = 'lazy';
  image.className = 'catalog-category-photo';
  image.addEventListener('error', () => image.remove(), {once: true});
  container.prepend(image);
}
try {
  const {loadCatalog} = await import('./catalog-admin.js?v=release1');
  const {categories, products} = await loadCatalog();
  catalogLoaded = true;
  const categoryIndices = new Map();
  for (const {id, name, parent_id, photo} of categories) {
    if (parent_id != null) continue;
    if (id >= 1 && id <= 4 && !names.includes(name)) {
      names[id - 1] = name;
      categoryGrid.children[id - 1]?.querySelector('h3')?.replaceChildren(name);
    }
    categoryIndices.set(id, names.indexOf(name));
    categoryIds.set(name, id);
    if (names.includes(name)) {
      showCategoryPhoto(categoryGrid.children[names.indexOf(name)], photo);
      categoryGrid.children[names.indexOf(name)].dataset.catalogId = id;
      continue;
    }
    categoryIndices.set(id, names.push(name) - 1);
    const card = document.createElement('div');
    card.className = 'category';
    card.dataset.catalogId = id;
    const heading = document.createElement('h3');
    heading.textContent = name;
    card.append(heading);
    showCategoryPhoto(card, photo);
    categoryGrid.append(card);
  }
  const subcategories = new Map(categories.filter(item => item.parent_id != null).map(item => [item.id, item]));
  for (const {id, name, parent_id, photo} of subcategories.values()) {
    const index = categoryIndices.get(parent_id);
    if (index === undefined) continue;
    if (!catalogGroups.has(index)) catalogGroups.set(index, []);
    catalogGroups.get(index).push({id, name, photo});
  }
  for (const product of products) {
    const subcategory = subcategories.get(product.category);
    const category = categoryIndices.get(subcategory?.parent_id ?? product.category);
    if (category === undefined) continue;
    items.push({...product, category, sectionId: subcategory?.parent_id ?? product.category,
      subcategoryId: subcategory?.id, group: subcategory?.name || product.brand, published: true});
  }
} catch {
  // The demonstration catalog remains available while the API is offline.
}
const grid = document.querySelector('#products .products');
const status = document.querySelector('#search-note');
const query = document.querySelector('#query');
const filters = new URLSearchParams(location.search);
const selectedSection = filters.get('cat');
const selectedSubcategory = filters.get('sub');
const dialog = document.createElement('dialog');
dialog.className = 'demo-dialog card-transition';
dialog.setAttribute('aria-labelledby', 'item-title');
dialog.innerHTML = '<div class="demo-dialog-inner"><div class="demo-dialog-head"><span class="label">Товар</span><button type="button" class="demo-close" aria-label="Закрыть">×</button></div><h2 id="item-title"></h2><p class="item-description"></p></div>';
document.body.append(dialog);
const close = dialog.querySelector('button');
let closing = false;
async function returnToList() {
  if (closing || !dialog.open) return;
  closing = true;
  if (!motion.matches && !document.documentElement.classList.contains('semlys-editor-view') && !document.body.classList.contains('catalog-management') && opener) {
    const from = opener.getBoundingClientRect();
    const current = dialog.getBoundingClientRect();
    dialog.getAnimations().forEach(animation => animation.cancel());
    const to = dialog.getBoundingClientRect();
    const x = from.left + (from.width - to.width) / 2 - to.left;
    const y = from.top + (from.height - to.height) / 2 - to.top;
    await dialog.animate([
      {transform: `translate(${current.left-to.left}px,${current.top-to.top}px) scale(${current.width/to.width})`, opacity: 1},
      {transform: `translate(${x}px,${y}px) scale(.55)`, opacity: 0}
    ], {duration:220,easing:'cubic-bezier(.23,1,.32,1)',fill:'forwards'}).finished.catch(() => {});
  }
  dialog.close();
  closing = false;
}
close.textContent = 'К списку';
close.setAttribute('aria-label', 'Закрыть и вернуться к списку');
close.onclick = returnToList;
dialog.onclick = event => { if (event.target === dialog) returnToList(); };
dialog.addEventListener('cancel', event => { event.preventDefault(); returnToList(); });
let opener;
dialog.addEventListener('close', () => {
  dialog.getAnimations().forEach(animation => animation.cancel());
  opener?.focus({preventScroll:true});
});

function itemCard(item) {
  const card = document.createElement('button');
  card.className = 'product demo-product';
  card.type = 'button';
  card.innerHTML = '<div class="product-image" aria-hidden="true"><span>ФОТО ТОВАРА</span></div><h3></h3><p></p>';
  card.querySelector('h3').textContent = item.name;
  card.querySelector('p').textContent = item.brand || '';
  card.querySelector('.product-image').innerHTML = '<i class="item-shape"></i>';
  if (item.photo) {
    const image = document.createElement('img');
    image.alt = item.photo_alt || '';
    image.loading = 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.className = 'product-photo';
    const container = card.querySelector('.product-image');
    container.classList.add('has-product-photo');
    container.removeAttribute('aria-hidden');
    image.onerror = () => {
      container.classList.remove('has-product-photo');
      container.setAttribute('aria-hidden', 'true');
      container.innerHTML = '<i class="item-shape"></i>';
    };
    container.replaceChildren(image);
    image.src = item.photo;
  }
  card.dataset.kind = item.category;
  card.dataset.itemId = String(items.indexOf(item));
  const description = document.createElement('p');
  description.textContent = item.description;
  card.append(description);
  if (Number.isFinite(item.price)) {
    const price = document.createElement('strong');
    price.textContent = new Intl.NumberFormat('ru-RU', {style:'currency',currency:'RUB'}).format(item.price);
    card.append(price);
  }
  card.onclick = () => {
    const from = card.getBoundingClientRect();
    opener = card;
    dialog.querySelector('h2').textContent = item.name;
    dialog.querySelector('.label').textContent = item.published ? item.brand || 'Товар' : 'Товар';
    dialog.querySelector('.item-description').textContent = item.description;
    dialog.showModal();
    if (motion.matches || document.documentElement.classList.contains('semlys-editor-view') || document.body.classList.contains('catalog-management')) return;
    const to = dialog.getBoundingClientRect();
    const x = from.left + (from.width - to.width)/2 - to.left;
    const y = from.top + (from.height - to.height)/2 - to.top;
    dialog.animate([
      {transform:`translate(${x}px,${y}px) scale(.55)`,opacity:.4},
      {transform:'none',opacity:1}
    ], {duration:380,easing:'cubic-bezier(.23,1,.32,1)'});
  };
  if (!catalog || !item.published) return card;
  const slot = document.createElement('div');
  slot.append(card);
  const actions = document.createElement('div');
  actions.className = 'catalog-owner-action owner-card-actions';
  for (const [label, focus] of [['Редактировать товар','[data-type="product"] [name="name"]'],
    ['Загрузить фото','[data-type="product"] [type="file"]'], ['Указать цену','[data-type="product"] [name="price"]'],
    ['Удалить товар','[data-type="product"] [data-delete]']]) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'theme-toggle';
    action.textContent = label;
    action.onclick = () => document.dispatchEvent(new CustomEvent('semlys:edit-product', {
      detail: {productId:item.id, mount:slot, focus}
    }));
    actions.append(action);
  }
  slot.append(actions);
  return slot;
}

function updateResults() {
  query.value = filters.get('q') || '';
  const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const terms = normalize(query.value).split(/\s+/);
  const aliases = ['под подик подики подсистема подсистемы под системы', 'жижа жижи жидкость жидкости', 'картридж картриджи'];
  const found = items.filter(item =>
    (!selectedSection || selectedSection === String(item.sectionId)) &&
    (!selectedSubcategory || selectedSubcategory === String(item.subcategoryId)) &&
    (!(catalogLoaded && filters.has('category')) || item.published) &&
    (!filters.has('category') || filters.get('category') === String(item.category)) &&
    (!filters.has('group') || filters.get('group') === item.group) &&
    terms.every(term => normalize([item.name,item.brand,item.group,aliases[item.category]].join(' ')).includes(term))
  );
  grid.replaceChildren(...(catalog ? found : items.slice(0,4)).map(itemCard));
  if (!catalog && !items.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Товары скоро появятся.';
    grid.append(empty);
  }
  if (catalog) status.textContent = found.length ? 'Найдено: ' + found.length
    : !terms[0] && (selectedSection || filters.has('category')) ? 'В этом разделе пока нет товаров.'
    : 'Ничего не найдено. Измените запрос или снимите фильтр ниже.';
}

document.querySelector('#search').addEventListener('submit', event => {
  event.preventDefault();
  const search = query.value.trim();
  const next = new URLSearchParams(catalog ? filters : '');
  if (search) next.set('q', search);
  else next.delete('q');
  location.href = 'products.html' + (next.size ? '?' + next : '') + '#products';
});

for (const [index, card] of [...document.querySelectorAll('.category')].entries()) {
  if (catalogLoaded && !card.dataset.catalogId) { card.remove(); continue; }
  const panel = document.createElement('details');
  panel.className = 'catalog-filter';
  const summary = document.createElement('summary');
  if (catalog) {
    summary.textContent = card.querySelector('h3').textContent.replace('↗','').trim();
    const photo = card.querySelector('.catalog-category-photo');
    if (photo) summary.prepend(photo);
  } else {
    panel.classList.add('home-category');
    summary.className = 'category';
    summary.innerHTML = card.innerHTML;
  }
  const links = document.createElement('div');
  links.className = 'filter-links';
  const subcategories = catalogGroups.get(index) || [];
  const groups = catalogLoaded ? subcategories.map(item => item.name)
    : [...new Set(items.filter(item => item.category === index && item.group).map(item => item.group))];
  for (const group of ['', ...groups]) {
    const link = document.createElement('a');
    const subcategory = subcategories.find(item => item.name === group);
    const filter = new URLSearchParams(catalogLoaded ? {cat:card.dataset.catalogId} : {category:index});
    if (filters.get('manage') === '1') filter.set('manage', '1');
    if (catalog && filters.has('q')) filter.set('q', filters.get('q'));
    if (subcategory) filter.set('sub',subcategory.id);
    else if (group) filter.set('group',group);
    link.href = 'products.html?' + filter + '#categories';
    link.textContent = group || 'Все в разделе';
    showCategoryPhoto(link, subcategories.find(item => item.name === group)?.photo);
    if (catalog && ((selectedSection === card.dataset.catalogId && selectedSubcategory === (subcategory ? String(subcategory.id) : null)) ||
        (filters.get('category') === String(index) && (filters.get('group') || '') === group))) {
      link.setAttribute('aria-current','true');
      panel.open = true;
    }
    links.append(link);
    if (catalog && subcategory) {
      addProductHere(links, subcategory.id, subcategory.name);
      addCategoryDelete(links, subcategory.id, 'Удалить подкатегорию');
    }
  }
  panel.append(summary,links);
  const categoryId = categoryIds.get(names[index]);
  if (catalog && categoryId !== undefined) {
    addCategoryDelete(links, categoryId, 'Удалить категорию');
  }
  card.replaceWith(panel);
}
function addProductHere(container, categoryId, name) {
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'theme-toggle catalog-owner-action';
  add.textContent = 'Добавить товар в «' + name + '»';
  add.onclick = () => document.dispatchEvent(new CustomEvent('semlys:edit-product', {
    detail: {categoryId, section:'product', focus:'[data-type="product"] [name="name"]'}
  }));
  container.append(add);
}
function addCategoryDelete(container, categoryToEdit, label) {
  if (categoryToEdit === -1) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'theme-toggle catalog-owner-action';
  button.textContent = label;
  button.onclick = () => document.dispatchEvent(new CustomEvent('semlys:delete-category', {
    detail:{categoryId:categoryToEdit, button}
  }));
  container.append(button);
}
if (catalog && ['q', 'category', 'group', 'cat', 'sub'].some(key => filters.has(key))) {
  const active = document.createElement('nav');
  active.className = 'active-filters';
  active.setAttribute('aria-label','Активные фильтры');
  for (const [key,label] of [
    ['q', filters.get('q')],
    ['category', names[filters.get('category')]],
    ['group', filters.get('group')],
    ['cat', names.find(name => String(categoryIds.get(name)) === selectedSection)],
    ['sub', [...catalogGroups.values()].flat().find(item => String(item.id) === selectedSubcategory)?.name]
  ]) {
    if (!label) continue;
    const next = new URLSearchParams(filters);
    next.delete(key);
    if (key === 'category') next.delete('group');
    if (key === 'cat') next.delete('sub');
    const link = document.createElement('a');
    link.href = 'products.html?' + next + '#products';
    link.textContent = label + ' ×';
    link.setAttribute('aria-label', 'Снять фильтр: ' + label);
    active.append(link);
  }
  const reset = document.createElement('a');
  reset.className = 'catalog-reset';
  reset.href = filters.get('manage') === '1' ? 'products.html?manage=1#products' : 'products.html#products';
  reset.textContent = 'Сбросить фильтры';
  active.append(reset);
  grid.before(active);
}
updateResults();

const cartKey = 'semlys-product-id-cart';
const cartProducts = new Map(items.map(item => [String(item.id), item]));
let cart = {};
try { cart = JSON.parse(localStorage.getItem(cartKey)) || {}; } catch {}
const cartDialog = document.createElement('dialog');
cartDialog.className = 'demo-dialog';
cartDialog.setAttribute('aria-labelledby', 'cart-title');
cartDialog.innerHTML = `<div class="demo-dialog-inner"><div class="demo-dialog-head"><h2 id="cart-title">Корзина</h2><form method="dialog"><button class="demo-close" aria-label="Закрыть">×</button></form></div>
  <ul class="cart-list"></ul><form class="order-form" hidden>
    <p data-order-total></p><p>Самовывоз · Оплата при получении</p>
    <label>Телефон <input name="phone" type="tel" autocomplete="tel" required maxlength="24"></label>
    <label>Комментарий (необязательно) <textarea name="comment" maxlength="300"></textarea></label>
    <button class="theme-toggle" type="submit">Отправить заказ</button>
  </form><p role="status" data-order-status></p></div>`;
document.body.append(cartDialog);
const orderForm = cartDialog.querySelector('.order-form');
const orderStatus = cartDialog.querySelector('[data-order-status]');
let orderPending = false;
orderForm.onsubmit = async event => {
  event.preventDefault();
  if (orderPending) return;
  const initData = window.Telegram?.WebApp?.initData;
  if (!initData) { orderStatus.textContent = 'Открой магазин в Telegram, чтобы отправить заказ.'; return; }
  const lines = Object.entries(cart).filter(([id]) => cartProducts.has(id))
    .map(([id, quantity]) => ({id:Number(id),quantity}));
  if (!lines.length) return;
  if (lines.length > 20) { orderStatus.textContent = 'В одном заказе можно отправить до 20 разных товаров.'; return; }
  const phone = orderForm.elements.phone.value.trim().replace(/[\s()-]/g,'');
  if (!/^\+?\d{10,15}$/.test(phone)) { orderStatus.textContent = 'Проверь номер телефона.'; return; }
  orderPending = true;
  orderForm.querySelector('button').disabled = true;
  orderStatus.textContent = 'Отправляем заказ…';
  try {
    const response = await fetch('https://semlys-api.semlissavazov.workers.dev/api/orders', {
      method:'POST', redirect:'error', body:JSON.stringify({
        initData, items:lines, phone, comment:orderForm.elements.comment.value.trim()
      })
    });
    if (response.status === 401) { orderStatus.textContent = 'Сеанс истёк. Открой магазин заново в Telegram.'; return; }
    if (response.status === 409) { orderStatus.textContent = 'Товар или цена изменились. Обнови каталог и проверь корзину.'; return; }
    if (!response.ok) throw Error();
    const {reference} = await response.json();
    cart = {};
    try { localStorage.removeItem(cartKey); } catch {}
    orderForm.reset();
    renderCart();
    orderStatus.textContent = 'Заказ №' + reference + ' отправлен.';
  } catch {
    orderStatus.textContent = 'Не удалось подтвердить отправку. Перед повтором уточни у менеджера, получил ли он заказ.';
  } finally {
    orderPending = false;
    orderForm.querySelector('button').disabled = false;
  }
};
const cartButton = document.querySelector('#cart-button');
cartButton.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4h3l2.5 12h11L21 7H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/></svg><span class="cart-count" aria-hidden="true" hidden></span>';
const cartCount = cartButton.querySelector('.cart-count');
cartButton.title = 'Корзина';
cartButton.onclick = () => cartDialog.showModal();
const cartStatus = document.createElement('p');
cartStatus.setAttribute('role', 'status');
const addToCart = document.createElement('button');
addToCart.type = 'button';
addToCart.className = 'theme-toggle';
addToCart.textContent = 'В корзину';
dialog.querySelector('.demo-dialog-inner').append(addToCart, cartStatus);
addToCart.onclick = () => {
  const item = items[opener?.dataset.itemId];
  if (!item || !Number.isFinite(item.price)) {
    cartStatus.textContent = 'Цена пока не указана. Уточни её у менеджера.';
    return;
  }
  const id = String(item.id);
  changeCart(id, 1);
  cartStatus.textContent = 'В корзине: ' + cart[id];
};
dialog.addEventListener('close', () => { cartStatus.textContent = ''; });

function changeCart(id, delta) {
  if (orderPending) return;
  const quantity = Math.min(99, (Number(cart[id]) || 0) + delta);
  if (quantity > 0) cart[id] = quantity;
  else delete cart[id];
  try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch {}
  renderCart();
}
function renderCart() {
  const list = cartDialog.querySelector('ul');
  list.replaceChildren();
  let count = 0;
  let total = 0;
  let missingPrice = false;
  for (const [id, quantity] of Object.entries(cart)) {
    const item = cartProducts.get(id);
    if (!item || !Number.isInteger(quantity) || quantity < 1) continue;
    if (Number.isFinite(item.price)) total += Math.round(item.price * 100) * quantity;
    else missingPrice = true;
    count += quantity;
    const row = document.createElement('li');
    const title = document.createElement('span');
    title.textContent = item.name + ' · ' + quantity + ' шт.';
    row.append(title);
    for (const [label, delta] of [['−', -1], ['+', 1], ['Удалить', -quantity]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-toggle';
      button.textContent = label;
      button.setAttribute('aria-label', (delta === 1 ? 'Увеличить количество: ' : label === '−' ? 'Уменьшить количество: ' : 'Удалить: ') + item.name);
      button.onclick = () => {
        const position = [...list.children].indexOf(row);
        const control = [...row.querySelectorAll('button')].indexOf(button);
        changeCart(id, delta);
        const next = list.children[Math.min(position, list.children.length - 1)]?.querySelectorAll('button')[control];
        (next || cartDialog.querySelector('.demo-close')).focus();
      };
      row.append(button);
    }
    list.append(row);
  }
  if (!count) {
    const empty = document.createElement('li');
    empty.textContent = 'Корзина пока пуста.';
    list.append(empty);
  }
  cartButton.setAttribute('aria-label', count ? 'Корзина: ' + count + ' шт.' : 'Корзина пуста');
  cartCount.textContent = count > 99 ? '99+' : count;
  cartCount.hidden = !count;
  orderForm.hidden = !count;
  orderForm.querySelector('[data-order-total]').textContent = missingPrice ? 'У одного из товаров больше нет цены.' :
    'Итого: ' + new Intl.NumberFormat('ru-RU', {style:'currency',currency:'RUB'}).format(total / 100);
}
renderCart();

const privacy = document.createElement('dialog');
privacy.className = 'demo-dialog';
privacy.setAttribute('aria-labelledby', 'privacy-title');
privacy.innerHTML = `
  <div class="demo-dialog-inner">
    <div class="demo-dialog-head">
      <h2 id="privacy-title">Политика конфиденциальности</h2>
      <form method="dialog"><button class="demo-close" aria-label="Закрыть">×</button></form>
    </div>
    <p>При отправке заказа состав корзины, имя и имя пользователя Telegram, телефон и комментарий передаются владельцу магазина через Telegram. Эти данные нужны для обработки заказа и связи с покупателем.</p>
    <p><strong>Поиск и настройки.</strong> Выбор темы хранится в браузере. Поисковый запрос может попасть в адрес страницы и историю браузера, а после публикации — в журналы хостинга. Не вводите в поиск телефон, адрес и другие личные данные.</p>
    <p><strong>Обращения.</strong> Ссылка «Написать менеджеру» открывает Telegram. Сайт не отправляет сообщение автоматически. Переписку обрабатывают Telegram и получатель сообщения. Для вопросов о данных, которые вы отправили менеджеру, можно обратиться к @semly1.</p>
    <p><strong>Внешние ресурсы.</strong> При загрузке веб-шрифтов браузер может обращаться к Google Fonts. Внешние сервисы могут получать IP-адрес и технические сведения о запросе.</p>
  </div>`;
document.body.append(privacy);
const privacyButton = document.createElement('button');
privacyButton.type = 'button';
privacyButton.className = 'privacy-link';
privacyButton.textContent = 'Политика конфиденциальности';
privacyButton.onclick = () => privacy.showModal();
const footerLinks = document.createElement('nav');
footerLinks.className = 'footer-links';
footerLinks.setAttribute('aria-label', 'Информация о магазине');
footerLinks.innerHTML = '<a href="index.html#place">Контакты</a><button type="button" class="privacy-link">Обмен и возврат</button><a href="https://t.me/semly1" target="_blank" rel="noopener noreferrer">Telegram менеджера ↗</a>';
footerLinks.append(privacyButton);
document.querySelector('footer').append(footerLinks);

const returns = document.createElement('dialog');
returns.className = 'demo-dialog';
returns.setAttribute('aria-labelledby', 'returns-title');
returns.innerHTML = `
  <div class="demo-dialog-inner">
    <div class="demo-dialog-head">
      <h2 id="returns-title">Обмен и возврат</h2>
      <form method="dialog"><button class="demo-close" aria-label="Закрыть">×</button></form>
    </div>
    <p>Напишите менеджеру, если хотите обсудить обмен или возврат. Укажите название товара, дату покупки и причину обращения. Если сохранился чек, держите его под рукой.</p>
    <p>Менеджер уточнит условия для вашей покупки и подскажет следующий шаг.</p>
    <a class="pill" href="https://t.me/semly1" target="_blank" rel="noopener noreferrer">Написать менеджеру ↗</a>
  </div>`;
document.body.append(returns);
footerLinks.querySelector('button').onclick = () => returns.showModal();

const support = document.createElement('aside');
support.className = 'support';
support.innerHTML = `
  <section id="support-panel" aria-labelledby="support-title" hidden>
    <header><strong id="support-title">Поддержка SEMLYS</strong><button type="button" data-close aria-label="Закрыть поддержку">×</button></header>
    <p>С чем помочь?</p>
    <div class="support-examples"></div>
    <div class="support-log" role="status"></div>
    <a data-telegram hidden href="https://t.me/semly1" target="_blank" rel="noopener noreferrer">Написать менеджеру</a>
  </section>
  <button class="support-toggle" type="button" aria-expanded="false" aria-controls="support-panel">Поддержка</button>`;
document.body.append(support);

const supportTopics = {
  'Проблема с товаром': 'Сохрани упаковку и чек, если они есть. Запиши название товара и что случилось. Если устройство греется, повреждено или протекает, прекрати пользоваться им.',
  'Вопрос по возврату': 'Подготовь название товара и дату покупки. Владелец уточнит, какие варианты доступны в твоей ситуации.',
  'Вопрос по самовывозу': 'Адрес и график пока не указаны на сайте. Перед поездкой уточни их у владельца.',
};
const supportPanel = support.querySelector('section');
const supportToggle = support.querySelector('.support-toggle');
const supportClose = support.querySelector('[data-close]');
const supportTip = support.querySelector('.support-log');
const managerLink = support.querySelector('[data-telegram]');

function toggleSupport(open) {
  supportPanel.hidden = !open;
  supportToggle.setAttribute('aria-expanded', String(open));
  (open ? supportClose : supportToggle).focus();
}
supportToggle.onclick = () => toggleSupport(supportPanel.hidden);
supportClose.onclick = () => toggleSupport(false);
support.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !supportPanel.hidden) toggleSupport(false);
});
for (const [topic, tip] of Object.entries(supportTopics)) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = topic;
  button.setAttribute('aria-pressed', 'false');
  support.querySelector('.support-examples').append(button);
  button.onclick = () => {
    for (const option of button.parentElement.children) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    supportTip.textContent = tip;
    if (!motion.matches && !document.documentElement.classList.contains('semlys-editor-view')) supportTip.animate([{opacity:0}, {opacity:1}], {duration:200});
    managerLink.hidden = false;
  };
}

const telegramOption = document.createElement('button');
telegramOption.type = 'button';
telegramOption.textContent = 'Написать в Telegram';
telegramOption.setAttribute('aria-pressed', 'false');
telegramOption.onclick = () => {
  for (const option of telegramOption.parentElement.children) {
    option.setAttribute('aria-pressed', String(option === telegramOption));
  }
  supportTip.textContent = '';
  managerLink.hidden = false;
};
support.querySelector('.support-examples').append(telegramOption);

// Keep the hit area stable by returning to a neutral pose on pointer exit.
const tiltPointer = matchMedia('(hover: hover) and (pointer: fine)');
for (const card of document.querySelectorAll('.demo-product, .catalog-filter')) {
  card.addEventListener('pointermove', event => {
    if (!tiltPointer.matches || motion.matches || event.pointerType === 'touch') return;
    const bounds = card.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, 2 * (event.clientX - bounds.left) / bounds.width - 1));
    const y = Math.max(-1, Math.min(1, 2 * (event.clientY - bounds.top) / bounds.height - 1));
    card.style.setProperty('--tilt-x', `${-y * 9}deg`);
    card.style.setProperty('--tilt-y', `${x * 11}deg`);
  });
  card.addEventListener('pointerleave', () => {
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  });
}
})();











