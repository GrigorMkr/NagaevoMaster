/**
 * Минимальный клиент GitFlic REST API.
 * Документация: https://docs.gitflic.ru/latest/api/intro/
 */
const API_BASE = 'https://api.gitflic.ru';

export class GitFlicApi {
  constructor(token) {
    if (!token?.trim()) {
      throw new Error('GITFLIC_TOKEN не задан (deploy/gitflic.env)');
    }
    this.token = token.trim();
  }

  async request(method, path, body) {
    const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
    const headers = {
      Accept: 'application/json',
      Authorization: `token ${this.token}`,
    };
    const init = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    const response = await fetch(url, init);
    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    return { ok: response.ok, status: response.status, data };
  }

  get(path) {
    return this.request('GET', path);
  }

  post(path, body) {
    return this.request('POST', path, body);
  }

  patch(path, body) {
    return this.request('PATCH', path, body);
  }

  put(path, body) {
    return this.request('PUT', path, body);
  }
}
