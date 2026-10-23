// Compare panel: engine renders (Unity, Unreal, three.js) shown next to the
// live stand and locked to its timeline. Videos are seeked frame by frame so
// scrubbing the stand scrubs every render at the same time.
//
// Renders come from two places:
//   1. stand/renders/manifest.json, committed by agents next to the files
//   2. files the viewer drops in (kept in memory only)

export function setupCompare() {
  const slots = document.getElementById('slots');
  const drop = document.getElementById('drop');
  const file = document.getElementById('file');
  const info = document.getElementById('compareInfo');
  let manifest = [];
  let dropped = [];
  let current = { style: '', fx: '' };

  fetch('./renders/manifest.json')
    .then(r => (r.ok ? r.json() : { items: [] }))
    .then(m => { manifest = m.items || []; draw(); })
    .catch(() => {});

  function item(src, label, isVideo, removable, key) {
    const el = document.createElement('div');
    el.className = 'slot';
    const media = document.createElement(isVideo ? 'video' : 'img');
    media.src = src;
    if (isVideo) { media.muted = true; media.playsInline = true; media.preload = 'auto'; }
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = label;
    el.append(media, tag);
    if (removable) {
      const x = document.createElement('button');
      x.className = 'x';
      x.textContent = '×';
      x.onclick = () => { dropped = dropped.filter(d => d.key !== key); draw(); };
      el.append(x);
    }
    return el;
  }

  function draw() {
    slots.textContent = '';
    const mine = manifest.filter(m => m.style === current.style && m.effect === current.fx);
    for (const m of mine) {
      slots.append(item(`./renders/${m.file}`, `${m.engine}${m.note ? ' · ' + m.note : ''}`, /\.(mp4|webm|mov)$/i.test(m.file), false));
    }
    for (const d of dropped) slots.append(item(d.url, d.name, d.video, true, d.key));
    info.textContent = mine.length || dropped.length
      ? 'Renders follow the timeline. Scrub to compare frame by frame.'
      : 'No renders for this effect yet. Drop videos or frame strips here.';
  }

  function add(files) {
    for (const f of files) {
      dropped.push({ key: `${f.name}-${f.size}-${Math.random()}`, name: f.name, url: URL.createObjectURL(f), video: f.type.startsWith('video') });
    }
    draw();
  }

  file.onchange = () => add(file.files);
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); add(e.dataTransfer.files); });

  return {
    refresh(style, fx) { current = { style, fx }; draw(); },
    sync(t) {
      for (const v of slots.querySelectorAll('video')) {
        if (!v.duration) continue;
        const target = Math.min(t, v.duration - 0.001);
        if (Math.abs(v.currentTime - target) > 0.008) v.currentTime = target;
      }
    },
  };
}
