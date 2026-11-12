// 둘이 같은 데이터를 보는 연결부. 실제로는 Firebase, 주소에 ?mock 이 붙으면 이 브라우저 안에서만 도는 연습용 저장소.
import * as fb from './vendor/firebase.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDXwevj-3pxv6pZM9OssGIdlSE1oReHNx4',
  authDomain: 'capy-duri.firebaseapp.com',
  databaseURL: 'https://capy-duri-default-rtdb.firebaseio.com',
  projectId: 'capy-duri',
  storageBucket: 'capy-duri.firebasestorage.app',
  messagingSenderId: '13888865903',
  appId: '1:13888865903:web:c40b16762d86b778ae2f9a',
};

export const isMock = new URLSearchParams(location.search).has('mock');
let onErr = () => {};
export const setErrorHandler = fn => { onErr = fn; };

class FireStore {
  constructor(room) {
    this.app = fb.initializeApp(firebaseConfig);
    this.db = fb.getDatabase(this.app);
    this.base = 'rooms/' + room;
    this.offset = 0;
    this.connected = false;
    this.connCbs = new Set();
    fb.onValue(fb.ref(this.db, '.info/serverTimeOffset'), s => { this.offset = s.val() || 0; });
    fb.onValue(fb.ref(this.db, '.info/connected'), s => { this.connected = !!s.val(); this.connCbs.forEach(f => f(this.connected)); });
  }
  r(p) { return fb.ref(this.db, this.base + (p ? '/' + p : '')); }
  on(p, cb, o = {}) {
    const q = o.limit ? fb.query(this.r(p), fb.limitToLast(o.limit)) : this.r(p);
    return fb.onValue(q, s => cb(s.val()), e => onErr(e));
  }
  get(p) { return fb.get(this.r(p)).then(s => s.val()); }
  set(p, v) { return fb.set(this.r(p), v).catch(e => { onErr(e); throw e; }); }
  update(p, v) { return fb.update(this.r(p), v).catch(e => { onErr(e); throw e; }); }
  key(p) { return fb.push(this.r(p)).key; }
  push(p, v) { const k = this.key(p); return this.set(p + '/' + k, v).then(() => k); }
  remove(p) { return fb.remove(this.r(p)).catch(e => { onErr(e); throw e; }); }
  tx(p, fn) { return fb.runTransaction(this.r(p), fn).catch(e => { onErr(e); throw e; }); }
  now() { return Date.now() + this.offset; }
  onConn(f) { this.connCbs.add(f); f(this.connected); return () => this.connCbs.delete(f); }
  // 접속 표시: 연결돼 있는 동안 {at, where(지금 보고 있는 화면)}을 올려 두고, 끊기면 서버가 지운다
  presence(uid) {
    this.puid = uid;
    fb.onValue(fb.ref(this.db, '.info/connected'), s => {
      if (!s.val()) return;
      const r = this.r('presence/' + uid);
      fb.onDisconnect(r).remove(); fb.set(r, { at: fb.serverTimestamp(), where: this.pwhere || 'home' }).catch(() => {});
    });
  }
  setWhere(w) { this.pwhere = w; if (this.puid && this.connected) fb.set(this.r('presence/' + this.puid + '/where'), w).catch(() => {}); }
  // 연결이 끊기면 서버가 알아서 지워 주는 값 (산책 위치, 음성 대기 표시 등)
  ephemeral(p, v) { const r = this.r(p); fb.onDisconnect(r).remove().catch(() => {}); return fb.set(r, v).catch(e => { onErr(e); throw e; }); }
}

// 연습용: 같은 브라우저의 탭끼리만 공유
class MockStore {
  constructor(room) {
    this.k = 'capy-mock-' + room;
    try { this.tree = JSON.parse(localStorage.getItem(this.k) || '{}'); } catch { this.tree = {}; }
    this.ls = new Set(); this.n = 0;
    this.bc = new BroadcastChannel(this.k);
    this.bc.onmessage = e => this._apply(e.data.p, e.data.v, true);
  }
  _seg(p) { return p ? p.split('/').filter(Boolean) : []; }
  _get(p) { let n = this.tree; for (const s of this._seg(p)) { if (n == null || typeof n !== 'object') return null; n = n[s]; } return n === undefined ? null : n; }
  _apply(p, v, remote) {
    const seg = this._seg(p); const last = seg.pop(); let n = this.tree;
    for (const s of seg) { if (typeof n[s] !== 'object' || n[s] == null) n[s] = {}; n = n[s]; }
    if (v == null) delete n[last]; else n[last] = JSON.parse(JSON.stringify(v));
    if (!remote) this.bc.postMessage({ p, v });
    if (!p.startsWith('rt/')) { try { localStorage.setItem(this.k, JSON.stringify({ ...this.tree, rt: undefined })); } catch {} }
    for (const l of this.ls) if (l.p === p || l.p.startsWith(p + '/') || p.startsWith(l.p + '/') || l.p === '') this._emit(l);
  }
  _emit(l) {
    let v = this._get(l.p);
    if (v && typeof v === 'object') { v = JSON.parse(JSON.stringify(v)); if (l.o.limit) { const ks = Object.keys(v).sort().slice(-l.o.limit); v = Object.fromEntries(ks.map(k => [k, v[k]])); } }
    l.cb(v);
  }
  on(p, cb, o = {}) { const l = { p, cb, o }; this.ls.add(l); queueMicrotask(() => this.ls.has(l) && this._emit(l)); return () => this.ls.delete(l); }
  get(p) { const v = this._get(p); return Promise.resolve(v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v); }
  set(p, v) { this._apply(p, v); return Promise.resolve(); }
  update(p, v) { for (const [k, x] of Object.entries(v)) this._apply(p + '/' + k, x); return Promise.resolve(); }
  key() { return '-M' + Date.now().toString(36).padStart(9, '0') + (this.n++).toString(36).padStart(3, '0') + Math.random().toString(36).slice(2, 6); }
  push(p, v) { const k = this.key(); this._apply(p + '/' + k, v); return Promise.resolve(k); }
  remove(p) { this._apply(p, null); return Promise.resolve(); }
  async tx(p, fn) { const cur = await this.get(p); const nv = fn(cur); if (nv !== undefined) this._apply(p, nv); }
  now() { return Date.now(); }
  onConn(f) { f(true); return () => {}; }
  presence(uid) { this.puid = uid; this._apply('presence/' + uid, { at: Date.now(), where: this.pwhere || 'home' }); }
  setWhere(w) { this.pwhere = w; if (this.puid) this._apply('presence/' + this.puid + '/where', w); }
  ephemeral(p, v) { this._apply(p, v); return Promise.resolve(); }
}

export function openStore(room) { return isMock ? new MockStore(room) : new FireStore(room); }

// 사진은 목록과 따로 저장해 두고 화면에 보일 때만 불러온다
const cache = new Map();
export function putBlob(store, dataUrl) { const k = store.key('blobs'); cache.set(k, Promise.resolve(dataUrl)); return store.set('blobs/' + k, dataUrl).then(() => k); }
export function getBlob(store, k) { if (!cache.has(k)) cache.set(k, store.get('blobs/' + k)); return cache.get(k); }
export function delBlob(store, k) { cache.delete(k); return store.remove('blobs/' + k); }
