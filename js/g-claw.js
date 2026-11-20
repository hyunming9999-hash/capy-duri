// 인형뽑기(3D) — 유리 상자를 비스듬히 내려다보며 집게를 앞뒤·좌우로 옮겨 내려서 동물 인형을 뽑는다
// 인형은 얼굴이 그려진 둥근 공. 3D 물리(cannon-es)로 서로 밀리고 쌓인다. 그림은 three.js (둘 다 이 게임을 열 때만 받는다)
// 일곱 번을 한 묶음으로, 그중 무작위 한 번은 집게가 꽉 잡는다(반드시 한 번). 나머지는 힘이 약해 올리다 놓친다
// 뽑은 인형은 가방(bag/<uid>/dolls)에 모인다: 친목회에서 동물에게 선물하거나 가슴에 배지로 단다
import { h, toast, modal, loadImg, gameFx } from './ui.js';
import { sfx } from './sound.js';
import { ANIMALS, animalSvg } from './animals.js';
import { FLUFFY } from './fluffy.js';
import { coinGate } from './arcade.js';

// 상자 안쪽: 가로 x -5~5, 깊이 z -4(뒤)~4(앞), 높이 y 0~9. 나오는 곳은 왼쪽 앞 모서리(바닥이 뚫려 있고 유리 칸막이로 둘러쌈)
const BX = 5, BZ = 4, HOLE_X = -2.3, HOLE_Z = 1.3, WALL_H = 5.3, TOP = 7.95, REST = 6.6, N_DOLL = 40, PACK = 7, OUT = { x: -3.65, z: 2.65 }, HOME_Y = 7.45;
const dollSrc = i => (FLUFFY ? `img/fl/a${i}-base.webp` : 'data:image/svg+xml;utf8,' + encodeURIComponent(animalSvg(i, true)));
export const dollImg = i => `<img src="${dollSrc(i)}" alt="" loading="lazy">`;

