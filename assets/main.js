// 李铿 Kenny 作品集网页
// 电脑：平滑滚动 + 滚动驱动动效（每帧给 .scene 写 --p，具体怎么动在 style.css）
// 手机（窄屏）：不钉住、不做逐帧动画，只用进入视口时的淡入，横向内容用原生横滑
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mql = matchMedia('(max-width: 899px)');
  const mobile = mql.matches;
  // 跨过手机／电脑分界（比如平板转屏）时整页重载，两套布局不混用
  if (mql.addEventListener) mql.addEventListener('change', () => location.reload());

  // 字体就绪后再播开场字母动画，避免先闪一下系统字体
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => root.classList.add('ready'));

  // ---------- 进入视口时浮现 ----------
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('in');
      io.unobserve(e.target);
      if (e.target.classList.contains('compare')) sweep(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
  if (mobile) {
    // 手机上开篇的编号、标题、画面、信息卡依次淡入
    document.querySelectorAll('.opener').forEach((sec) => {
      ['.num', '.title', '.frame', '.info'].forEach((q, i) => {
        const el = sec.querySelector(q);
        if (!el) return;
        el.classList.add('rv');
        el.style.transitionDelay = (i * 0.08) + 's';
      });
    });
  }
  document.querySelectorAll('.reveal, .rimg, .rig, .rv').forEach((el) => io.observe(el));

  // ---------- 开篇视频 ----------
  // 按屏幕选 720p／1080p；电脑：滑到附近就加载、在画面里就播；手机：画面露出大半才播，省流量也更顺
  const pickRes = () => (window.innerWidth >= 900 && window.innerWidth * (window.devicePixelRatio || 1) >= 1400 ? '1080' : '720');
  const load = (v) => { if (!v.src) { v.src = v.dataset.src + '-' + pickRes() + '.mp4'; v.preload = 'auto'; } };
  const videos = [...document.querySelectorAll('video.bgv')];
  if (mobile) {
    const vio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target;
        if (e.isIntersecting) load(v);
        if (e.intersectionRatio >= 0.6) v.play().catch(() => {});
        else v.pause();
      }
    }, { threshold: [0, 0.6] });
    videos.forEach((v) => vio.observe(v));
  } else {
    const vio = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const v = e.target._video;
        if (e.isIntersecting) { load(v); v.play().catch(() => {}); }
        else v.pause();
      }
    }, { rootMargin: '30% 0px 30% 0px' });
    videos.forEach((v) => { const sec = v.closest('.opener'); sec._video = v; vio.observe(sec); });
  }

  // 开声音：同一时间只让一段视频出声
  const sndButtons = [...document.querySelectorAll('.snd')];
  const videoOf = (btn) => btn.closest('.stage, .vid').querySelector('video');
  sndButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const v = videoOf(btn);
      const turnOn = v.muted;
      sndButtons.forEach((b) => { videoOf(b).muted = true; b.textContent = '开声音'; });
      if (!turnOn) return;
      load(v);
      v.muted = false;
      btn.textContent = '静音';
      // 浏览器不允许带声音播放时，退回静音继续播，按钮复原
      v.play().catch(() => {
        v.muted = true;
        btn.textContent = '开声音';
        v.play().catch(() => {});
      });
    });
  });

  // ---------- 拖动对比 ----------
  function setX(el, pct) {
    el.style.setProperty('--x', Math.min(100, Math.max(0, pct)).toFixed(2) + '%');
  }
  // 第一次出现时把分割线从右扫到中间，提示可以拖
  function sweep(el) {
    if (reduce || el._touched) return;
    const t0 = performance.now(), dur = 1300;
    const step = (t) => {
      if (el._touched) return;
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setX(el, 88 - 38 * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  document.querySelectorAll('.compare').forEach((el) => {
    let dragging = false;
    const move = (ev) => {
      const r = el.getBoundingClientRect();
      setX(el, ((ev.clientX - r.left) / r.width) * 100);
    };
    el.addEventListener('pointerdown', (ev) => {
      dragging = true; el._touched = true;
      el.setPointerCapture(ev.pointerId);
      move(ev);
    });
    el.addEventListener('pointermove', (ev) => { if (dragging) move(ev); });
    const stop = () => { dragging = false; };
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
  });
  // 转台对比下面的切换按钮：换掉底层图片（线框／白模）
  document.querySelectorAll('.tabs').forEach((tabs) => {
    const cmp = tabs.previousElementSibling;
    const bot = cmp.querySelector('.bot');
    const lab = cmp.querySelector('.lab.r');
    tabs.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      bot.removeAttribute('srcset');
      bot.src = b.dataset.src;
      lab.textContent = b.dataset.label;
    }));
  });

  // ---------- 迭代步骤的说明与进度点 ----------
  const stepScenes = [...document.querySelectorAll('.steps')];
  stepScenes.forEach((s) => {
    s._frames = [...s.querySelectorAll('.frame')];
    s._caps = [...s.querySelectorAll('.captions li')];
    s._dots = [...s.querySelectorAll('.dots i')];
  });
  function setCaption(s, on) {
    if (on === s._on) return;
    s._on = on;
    s._caps.forEach((c, i) => c.classList.toggle('on', i === on));
    s._dots.forEach((d, i) => d.classList.toggle('on', i <= on));
  }

  // ---------- 顶部进度条（手机和电脑共用的轻量版本） ----------
  let ticking = false;
  const setProgress = () => {
    ticking = false;
    const max = Math.max(1, root.scrollHeight - window.innerHeight);
    root.style.setProperty('--gp', Math.min(1, window.scrollY / max).toFixed(4));
  };

  if (mobile || reduce) {
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(setProgress); } }, { passive: true });
    setProgress();
    // 横滑的迭代图：滑到第几张，下面说明就切到第几步
    stepScenes.forEach((s) => {
      const box = s.querySelector('.frames');
      setCaption(s, 0);
      box.addEventListener('scroll', () => {
        const w = s._frames[0].getBoundingClientRect().width + 12;
        setCaption(s, Math.min(s._frames.length - 1, Math.round(box.scrollLeft / w)));
      }, { passive: true });
    });
    document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (ev) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      ev.preventDefault();
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    }));
    return;
  }

  // ================= 以下只在电脑上运行 =================

  // 平滑滚动（滚轮）
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    root.classList.add('lenis');
  }
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener('click', (ev) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    ev.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView({ behavior: 'smooth' });
  }));

  // 场景测量
  const scenes = [...document.querySelectorAll('.scene')];
  const galleries = scenes.filter((s) => s.classList.contains('hgallery'));

  let vh = window.innerHeight;
  let vw = window.innerWidth;
  let docMax = 1;

  function layout() {
    vh = window.innerHeight;
    // 横向画廊：竖向要滚的距离 = 轨道多出来的宽度
    galleries.forEach((g) => {
      const track = g.querySelector('.track');
      const dist = Math.max(0, track.scrollWidth - g.clientWidth);
      g.style.setProperty('--dist', dist);
      g.style.height = (dist + vh) + 'px';
    });
    // 迭代步骤：每一步大约占 0.8 屏
    stepScenes.forEach((s) => { s.style.height = (s._frames.length * vh * 0.8 + vh) + 'px'; });
    const y = window.scrollY;
    scenes.forEach((s) => {
      s._top = s.getBoundingClientRect().top + y;
      s._h = s.offsetHeight;
      s._p = -1;
    });
    docMax = Math.max(1, root.scrollHeight - vh);
    if (lenis) lenis.resize();
  }

  function setSteps(s, p) {
    const n = s._frames.length;
    const idx = p * (n - 1);
    s._frames.forEach((f, i) => {
      const t = Math.abs(idx - i);
      // 每一步在中间停一会儿，再淡到下一步
      const o = Math.min(1, Math.max(0, 1 - (t - 0.22) / 0.56));
      f.style.opacity = o.toFixed(3);
      f.style.transform = 'scale(' + (1.05 - 0.05 * o).toFixed(4) + ')';
    });
    setCaption(s, Math.round(idx));
  }

  let lastY = -1;
  function frame(t) {
    if (lenis) lenis.raf(t);
    const y = lenis ? lenis.animatedScroll : window.scrollY;
    if (y !== lastY) {
      lastY = y;
      for (const s of scenes) {
        const range = s._h - vh;
        if (range <= 0) continue;
        // 离得很远的场景不更新
        if (y < s._top - vh * 1.5 || y > s._top + s._h + vh * 0.5) continue;
        const p = Math.min(1, Math.max(0, (y - s._top) / range));
        if (Math.abs(p - s._p) < 0.0005) continue;
        s._p = p;
        s.style.setProperty('--p', p.toFixed(4));
        if (s._frames) setSteps(s, p);
      }
      root.style.setProperty('--gp', Math.min(1, y / docMax).toFixed(4));
    }
    requestAnimationFrame(frame);
  }

  layout();
  stepScenes.forEach((s) => setSteps(s, 0));
  requestAnimationFrame(frame);

  // 图片加载、字体、窗口宽度变化都会改变高度，统一重新测量
  let timer = 0;
  const relayout = () => { clearTimeout(timer); timer = setTimeout(() => { lastY = -1; layout(); }, 120); };
  window.addEventListener('load', relayout);
  window.addEventListener('resize', () => {
    if (window.innerWidth === vw && Math.abs(window.innerHeight - vh) < 160) return;
    vw = window.innerWidth;
    relayout();
  });
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(document.body);
})();
