(() => {
  function open(key) {
    function read() {
      const raw = JSON.parse(localStorage.getItem(key)) || {};
      return raw.format === 1 ? raw : {format: 1, current: raw, versions: []};
    }

    function save(next) {
      const state = read();
      const current = typeof next === 'function' ? next(state.current) : next;
      if (JSON.stringify(current) === JSON.stringify(state.current)) return;
      const versions = [
        {at: Date.now(), values: state.current},
        ...state.versions
      ].slice(0, 5);
      while (true) {
        try {
          localStorage.setItem(key, JSON.stringify({format: 1, current, versions}));
          return;
        } catch (error) {
          if (error.name !== 'QuotaExceededError' || versions.length < 2) throw error;
          versions.pop();
        }
      }
    }

    return {read, save};
  }

  function mount(container, store, status, onRestore) {
    const list = document.createElement('select');
    list.setAttribute('aria-label', 'Версия настроек');
    const restore = document.createElement('button');
    restore.type = 'button';
    restore.textContent = 'Восстановить выбранную версию';
    const refresh = () => {
      const versions = store.read().versions;
      list.replaceChildren(new Option('Исходные настройки', 'default'));
      versions.forEach(({at}, index) => {
        list.add(new Option(`Версия ${index + 1} · ${new Date(at).toLocaleString('ru-RU')}`, index));
      });
      return versions;
    };
    let versions = refresh();
    restore.onclick = () => {
      if (!confirm('Восстановить эту версию? Текущие настройки останутся в истории.')) return;
      try {
        const values = list.value === 'default' ? {} : versions[Number(list.value)].values;
        store.save(values);
        versions = refresh();
        onRestore(values);
      } catch {
        status.textContent = 'Не удалось восстановить версию.';
      }
    };
    container.append(list, restore);
    return () => { versions = refresh(); };
  }

  window.semlysHistory = {open, mount};
})();