export function mount(el, ctx) {
  let grabTry = false, alive = true, raf = 0, lastT = 0, mine = {}, pity = null, plays = 0, gateAt = 0, busy = false, lucky = false, held = null, slip = null, target = null, ready = false, world = null;
  const dir = { x: 0, z: 0 }, dolls = [], start = { x: OUT.x, z: OUT.z }; /* 집게 정위치 = 나오는 곳 바로 위 */
  const claw = { x: OUT.x, y: HOME_Y, z: OUT.z, open: 1, st: 'idle', t: 0 };
  const me = { id: 'claw', title: '인형뽑기', face: 'wow', acc: 'ribbon' };
  const canvas = h('canvas', { class: 'claw-cv' });
  const tries = h('small', { class: 'claw-try' }), shelf = h('div', { class: 'claw-shelf' }), load = h('i', { class: 'claw-load' }, '기계 켜는 중…');
  const hold = (ax, d) => ({ onPointerDown: e => { e.preventDefault(); dir[ax] = d; }, onPointerUp: () => { dir[ax] = 0; }, onPointerLeave: () => { dir[ax] = 0; }, onPointerCancel: () => { dir[ax] = 0; } });
  const bGo = h('button', { class: 'claw-go', onClick: () => drop() }, '잡기');
  el.append(h('div', { class: 'claw' }, h('b', { class: 'claw-name' }, '인형뽑기'), canvas, load,
    h('div', { class: 'claw-pad' }, h('div', { class: 'claw-dpad' }, h('button', { class: 'claw-arrow up', 'aria-label': '뒤로', ...hold('z', -1) }, '▲'), h('button', { class: 'claw-arrow lf', 'aria-label': '왼쪽', ...hold('x', -1) }, '◀'), h('button', { class: 'claw-arrow rt', 'aria-label': '오른쪽', ...hold('x', 1) }, '▶'), h('button', { class: 'claw-arrow dn', 'aria-label': '앞으로', ...hold('z', 1) }, '▼')), tries, bGo)),
    h('p', { class: 'dim center claw-tip' }, '▲▼◀▶ 로 집게를 앞뒤·좌우로 옮기고 잡기를 눌러요. 1판 50 · 3판 150 · 5판 200코인'),
    h('b', { class: 'claw-h' }, '🧸 내가 뽑은 인형'), shelf);

  const rnd = (a, b) => a + Math.random() * (b - a);
  // ---- 가방의 인형·보장 묶음·남은 판
  const P = 'bag/' + ctx.uid;
  const TEST = new URLSearchParams(location.search).has('clawtest'); // 연습 링크(?clawtest): 코인이 안 들고, 뽑은 인형과 차례도 저장하지 않는다
  const drawTries = () => { tries.textContent = TEST ? '연습 중 · 무료' : `남은 판 ${plays}`; }; // 확률(묶음 몇 번째인지)은 화면에 보이지 않는다
  const setPlays = n => { if (TEST) { plays = 99; drawTries(); return Promise.resolve(); } plays = Math.max(0, n); drawTries(); return ctx.store.set(P + '/clawPlays', plays || null).catch(() => {}); };
  function gate(again) { if (TEST || document.querySelector('.arc-gate')) return; coinGate(ctx, me, n => setPlays(plays + n), null, again); } // 50코인 1판 · 150코인 3판 · 200코인 5판
  const myDoll = () => (ctx.members[ctx.uid] || {}).doll;
  const wear = async i => { ctx.members[ctx.uid] = { ...(ctx.members[ctx.uid] || {}), doll: i }; await ctx.store.update('members/' + ctx.uid, { doll: i }).catch(() => {}); drawShelf(); toast(i == null ? '인형 배지를 뗐어요' : `${ANIMALS[i].name} 인형을 가슴에 달았어요`); };
  function drawShelf() { const list = Object.entries(mine).filter(([k, n]) => n > 0 && ANIMALS[k]).map(([k, n]) => [+k, n]), on = myDoll();
    shelf.replaceChildren(...(list.length ? list.map(([i, n]) => h('button', { class: 'claw-my' + (on === i ? ' on' : ''), onClick: () => { modal({ title: `🧸 ${ANIMALS[i].name} 인형 ${n}개`, body: h('div', { class: 'claw-info' }, h('span', { html: dollImg(i) }), h('p', null, '친목회에서 동물에게 🎁 선물로 줄 수 있어요(친밀도 +6, 그 동물 본인 인형이면 +12). 가슴에 배지로 달 수도 있어요.')), actions: [{ label: '닫기' }, { label: on === i ? '배지 떼기' : '🎀 가슴에 달기', primary: true, onClick: x => { x(); wear(on === i ? null : i); } }] }); } },
      h('span', { html: dollImg(i) }), h('small', null, on === i ? '착용 중' : `${ANIMALS[i].name} ×${n}`))) : [h('p', { class: 'dim center' }, '아직 없어요. 집게로 뽑아 보세요!')])); }
  const offs = [ctx.store.on(P + '/dolls', v => { mine = v || {}; drawShelf(); }), ctx.store.on(P + '/claw', v => { if (!TEST) pity = v && typeof v.n === 'number' ? v : null; }),
    ctx.store.on(P + '/clawPlays', v => { if (TEST) { plays = 99; drawTries(); return; } plays = Math.max(0, +v || 0); drawTries(); if (!plays && !gateAt) { gateAt = 1; setTimeout(() => alive && !plays && gate(false), 600); } })];
  if (TEST) plays = 99; drawShelf(); drawTries();

  // ---- 3D 장면
  let THREE, CANNON, renderer, scene, camera, clawG, cable, gantry, cart, pusher, dollMat, UP, TMP; const prongs = [], marks = [];
  // 인형: 동물마다 색·귀·주둥이가 다른 3D 머리 봉제 인형(공 하나에 귀·눈·코·볼터치를 붙인다). 반지름 1짜리로 만들어 크기만 키운다
  let SPH, CONE; const matOf = {}, mt = col => matOf[col] || (matOf[col] = new THREE.MeshLambertMaterial({ color: col })), INK = '#3A2A22';
  function makeDoll(i) { const a = ANIMALS[i], g = new THREE.Group(), body = a.body, light = a.light, earC = a.earC || a.body, inner = a.inner || light, dark = a.dark || INK, es = a.es || 1, nm = a.name;
    const P = (geo, col, s, p, rz = 0, rx = 0) => { const m = new THREE.Mesh(geo, mt(col)); m.scale.set(s[0], s[1], s[2]); m.position.set(p[0], p[1], p[2]); m.rotation.set(rx, 0, rz); g.add(m); return m; };
    P(SPH, body, [1, 0.95, 0.96], [0, 0, 0]);
    for (const s of [-1, 1]) {
      if (a.ear === 'round') { P(SPH, earC, [0.34 * es, 0.34 * es, 0.17], [s * 0.66, 0.72, -0.02]); P(SPH, inner, [0.2 * es, 0.2 * es, 0.1], [s * 0.66, 0.72, 0.1]); }
      else if (a.ear === 'pointy') { P(CONE, earC, [0.3, 0.66, 0.2], [s * 0.56, 0.95, 0], -s * 0.28); P(CONE, inner, [0.16, 0.4, 0.1], [s * 0.56, 0.9, 0.12], -s * 0.28); }
      else if (a.ear === 'long') { P(SPH, earC, [0.2, 0.72, 0.14], [s * 0.36, 1.38, 0], -s * 0.14); P(SPH, inner, [0.1, 0.52, 0.08], [s * 0.36, 1.38, 0.1], -s * 0.14); }
      else if (a.ear === 'side') { P(SPH, earC, [0.3, 0.3, 0.15], [s * 1.0, 0.28, 0]); P(SPH, inner, [0.17, 0.17, 0.09], [s * 1.02, 0.28, 0.1]); }
      else if (a.ear === 'fold') P(CONE, earC, [0.28, 0.44, 0.16], [s * 0.6, 0.86, 0.12], -s * 0.55, 0.5);
      else if (a.ear === 'narrow') { P(CONE, earC, [0.17, 0.54, 0.12], [s * 0.44, 1.04, 0], -s * 0.16); P(CONE, inner, [0.09, 0.34, 0.07], [s * 0.44, 1.0, 0.08], -s * 0.16); }
      else if (a.ear === 'tuft') P(CONE, earC, [0.15, 0.4, 0.12], [s * 0.56, 0.96, 0], -s * 0.55);
      // 눈 주변 무늬(판다·너구리·부엉이) → 눈 → 반짝임 → 볼터치
      if (nm === '판다' || nm === '너구리') P(SPH, nm === '판다' ? '#3B3B44' : '#4A4038', [0.22, 0.26, 0.08], [s * 0.37, 0.12, 0.84], s * 0.3);
      if (nm === '부엉이') P(SPH, '#F3E2C4', [0.27, 0.27, 0.08], [s * 0.36, 0.14, 0.84]);
      const top = a.muz === 'frog' && nm === '개구리', ex = s * (top ? 0.44 : 0.36), ey = top ? 0.82 : 0.14, ez = top ? 0.52 : 0.9;
      if (top) P(SPH, body, [0.27, 0.27, 0.27], [ex, 0.76, 0.36]);
      P(SPH, nm === '판다' ? '#FFFFFF' : INK, [0.125, 0.15, 0.08], [ex, ey, ez]); P(SPH, nm === '판다' ? INK : '#FFFFFF', [0.05, 0.05, 0.035], [ex + 0.04, ey + 0.06, ez + 0.065]);
      P(SPH, '#FF9FB0', [0.15, 0.09, 0.05], [s * 0.6, -0.14, 0.74]);
      if (a.muz === 'snout' || a.muz === 'cow') P(SPH, dark, [0.045, 0.065, 0.03], [s * 0.11, a.muz === 'cow' ? -0.3 : -0.18, a.muz === 'cow' ? 1.06 : 1.1]);
    }
    // 주둥이
    if (a.muz === 'std') { P(SPH, light, [0.4, 0.3, 0.22], [0, -0.22, 0.84]); P(SPH, a.nose || INK, [0.1, 0.075, 0.06], [0, -0.1, 1.03]); }
    else if (a.muz === 'snout') P(SPH, light, [0.3, 0.22, 0.2], [0, -0.18, 0.92]);
    else if (a.muz === 'cow') P(SPH, light, [0.5, 0.3, 0.28], [0, -0.32, 0.8]);
    else if (a.muz === 'beak') P(CONE, light, [0.17, 0.34, 0.17], [0, -0.12, 1.04], 0, Math.PI / 2);
    else if (a.muz === 'bill') P(SPH, light, [0.3, 0.1, 0.26], [0, -0.2, 1.0]);
    else if (a.muz === 'big') P(SPH, INK, [0.17, 0.24, 0.14], [0, -0.08, 0.98]);
    else if (a.muz === 'tiny') P(SPH, '#B5544A', [0.08, 0.07, 0.05], [0, -0.15, 0.98]);
    else if (a.muz === 'frog') P(SPH, dark, [0.32, 0.03, 0.05], [0, -0.3, 0.92]);
    // 동물마다 한 가지 특징
    if (nm === '사자') for (let k = 0; k < 12; k++) { const t = k * Math.PI / 6; P(SPH, '#D98A2B', [0.3, 0.3, 0.26], [Math.cos(t) * 0.98, Math.sin(t) * 0.94, -0.12]); }
    if (nm === '유니콘') P(CONE, '#FFD75E', [0.13, 0.6, 0.13], [0, 1.18, 0.3], 0, 0.25);
    if (nm === '닭') { P(SPH, '#E5484D', [0.14, 0.2, 0.2], [0, 1.02, 0.15]); P(SPH, '#E5484D', [0.12, 0.16, 0.16], [0, 0.98, -0.12]); }
    if (nm === '병아리' || nm === '오리') P(CONE, body, [0.1, 0.3, 0.1], [0, 1.02, 0.05], 0.3);
    if (nm === '펭귄') P(SPH, '#FFFFFF', [0.66, 0.62, 0.3], [0, -0.1, 0.72]);
    if (nm === '호랑이') for (const x of [-0.2, 0, 0.2]) P(SPH, INK, [0.045, 0.2, 0.1], [x, 0.84, 0.44]);
    if (nm === '고슴도치') for (let k = 0; k < 9; k++) { const t = (k - 4) * 0.36; P(CONE, '#8A5E3A', [0.14, 0.42, 0.14], [Math.sin(t) * 0.9, Math.cos(t) * 0.86, -0.38], -t); }
    if (nm === '문어') for (const x of [-0.6, -0.3, 0, 0.3, 0.6]) P(SPH, body, [0.17, 0.24, 0.17], [x, -0.92, 0.2]);
    if (nm === '여우' || nm === '늑대') for (const s of [-1, 1]) P(SPH, light, [0.26, 0.22, 0.1], [s * 0.6, -0.32, 0.66]);
    return g; }
  function addDoll(x, y, z) { const i = Math.floor(Math.random() * ANIMALS.length), r = rnd(0.78, 0.87), face = makeDoll(i); face.scale.setScalar(r);
    face.rotation.set(rnd(-0.55, 0.15), rnd(-1.0, 1.0), rnd(-0.4, 0.4)); scene.add(face); // 제각각 기울어진 채로 쌓인다(굴러도 돌지는 않는다)
    const body = new CANNON.Body({ mass: 1, shape: new CANNON.Sphere(r), material: dollMat, fixedRotation: true, linearDamping: 0.45 }); // 인형은 돌지 않는다
    body.position.set(x == null ? rnd(HOLE_X + 1.4, BX - 1.2) : x, y == null ? rnd(9, 12) : y, z == null ? rnd(-BZ + 1.2, BZ - 1.2) : z); world.addBody(body);
    const d = { i, r, face, body }; dolls.push(d); return d; }
  function build() {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1)); renderer.outputColorSpace = THREE.SRGBColorSpace;
    SPH = new THREE.SphereGeometry(1, 20, 14); CONE = new THREE.ConeGeometry(1, 1, 14);
    scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(40, 1.33, 0.1, 100); camera.position.set(0, 9.6, 14.6); camera.lookAt(0, 3.7, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 1.25)); const sun = new THREE.DirectionalLight(0xffffff, 1.7); sun.position.set(3, 12, 8); scene.add(sun);
    const p1 = new THREE.PointLight(0xff6bd6, 30, 30); p1.position.set(-4, 7, 3); const p2 = new THREE.PointLight(0x35e0ff, 30, 30); p2.position.set(4, 7, 3); scene.add(p1, p2);
    const box = (w, hh, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mat); m.position.set(x, y, z); scene.add(m); return m; };
    const neonP = new THREE.MeshBasicMaterial({ color: 0xff6bd6 }), neonC = new THREE.MeshBasicMaterial({ color: 0x35e0ff }), dark = new THREE.MeshLambertMaterial({ color: 0x241650 }), side = new THREE.MeshLambertMaterial({ color: 0x2c1a60 }), floorM = new THREE.MeshLambertMaterial({ color: 0x6a45c8 });
    // 뒷벽·옆벽·바닥(나오는 곳만 뚫림)
    box(BX * 2, 9, 0.2, dark, 0, 4.5, -BZ - 0.1); box(0.2, 9, BZ * 2, side, -BX - 0.1, 4.5, 0); box(0.2, 9, BZ * 2, side, BX + 0.1, 4.5, 0);
    box(BX - HOLE_X, 0.4, BZ * 2, floorM, (BX + HOLE_X) / 2, -0.2, 0); box(HOLE_X + BX, 0.4, BZ + HOLE_Z, floorM, (HOLE_X - BX) / 2, -0.2, (HOLE_Z - BZ) / 2);
    box(HOLE_X + BX, 0.1, BZ - HOLE_Z, new THREE.MeshBasicMaterial({ color: 0x0b0620 }), (HOLE_X - BX) / 2, -2.4, (BZ + HOLE_Z) / 2);
    const grid = new THREE.GridHelper(10, 10, 0x9d7bff, 0x8a66ee); grid.position.set(0, 0.02, 0); grid.scale.set(1, 1, 0.8); scene.add(grid);
    [-3.3, -1.1, 1.1, 3.3].forEach((x, k) => box(0.12, 8.6, 0.05, k % 2 ? neonP : neonC, x, 4.5, -BZ + 0.05)); // 뒷벽 네온 줄
    const post = new THREE.MeshLambertMaterial({ color: 0xcdd3f5 }); [[-BX, -BZ], [BX, -BZ], [-BX, BZ], [BX, BZ]].forEach(([x, z]) => box(0.16, 9, 0.16, post, x, 4.5, z)); // 네 귀퉁이 기둥
    // 나오는 곳 유리 칸막이
    const glass = new THREE.MeshBasicMaterial({ color: 0x7cf3ff, transparent: true, opacity: 0.16, depthWrite: false });
    box(0.08, WALL_H, BZ - HOLE_Z, glass, HOLE_X, WALL_H / 2, (BZ + HOLE_Z) / 2); box(HOLE_X + BX, WALL_H, 0.08, glass, (HOLE_X - BX) / 2, WALL_H / 2, HOLE_Z);
    box(0.1, 0.1, BZ - HOLE_Z, neonC, HOLE_X, WALL_H, (BZ + HOLE_Z) / 2); box(HOLE_X + BX, 0.1, 0.1, neonC, (HOLE_X - BX) / 2, WALL_H, HOLE_Z); box(0.1, WALL_H, 0.1, neonC, HOLE_X, WALL_H / 2, HOLE_Z); box(0.1, WALL_H, 0.1, neonC, HOLE_X, WALL_H / 2, BZ);
    // 레일(앞뒤로 움직이는 가로대)·수레·줄·집게
    const metal = new THREE.MeshStandardMaterial({ color: 0xe6eaff, metalness: 0.7, roughness: 0.3 }), red = new THREE.MeshStandardMaterial({ color: 0xff4f7a, metalness: 0.3, roughness: 0.5 });
    box(0.25, 0.25, BZ * 2, metal, -BX + 0.3, 8.7, 0); box(0.25, 0.25, BZ * 2, metal, BX - 0.3, 8.7, 0);
    gantry = box(BX * 2 - 0.4, 0.3, 0.45, metal, 0, 8.7, 0); cart = box(1.3, 0.55, 1.0, red, 0, 8.45, 0);
    cable = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), metal); scene.add(cable);
    clawG = new THREE.Group(); scene.add(clawG); clawG.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.5, 16), metal)); const gem = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), neonP); gem.position.y = -0.3; clawG.add(gem);
    for (let k = 0; k < 3; k++) { const piv = new THREE.Group(); piv.rotation.y = k * Math.PI * 2 / 3 + Math.PI / 2; clawG.add(piv); const arm = new THREE.Group(); arm.position.set(0.5, -0.1, 0); piv.add(arm);
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.05, 0.22), metal); a.position.set(0.28, -0.42, 0); a.rotation.z = 0.55; arm.add(a); const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.95, 0.22), metal); b.position.set(0.36, -1.25, 0); b.rotation.z = -0.42; arm.add(b); prongs.push(arm); }
    // 조준 표시: 레이저 포인터처럼 작은 점(가운데 심 + 번지는 빛 + 가는 빛줄기). 네온처럼 밝아졌다 어두워졌다 한다. 점이 찍힌 인형을 집는다
    { const mk = (geo, op) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xfff23a, depthTest: false, transparent: true, opacity: op })); m.renderOrder = 9; scene.add(m); marks.push(m); return m; };
      mk(new THREE.SphereGeometry(0.085, 12, 8), 1); mk(new THREE.SphereGeometry(0.2, 14, 10), 0.4); mk(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), 0.4); UP = new THREE.Vector3(0, 1, 0); TMP = new THREE.Vector3(); }
    // 물리
    world = new CANNON.World({ gravity: new CANNON.Vec3(0, -32, 0) }); world.allowSleep = false; world.solver.iterations = 12;
    dollMat = new CANNON.Material('doll'); const wallMat = new CANNON.Material('wall'); world.addContactMaterial(new CANNON.ContactMaterial(dollMat, dollMat, { friction: 0.5, restitution: 0.05 })); world.addContactMaterial(new CANNON.ContactMaterial(dollMat, wallMat, { friction: 0.35, restitution: 0.05 }));
    const fix = (hx, hy, hz, x, y, z) => { const b = new CANNON.Body({ mass: 0, material: wallMat, shape: new CANNON.Box(new CANNON.Vec3(hx, hy, hz)) }); b.position.set(x, y, z); world.addBody(b); };
    fix((BX - HOLE_X) / 2, 1, BZ, (BX + HOLE_X) / 2, -1, 0); fix((HOLE_X + BX) / 2, 1, (BZ + HOLE_Z) / 2, (HOLE_X - BX) / 2, -1, (HOLE_Z - BZ) / 2); // 바닥 두 조각
    fix(1, 10, BZ, -BX - 1, 8, 0); fix(1, 10, BZ, BX + 1, 8, 0); fix(BX + 2, 10, 1, 0, 8, -BZ - 1); fix(BX + 2, 10, 1, 0, 8, BZ + 1); // 네 벽
    fix(0.06, (WALL_H + 2) / 2, (BZ - HOLE_Z) / 2, HOLE_X, (WALL_H - 2) / 2, (BZ + HOLE_Z) / 2); fix((HOLE_X + BX) / 2, (WALL_H + 2) / 2, 0.06, (HOLE_X - BX) / 2, (WALL_H - 2) / 2, HOLE_Z); // 칸막이
    // 집게 발끝: 움직이는 내내 인형과 부딪혀 밀어낸다(그냥 통과하지 않는다)
    pusher = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, material: wallMat }); pusher.addShape(new CANNON.Sphere(0.46), new CANNON.Vec3(0, 0, 0)); pusher.position.set(0, 30, 0); world.addBody(pusher);
    fill();
    resize(); ready = true; load.remove();
  }
  function fill() {
    // 인형을 빼곡히: 바닥을 다 덮는 격자로 두 겹 넘게 깔고(나오는 곳 칸은 비움), 가라앉힌 채로 시작한다
  { const cells = []; for (let lay = 0; lay < 4; lay++) for (let zi = 0; zi < 4; zi++) for (let xi = 0; xi < 5; xi++) { const x = -3.9 + xi * 1.95 + (lay % 2) * 0.5 - 0.25, z = -2.9 + zi * 1.9 + (lay % 2) * 0.5 - 0.25; if (!inOut(x, z, 1.1)) cells.push([x, 0.95 + lay * 1.5, z]); }
    cells.slice(0, N_DOLL).forEach(([x, y, z]) => addDoll(x + rnd(-0.12, 0.12), y, z + rnd(-0.12, 0.12))); }
  for (let k = 0; k < 300; k++) world.step(1 / 60);
  for (const d of dolls) { const p = d.body.position; if (p.y < -1 || p.y > 8 || inOut(p.x, p.z, 0)) { p.set(rnd(0, BX - 1.2), 6, rnd(-BZ + 1.2, 0)); d.body.velocity.set(0, 0, 0); } }
  for (let k = 0; k < 120; k++) world.step(1 / 60);
  }
  function resize() { if (!renderer) return; const w = canvas.clientWidth || 300, hh = canvas.clientHeight || 226; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); }

  // ---- 집게
  const tipY = () => claw.y - 1.75;
  // 조준: 집게 바로 아래에서 가장 위에 있는 인형. 인형 사이 틈에 서도 깊은 데 인형이 아니라 위쪽 인형을 고르고, 한번 고른 인형은 쉽게 안 바뀐다(깜빡임 방지)
  let aimed = null; const aimPos = { x: 0, y: 0, z: 0, has: false };
  const aimDoll = () => { let d = null, best = -1e9, cur = -1e9; for (const o of dolls) { const p = o.body.position, h = Math.hypot(p.x - claw.x, p.z - claw.z); if (h < o.r + 0.2) { const sc = p.y - 0.5 * h; if (o === aimed) cur = sc; if (sc > best) { best = sc; d = o; } } }
    if (cur > -1e8 && best - cur < 0.3) d = aimed; aimed = d; return d; };
  const inOut = (x, z, m = 0) => x < HOLE_X + m && z > HOLE_Z - m;
  function drop() {
    if (!ready || busy || claw.st !== 'idle') return;
    if (inOut(claw.x, claw.z, 0.9)) return toast('집게를 인형 위로 옮긴 다음 눌러 주세요', 1800);
    if (plays <= 0) return gate(false);
    setPlays(plays - 1); busy = true; dir.x = dir.z = 0; bGo.disabled = true;
    // 점이 찍힌 인형은 반드시 집어 올린다. 집어 올린 것 일곱 번 중 한 번만 끝까지 가져오고(n·k), 나머지 여섯 번은 옮기는 도중에 놓친다
    target = aimDoll(); grabTry = !!target; lucky = false;
    if (target) { const p = pity ? { ...pity } : {}; if (!(p.n < PACK)) { p.n = 0; p.k = Math.floor(Math.random() * PACK); } lucky = p.n === p.k; p.n += 1; pity = p; TEST || ctx.store.set(P + '/claw', p).catch(() => {}); }
    claw.st = 'down'; sfx('tock');
  }
  const grab = d => { held = d; d.body.type = CANNON.Body.KINEMATIC; d.body.mass = 0; d.body.updateMassProperties(); d.body.velocity.set(0, 0, 0); };
  function letGo(win, straight) { const d = held; held = null; slip = null; if (!d) return; if (straight) win = 2; /* 옮기다 놓칠 때는 옆으로 튀지 않고 그대로 떨어진다 */ d.body.type = CANNON.Body.DYNAMIC; d.body.mass = 1; d.body.updateMassProperties(); d.body.wakeUp(); d.body.velocity.set(win ? 0 : rnd(-1.5, 1.5), 0, win ? 0 : rnd(-1.5, 1.5)); if (win !== true) sfx('bad'); }
  function done() { busy = false; bGo.disabled = false; lucky = false; target = null; if (plays <= 0) setTimeout(() => alive && plays <= 0 && gate(true), 1600); }
  function removeDoll(d) { dolls.splice(dolls.indexOf(d), 1); world.removeBody(d.body); scene.remove(d.face); }
  function prize(d) { removeDoll(d); const i = d.i; gameFx('win', `${ANIMALS[i].name} 인형을 뽑았어요`, '성공!'); if (TEST) toast('연습이라 인형은 가방에 들어가지 않아요', 2200); else ctx.store.tx(`${P}/dolls/${i}`, c => (c || 0) + 1).catch(() => {}); if (!dolls.length) setTimeout(() => alive && ready && !dolls.length && fill(), 1500); } // 뽑은 인형은 기계에서 없어진다. 다 뽑으면 새로 채운다
  function moveClaw(dt) {
    const c = claw;
    if (c.st === 'idle') { const ox = c.x, oz = c.z; c.x = Math.max(-BX + 1, Math.min(BX - 1, c.x + dir.x * 4.6 * dt)); c.z = Math.max(-BZ + 1, Math.min(BZ - 1, c.z + dir.z * 4.6 * dt));
      const was = ox < HOLE_X + 0.9 && oz > HOLE_Z - 0.9; if (!was && c.x < HOLE_X + 0.9 && c.z > HOLE_Z - 0.9) { if (ox >= HOLE_X + 0.9) c.x = HOLE_X + 0.9; else c.z = HOLE_Z - 0.9; }
      const wy = inOut(c.x, c.z, 0.9) ? HOME_Y : REST, dy = wy - c.y; c.y += Math.sign(dy) * Math.min(Math.abs(dy), 3 * dt); } /* 칸 위에서는 칸막이보다 높이 떠 있는다 */ // 나오는 곳 칸 위로는 못 간다(그 뒤쪽·옆쪽은 다 간다)
    else if (c.st === 'down') { c.y -= 5.2 * dt; if (target && !dolls.includes(target)) target = null; // 점 찍힌 인형을 감싸는 높이까지 그대로 내려간다. 없으면 바닥까지
      if ((target && tipY() <= target.body.position.y - 0.05) || tipY() <= 0.55) { c.st = 'close'; c.t = 0; } }
    else if (c.st === 'close') { c.t += dt; c.open = Math.max(0, 1 - c.t / 0.4); c.open = Math.max(target ? 0.3 : 0, c.open); /* 인형을 잡을 때는 인형 둘레까지만 오므린다 */
      if (c.t >= 0.5) { if (target) { grab(target); sfx('pair'); slip = null;
          if (!lucky) { const at = f => inOut(c.x + (OUT.x - c.x) * f, c.z + (OUT.z - c.z) * f, 1.15); let edge = 1; while (edge > 0 && at(edge)) edge -= 0.02; /* 나오는 곳 칸막이 바로 앞 */
            const r = (window.__claw && window.__claw.mode) || Math.random(), lift = { y: rnd(Math.min(c.y + 1.3, TOP - 0.4), TOP - 0.3) };
            if (edge < 0.2) slip = lift; /* 출구 바로 옆에서 집었으면 들어 올리다 놓친다 */
            else if (r < 0.25) slip = lift; else if (r < 0.7) slip = { f: edge }; /* 출구 직전에서 놓친다 */ else slip = { f: rnd(0.3, 0.75) * edge }; } }
        c.st = 'up'; } }
    else if (c.st === 'up') { c.y += 4.4 * dt; if (held && slip && slip.y != null && c.y >= slip.y) letGo(false, true); if (!held) c.open = Math.min(0.6, c.open + dt * 2.5); if (c.y >= TOP) { c.y = TOP; c.st = 'carry'; c.t = 0; c.from = { x: c.x, z: c.z }; } }
    else if (c.st === 'carry') { const L = Math.hypot(OUT.x - c.from.x, OUT.z - c.from.z) || 1; c.t = Math.min(1, c.t + 4 * dt / L); c.x = c.from.x + (OUT.x - c.from.x) * c.t; c.z = c.from.z + (OUT.z - c.from.z) * c.t;
      if (held && slip && slip.f != null && c.t >= slip.f) letGo(false, true); if (!held) c.open = Math.min(0.6, c.open + dt * 2.5); /* 놓쳐도 정위치까지 그대로 간다 */ if (c.t >= 1) { c.st = held ? 'release' : 'back'; c.t = 0; } }
    else if (c.st === 'release') { c.t += dt; c.open = Math.min(1, 0.3 + c.t / 0.25); if (held && c.t > 0.12) letGo(true); if (c.t > 0.7) c.st = 'back'; }
    else if (c.st === 'back') { c.open = Math.min(1, c.open + dt * 3); const dx = start.x - c.x, dz = start.z - c.z, L = Math.hypot(dx, dz), s = Math.min(L, 5 * dt); if (L > 0.001) { c.x += dx / L * s; c.z += dz / L * s; } const dy = HOME_Y - c.y; if (L < 1.2) c.y += Math.sign(dy) * Math.min(Math.abs(dy), 3 * dt);
      if (L < 0.02 && Math.abs(dy) < 0.02 && c.open >= 1) { c.x = start.x; c.z = start.z; c.y = HOME_Y; c.st = 'idle'; done(); } }
    if (held) { const b = held.body, q = b.position, k = Math.min(1, dt * 12), ty = tipY() + 0.62; q.set(q.x + (c.x - q.x) * k, q.y + (ty - q.y) * k, q.z + (c.z - q.z) * k); b.velocity.set(0, 0, 0); }
    // 집게 끝: 내려가거나 오므릴 때 주변 인형을 밀어낸다
    // 집게 끝 충돌체는 집게를 옮길 때만 켠다. 방금 놓친 인형이 집게 끝에 얹혀 딸려 오지 않게, 주변이 비어야 다시 켠다
    const parked = pusher.position.y > 20, tx0 = c.x, ty0 = tipY() + 0.3, tz0 = c.z, clear = !parked || !dolls.some(o => { const p = o.body.position; return Math.hypot(p.x - tx0, p.y - ty0, p.z - tz0) < o.r + 0.55; });
    if (!held && c.st === 'idle' && clear) { const px = c.x, py = tipY() + 0.3, pz = c.z, q = pusher.position, far = q.y > 20, k = dt > 0 ? 1 / dt : 0; pusher.velocity.set(far ? 0 : (px - q.x) * k, far ? 0 : (py - q.y) * k, far ? 0 : (pz - q.z) * k); q.set(px, py, pz); } /* 속도를 같이 넘겨야 부딪힌 인형이 밀려난다 */
    else { pusher.position.set(0, 30, 0); pusher.velocity.set(0, 0, 0); }
  }
  function sync() {
    const c = claw; gantry.position.z = c.z; cart.position.set(c.x, 8.45, c.z); clawG.position.set(c.x, c.y, c.z); const len = Math.max(0.1, 8.2 - c.y); cable.scale.y = len; cable.position.set(c.x, c.y + len / 2, c.z);
    const ang = -0.5 + c.open * 0.62; prongs.forEach(a => { a.rotation.z = ang; });
    for (const d of dolls) { const p = d.body.position; d.face.position.set(p.x, p.y, p.z); }
    { const a = c.st === 'idle' ? aimDoll() : null, on = c.st === 'idle', w = 0.5 + 0.5 * Math.sin(performance.now() / 170), [dot, halo, beam] = marks; marks.forEach(m => { m.visible = on; });
      if (on) { let tx = c.x, ty = 0.03, tz = c.z; if (a) { const p = a.body.position; tx = p.x; ty = p.y + a.r * 0.8; tz = p.z + a.r * 0.6; } /* 점은 인형의 위·앞쪽(카메라에서 잘 보이는 곳)에 찍힌다 */
        const k = aimPos.has ? 0.3 : 1; aimPos.x += (tx - aimPos.x) * k; aimPos.y += (ty - aimPos.y) * k; aimPos.z += (tz - aimPos.z) * k; aimPos.has = true; /* 점이 튀지 않고 미끄러지듯 옮겨 간다 */
        dot.position.set(aimPos.x, aimPos.y, aimPos.z); halo.position.copy(dot.position); halo.scale.setScalar(0.75 + w * 0.7); halo.material.opacity = 0.18 + w * 0.42; dot.material.opacity = 0.75 + w * 0.25;
        const fx = c.x, fy = tipY() + 0.5, fz = c.z, vx = aimPos.x - fx, vy = aimPos.y - fy, vz = aimPos.z - fz, len = Math.max(0.05, Math.hypot(vx, vy, vz)); /* 빛줄기: 집게 가운데 → 점 */
        beam.scale.y = len; beam.position.set(fx + vx / 2, fy + vy / 2, fz + vz / 2); beam.quaternion.setFromUnitVectors(UP, TMP.set(vx / len, vy / len, vz / len)); beam.material.opacity = 0.3 + w * 0.45; } else aimPos.has = false; }
  }
  function frame(t) { if (!alive) return; raf = requestAnimationFrame(frame); if (!ready) return; const dt = Math.min(0.033, (t - (lastT || t)) / 1000); lastT = t;
    moveClaw(dt); world.step(1 / 60, dt, 3);
    for (const d of dolls) { if (d === held) continue; if (d.body.type !== CANNON.Body.DYNAMIC) { d.body.type = CANNON.Body.DYNAMIC; d.body.mass = 1; d.body.updateMassProperties(); d.body.wakeUp(); } /* 놓친 인형이 공중에 굳어 있지 않게 */ const v = d.body.velocity, q = d.body.position; if (q.y > WALL_H - 0.4 && q.y < WALL_H + 1.4 && v.length() < 1.2 && claw.st !== 'release') { if (Math.abs(q.x - HOLE_X) < 0.95 && q.z > HOLE_Z - 0.95) v.x = 2.4; else if (Math.abs(q.z - HOLE_Z) < 0.95 && q.x < HOLE_X + 0.95) v.z = -2.4; } /* 나오는 곳 유리 칸막이 위에 걸터앉지 않게 더미 쪽으로 밀어 떨어뜨린다 */ const _v = v, sp = v.length(); if (sp > 7) v.scale(7 / sp, v); if (v.y > 4) v.y = 4; } // 집게나 잡힌 인형에 밀린 인형이 튕겨 날아가지 않게 속도를 묶는다
    for (const d of [...dolls]) { const p = d.body.position; if (p.y < -2.6) { if (inOut(p.x, p.z, 0.2)) prize(d); else { p.set(rnd(HOLE_X + 1.4, BX - 1.2), 10, rnd(-BZ + 1.2, BZ - 1.2)); d.body.velocity.set(0, 0, 0); } } }
    sync(); renderer.render(scene, camera); }

  Promise.all([import('./vendor/three.module.min.js'), import('./vendor/cannon-es.min.js')]).then(([t, c]) => { if (!alive) return; THREE = t; CANNON = c; try { build(); } catch (e) { console.error(e); load.textContent = '이 기기에서는 3D를 켤 수 없어요'; } }).catch(() => { load.textContent = '기계를 불러오지 못했어요. 다시 들어와 주세요'; });
  raf = requestAnimationFrame(frame);
  const key = e => { if (e.repeat) return; const dn = e.type === 'keydown', K = { ArrowLeft: ['x', -1], ArrowRight: ['x', 1], ArrowUp: ['z', -1], ArrowDown: ['z', 1] }[e.key]; if (K) { e.preventDefault(); if (dn) dir[K[0]] = K[1]; else if (dir[K[0]] === K[1]) dir[K[0]] = 0; } else if (dn && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); drop(); } };
  addEventListener('keydown', key); addEventListener('keyup', key); addEventListener('resize', resize);
  if (new URLSearchParams(location.search).get('mock')) window.__claw = { claw, dolls, drop, force: () => { pity = { n: 0, k: 0 }; }, dump: () => dolls.map(d => [d.body.type, d.body.mass, +d.body.position.y.toFixed(2), +d.body.velocity.y.toFixed(2), d.body.sleepState, +d.body.invMass.toFixed(2)]), setPlays: n => setPlays(n), plays: () => plays, pos: () => dolls.map(d => [d.body.position.x, d.body.position.y, d.body.position.z]), state: () => ({ st: claw.st, lucky, grabTry, held: !!held, pity, n: dolls.length, mine, ready }) };
  return () => { alive = false; cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', key); removeEventListener('resize', resize); offs.forEach(f => f && f());
    try { if (renderer) { Object.values(matOf).forEach(m => m.dispose()); SPH && SPH.dispose(); CONE && CONE.dispose(); renderer.dispose(); } } catch (e) { /* 정리 실패는 무시 */ } };
}
