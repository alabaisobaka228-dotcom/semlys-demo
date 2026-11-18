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
const grid = document.querySelector('#products .products');
const status = document.querySelector('#search-note');
const query = document.querySelector('#query');
const filters = new URLSearchParams(location.search);
const dialog = document.createElement('dialog');
dialog.className = 'demo-dialog card-transition';
dialog.setAttribute('aria-labelledby', 'item-title');
dialog.innerHTML = '<div class="demo-dialog-inner"><div class="demo-dialog-head"><span class="label">Демотовар</span><button type="button" class="demo-close" aria-label="Закрыть">×</button></div><h2 id="item-title"></h2><p class="item-description"></p></div>';
document.body.append(dialog);
const close = dialog.querySelector('button');
let closing = false;
async function returnToList() {
  if (closing || !dialog.open) return;
  closing = true;
  if (!motion.matches && opener) {
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
  card.querySelector('p').textContent = [item.brand, 'Демотовар'].filter(Boolean).join(' · ');
  card.querySelector('.product-image').innerHTML = '<i class="item-shape"></i>';
  card.dataset.kind = item.category;
  card.dataset.itemId = String(items.indexOf(item));
  const description = document.createElement('p');
  description.textContent = item.description;
  card.append(description);
  card.onclick = () => {
    const from = card.getBoundingClientRect();
    opener = card;
    dialog.querySelector('h2').textContent = item.name;
    dialog.querySelector('.item-description').textContent = item.description;
    dialog.showModal();
    if (motion.matches) return;
    const to = dialog.getBoundingClientRect();
    const x = from.left + (from.width - to.width)/2 - to.left;
    const y = from.top + (from.height - to.height)/2 - to.top;
    dialog.animate([
      {transform:`translate(${x}px,${y}px) scale(.55)`,opacity:.4},
      {transform:'none',opacity:1}
    ], {duration:380,easing:'cubic-bezier(.23,1,.32,1)'});
  };
  return card;
}

function updateResults() {
  query.value = filters.get('q') || '';
  const normalize = value => value.toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const terms = normalize(query.value).split(/\s+/);
  const aliases = ['под подик подики подсистема подсистемы под системы', 'жижа жижи жидкость жидкости', 'картридж картриджи'];
  const found = items.filter(item =>
    (!filters.has('category') || filters.get('category') === String(item.category)) &&
    (!filters.has('group') || filters.get('group') === item.group) &&
    terms.every(term => normalize([item.name,item.brand,item.group,aliases[item.category]].join(' ')).includes(term))
  );
  let featured = featuredDefaults;
  if (!catalog) {
    try {
      featured = featuredSelection(semlysHistory.open('semlys-store-settings').read().current.featured);
    } catch {}
  }
  grid.replaceChildren(...(catalog ? found : featured.map(id => items[id])).map(itemCard));
  if (catalog) status.textContent = found.length ? 'Найдено: ' + found.length : 'Ничего не найдено. Измените запрос или снимите фильтр ниже.';
}

document.querySelector('#search').addEventListener('submit', event => {
  event.preventDefault();
  const search = query.value.trim();
  const next = new URLSearchParams(catalog ? filters : '');
  if (filters.get('edit') === '1') next.set('edit', '1');
  if (search) next.set('q', search);
  else next.delete('q');
  location.href = 'products.html' + (next.size ? '?' + next : '') + '#products';
});

const categoryGrid = document.querySelector('.category-grid');
for (const name of categoryNames.slice(baseCategoryCount)) {
  const card = document.createElement('div');
  card.className = 'category';
  const title = document.createElement('h3');
  title.textContent = name;
  card.append(title);
  categoryGrid.append(card);
}
for (const [index, card] of [...categoryGrid.querySelectorAll('.category')].entries()) {
  const panel = document.createElement('details');
  panel.className = 'catalog-filter';
  const summary = document.createElement('summary');
  if (catalog) {
    summary.textContent = card.querySelector('h3').textContent.replace('↗','').trim();
  } else {
    panel.classList.add('home-category');
    summary.className = 'category';
    summary.innerHTML = card.innerHTML;
  }
  const links = document.createElement('div');
  links.className = 'filter-links';
  const groups = [...new Set(items.filter(item => item.category === index && item.group).map(item => item.group))];
  for (const group of ['', ...groups]) {
    const link = document.createElement('a');
    const filter = new URLSearchParams({category:index});
    if (catalog && filters.has('q')) filter.set('q', filters.get('q'));
    if (group) filter.set('group',group);
    link.href = 'products.html?' + filter + '#categories';
    link.textContent = group || 'Все в разделе';
    if (catalog && filters.get('category') === String(index) && (filters.get('group') || '') === group) {
      link.setAttribute('aria-current','true');
      panel.open = true;
    }
    links.append(link);
  }
  panel.append(summary,links);
  card.replaceWith(panel);
}
if (catalog && filters.size) {
  const active = document.createElement('nav');
  active.className = 'active-filters';
  active.setAttribute('aria-label','Активные фильтры');
  for (const [key,label] of [
    ['q', filters.get('q')],
    ['category', categoryNames[filters.get('category')]],
    ['group', filters.get('group')]
  ]) {
    if (!label) continue;
    const next = new URLSearchParams(filters);
    next.delete(key);
    if (key === 'category') next.delete('group');
    const link = document.createElement('a');
    link.href = 'products.html?' + next + '#products';
    link.textContent = label + ' ×';
    link.setAttribute('aria-label', 'Снять фильтр: ' + label);
    active.append(link);
  }
  const reset = document.createElement('a');
  reset.className = 'catalog-reset';
  reset.href = 'products.html#products';
  reset.textContent = 'Сбросить фильтры';
  active.append(reset);
  grid.before(active);
}
updateResults();

const cartKey = 'semlys-demo-cart';
let cart = {};
try { cart = JSON.parse(localStorage.getItem(cartKey)) || {}; } catch {}
const cartDialog = document.createElement('dialog');
cartDialog.className = 'demo-dialog';
cartDialog.setAttribute('aria-labelledby', 'cart-title');
cartDialog.innerHTML = '<div class="demo-dialog-inner"><div class="demo-dialog-head"><h2 id="cart-title">Демо-корзина</h2><form method="dialog"><button class="demo-close" aria-label="Закрыть">×</button></form></div><p>Пробный список. Заказы не оформляются.</p><ul class="cart-list"></ul></div>';
document.body.append(cartDialog);
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
addToCart.textContent = 'В демо-корзину';
dialog.querySelector('.demo-dialog-inner').append(addToCart, cartStatus);
addToCart.onclick = () => {
  const id = opener?.dataset.itemId;
  if (id == null || !items[id]) return;
  changeCart(id, 1);
  cartStatus.textContent = 'В корзине: ' + cart[id];
};
dialog.addEventListener('close', () => { cartStatus.textContent = ''; });

function changeCart(id, delta) {
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
  for (const [id, quantity] of Object.entries(cart)) {
    if (!items[id] || !Number.isInteger(quantity) || quantity < 1) continue;
    count += quantity;
    const row = document.createElement('li');
    const title = document.createElement('span');
    title.textContent = items[id].name + ' · ' + quantity + ' шт.';
    row.append(title);
    for (const [label, delta] of [['−', -1], ['+', 1], ['Удалить', -quantity]]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'theme-toggle';
      button.textContent = label;
      button.setAttribute('aria-label', (delta === 1 ? 'Увеличить количество: ' : label === '−' ? 'Уменьшить количество: ' : 'Удалить: ') + items[id].name);
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
    <p>Это уведомление описывает работу демонстрационной версии SEMLYS. На сайте нет регистрации, оформления заказов, оплаты или формы отправки обращений.</p>
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
    if (!motion.matches) supportTip.animate([{opacity:0}, {opacity:1}], {duration:200});
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
