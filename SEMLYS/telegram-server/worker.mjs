const encoder = new TextEncoder();
const maxAuthAge = 300;

async function hmacKey(bytes) {
  return crypto.subtle.importKey('raw', bytes, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify']);
}

export async function verifyTelegramUser(initData, token, now = Date.now()) {
  if (typeof initData !== 'string' || !token || initData.length > 16384) return null;
  const fields = new URLSearchParams(initData);
  const hash = fields.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  if (new Set(fields.keys()).size !== [...fields.keys()].length) return null;
  const age = Math.floor(now / 1000) - Number(fields.get('auth_date'));
  if (!Number.isInteger(age) || age < -30 || age > maxAuthAge) return null;
  fields.delete('hash');
  fields.sort();
  const data = [...fields].map(([name, value]) => `${name}=${value}`).join('\n');
  const root = await hmacKey(encoder.encode('WebAppData'));
  const secret = await crypto.subtle.sign('HMAC', root, encoder.encode(token));
  const key = await hmacKey(secret);
  const signature = Uint8Array.from(hash.match(/../g), part => parseInt(part, 16));
  if (!await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data))) return null;
  try {
    const user = JSON.parse(fields.get('user'));
    if (!Number.isSafeInteger(user?.id) || user.id <= 0 || typeof user.first_name !== 'string') return null;
    return {
      id: String(user.id),
      name: user.first_name.slice(0, 128),
      username: typeof user.username === 'string' ? user.username.slice(0, 64) : null
    };
  } catch {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const siteOrigin = 'https://alabaisobaka228-dotcom.github.io';
    const origin = request.headers.get('Origin');
    const headers = {'Cache-Control': 'no-store', Vary: 'Origin'};
    if (origin === siteOrigin) headers['Access-Control-Allow-Origin'] = siteOrigin;
    const json = (data, status = 200) => Response.json(data, {
      status,
      headers
    });
    const path = new URL(request.url).pathname;
    if (path === '/api/catalog' && request.method === 'GET') {
      const [categories, products] = await env.DB.batch([
        env.DB.prepare('SELECT id, name FROM catalog_categories ORDER BY id'),
        env.DB.prepare('SELECT id, name, category, brand, description, photo FROM catalog_products ORDER BY id')
      ]);
      return json({categories: categories.results, products: products.results});
    }
    const writeCatalog = path === '/api/catalog';
    if (!writeCatalog && path !== '/api/telegram/profile') return json({error: 'not_found'}, 404);
    if (request.method !== 'POST') return json({error: 'method_not_allowed'}, 405);
    const reader = request.body?.getReader();
    if (!reader) return json({error: 'invalid_request'}, 400);
    const decoder = new TextDecoder();
    let initData = '';
    let size = 0;
    try {
      for (;;) {
        const {value, done} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) {
          await reader.cancel();
          return json({error: 'request_too_large'}, 413);
        }
        initData += decoder.decode(value, {stream: true});
      }
      initData += decoder.decode();
    } finally {
      reader.releaseLock();
    }
    let entry;
    if (writeCatalog) {
      try { entry = JSON.parse(initData); } catch { return json({error: 'invalid_request'}, 400); }
      initData = entry?.initData;
    }
    const user = await verifyTelegramUser(initData, env.TELEGRAM_BOT_TOKEN);
    if (!user) return json({error: 'invalid_telegram_session'}, 401);
    const isOwner = user.id === env.TELEGRAM_OWNER_ID;
    if (writeCatalog) {
      if (!isOwner) return json({error: 'owner_required'}, 403);
      const name = entry.name?.trim?.();
      if (!name || name.length > 100) return json({error: 'invalid_name'}, 400);
      if (entry.type === 'category') {
        const result = await env.DB.prepare('INSERT OR IGNORE INTO catalog_categories (name) VALUES (?)').bind(name).run();
        return result.meta.changes ? json({saved: true}, 201) : json({error: 'duplicate_category'}, 409);
      }
      const {category, brand, description, photo} = entry;
      if (entry.type !== 'product' || !Number.isSafeInteger(category) ||
          typeof brand !== 'string' || brand.length > 80 ||
          typeof description !== 'string' || description.length > 500 ||
          typeof photo !== 'string' || photo.length > 1024) return json({error: 'invalid_product'}, 400);
      if (photo) {
        let url;
        try { url = new URL(photo); } catch { return json({error: 'invalid_photo'}, 400); }
        if (url.protocol !== 'https:' || url.username || url.password) return json({error: 'invalid_photo'}, 400);
      }
      const result = await env.DB.prepare(
        'INSERT INTO catalog_products (name, category, brand, description, photo) SELECT ?, id, ?, ?, ? FROM catalog_categories WHERE id = ?'
      ).bind(name, brand, description, photo, category).run();
      return result.meta.changes ? json({saved: true}, 201) : json({error: 'invalid_category'}, 400);
    }
    await env.DB.prepare(
      'INSERT INTO telegram_profiles VALUES (?, ?, ?, ?) ON CONFLICT(telegram_id) DO UPDATE SET display_name = excluded.display_name, username = excluded.username, last_seen = excluded.last_seen'
    ).bind(user.id, user.name, user.username, Math.floor(Date.now() / 1000)).run();
    return json({user, isOwner});
  }
};
