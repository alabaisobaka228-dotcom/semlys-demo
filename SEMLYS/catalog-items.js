const items = [
  {name:'Под-система Smoant', brand:'Smoant', category:0, group:'Smoant', description:'Демонстрационная карточка под-системы.'},
  {name:'Под-система Vaporesso', brand:'Vaporesso', category:0, group:'Vaporesso', description:'Пример карточки устройства.'},
  {name:'Жидкость «Ягоды»', category:1, group:'Ягодные', description:'Пример карточки жидкости с ягодным профилем.'},
  {name:'Жидкость «Мята»', category:1, group:'Мятные', description:'Пример карточки жидкости с мятным профилем.'},
  {name:'Картридж для под-системы', category:2, group:'Сменные', description:'Пример карточки сменного картриджа.'},
  {name:'Сменный картридж', category:2, group:'Сменные', description:'Пример второй карточки этого раздела.'},
  {name:'Luma Pocket', brand:'Luma Demo', category:0, group:'Luma Demo', description:'Вымышленный подик с матовым корпусом.'},
  {name:'Luma Arc', brand:'Luma Demo', category:0, group:'Luma Demo', description:'Вымышленная модель с округлым корпусом.'},
  {name:'Orbit Slate', brand:'Orbit Demo', category:0, group:'Orbit Demo', description:'Вымышленный подик в графитовом цвете.'},
  {name:'Черника и смородина', brand:'Mist Demo', category:1, group:'Ягодные', description:'Вымышленная жидкость с ягодным профилем.'},
  {name:'Мята и лайм', brand:'Mist Demo', category:1, group:'Мятные', description:'Вымышленная жидкость с мятным и цитрусовым профилем.'},
  {name:'Персик и груша', brand:'Mist Demo', category:1, group:'Фруктовые', description:'Вымышленная жидкость с фруктовым профилем.'},
  {name:'Яблоко и манго', brand:'Mist Demo', category:1, group:'Фруктовые', description:'Вымышленная жидкость с яблочным и тропическим профилем.'}
];

const categoryNames = ['Под-системы', 'Жидкости', 'Картриджи', 'Аксессуары'];
const baseCategoryCount = categoryNames.length;
try {
  const savedCatalog = semlysHistory.open('semlys-visual-v2').read().current.catalog;
  if (savedCatalog) {
    categoryNames.push(...savedCatalog.categories);
    items.push(...savedCatalog.items);
  }
} catch {}

const featuredDefaults = [0, 1, 2, 3];
function featuredSelection(value) {
  if (!Array.isArray(value) || value.length !== featuredDefaults.length ||
      new Set(value).size !== featuredDefaults.length ||
      !value.every(id => Number.isInteger(id) && items[id])) {
    return featuredDefaults;
  }
  return value;
}
