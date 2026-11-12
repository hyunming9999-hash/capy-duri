#!/usr/bin/env python3
"""AI 코디 요청 처리 도구 (Claude가 채팅에서 요청을 처리할 때 쓴다).

  python3 tools/coordi.py fetch <방코드> <폴더>       대기 중인 요청과 사진을 폴더에 내려받고 manifest.json 작성
  python3 tools/coordi.py post  <방코드> <요청ID> <결과사진>   결과를 룩북에 올리고 요청을 완료 처리
  python3 tools/coordi.py fail  <방코드> <요청ID> <사유>       요청을 실패로 표시

방 코드는 초대 링크의 #join= 뒤 글자다. 저장소에는 절대 적지 않는다.
"""
import base64, io, json, os, sys, urllib.request

DB = 'https://capy-duri-default-rtdb.firebaseio.com/rooms/'

def call(room, path, method='GET', body=None):
    req = urllib.request.Request(f'{DB}{room}/{path}.json', method=method,
                                 data=None if body is None else json.dumps(body).encode(),
                                 headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode() or 'null')

def save_data_url(data_url, path_noext):
    head, b64 = data_url.split(',', 1)
    ext = 'png' if 'png' in head else 'webp' if 'webp' in head else 'jpg'
    raw = base64.b64decode(b64)
    if ext != 'jpg':  # 투명 배경 옷 사진은 흰 배경 JPEG로 바꿔 둔다
        from PIL import Image
        im = Image.open(io.BytesIO(raw)).convert('RGBA'); bg = Image.new('RGB', im.size, 'white'); bg.paste(im, mask=im.split()[3])
        out = io.BytesIO(); bg.save(out, 'JPEG', quality=92); raw = out.getvalue(); ext = 'jpg'
    path = f'{path_noext}.{ext}'
    open(path, 'wb').write(raw)
    return path

def fetch(room, outdir):
    os.makedirs(outdir, exist_ok=True)
    reqs = call(room, 'wear/requests') or {}
    members = call(room, 'members') or {}
    bases = call(room, 'wear/base') or {}
    name = lambda u: (members.get(u) or {}).get('name', '?')
    out = []
    for rid, r in sorted(reqs.items()):
        if r.get('status') != 'wait':
            continue
        base_id = bases.get(r.get('model'))
        if not base_id:
            out.append({'id': rid, 'error': '전신 사진이 없음'}); continue
        d = os.path.join(outdir, rid.lstrip('-')); os.makedirs(d, exist_ok=True)
        base = save_data_url(call(room, 'blobs/' + base_id), os.path.join(d, 'base'))
        items = []
        for i, b in enumerate([x for x in (r.get('items') or '').split(',') if x]):
            data = call(room, 'blobs/' + b)
            if data: items.append(save_data_url(data, os.path.join(d, f'item{i + 1}')))
        out.append({'id': rid, 'by': name(r.get('by')), 'model': name(r.get('model')), 'note': r.get('note', ''), 'base': base, 'items': items})
    json.dump(out, open(os.path.join(outdir, 'manifest.json'), 'w'), ensure_ascii=False, indent=2)
    print(json.dumps(out, ensure_ascii=False, indent=2))

def post(room, rid, image):
    from PIL import Image
    r = call(room, 'wear/requests/' + rid)
    if not r: sys.exit('요청을 찾을 수 없음: ' + rid)
    im = Image.open(image).convert('RGB'); im.thumbnail((900, 900))
    buf = io.BytesIO(); im.save(buf, 'JPEG', quality=82)
    blob = call(room, 'blobs', 'POST', 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode())['name']
    look = call(room, 'wear/looks', 'POST', {'by': r['by'], 'model': r['model'], 'img': blob, 'note': r.get('note', ''), 'ts': {'.sv': 'timestamp'}, 'ai': True})['name']
    call(room, 'wear/requests/' + rid, 'DELETE')
    print(f'룩북에 올림: look={look} ({len(buf.getvalue()) // 1024}KB), 요청 {rid} 완료')

def fail(room, rid, why):
    call(room, 'wear/requests/' + rid, 'PATCH', {'status': 'fail', 'why': why[:120]})
    print('실패로 표시:', rid)

if __name__ == '__main__':
    a = sys.argv[1:]
    if len(a) == 3 and a[0] == 'fetch': fetch(a[1], a[2])
    elif len(a) == 4 and a[0] == 'post': post(a[1], a[2], a[3])
    elif len(a) == 4 and a[0] == 'fail': fail(a[1], a[2], a[3])
    else: sys.exit(__doc__)
