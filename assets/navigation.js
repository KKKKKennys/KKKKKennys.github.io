/* Interaction patterns adapted from Rare UI. Copyright (c) 2026 Swami Malode.
   Vanilla implementation for Kenny's portfolio; see rare-ui-LICENSE.txt. */
(() => {
  const root = document.documentElement;
  const toggle = document.getElementById('project-toggle');
  const menu = document.getElementById('project-menu');
  const rail = document.querySelector('.project-rail');
  const railList = rail.querySelector('.rail-list');
  const railLinks = [...railList.querySelectorAll('a[data-project-jump]')];
  const allLinks = [...document.querySelectorAll('a[data-project-jump]')];
  const label = toggle.querySelector('.project-label');
  const count = toggle.querySelector('.project-count');
  const current = toggle.querySelector('.project-current');
  const compact = matchMedia('(max-width: 1099px)');
  const sections = railLinks.map(a => ({
    id: a.hash.slice(1), label: a.dataset.label, node: document.getElementById(a.hash.slice(1))
  }));
  const about = document.getElementById('about');
  const resources = document.getElementById('resources');
  const contact = document.getElementById('contact');
  const folder = document.querySelector('.resource-folder');
  const folderToggle = document.getElementById('folder-toggle');
  const files = document.getElementById('resource-files');
  let openAt = 0;
  let active = '';
  let bounds = [];
  let aboutTop = 0;
  let resourceTop = 0;
  let contactTop = 0;
  let queued = false;
  let measureQueued = false;
  let directionY = scrollY;

  function setMenu(open, restoreFocus = false) {
    if (open && !compact.matches) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? '收起项目导航' : '打开项目导航');
    menu.hidden = !open;
    if (open) openAt = scrollY;
    if (!open && restoreFocus) toggle.focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  document.addEventListener('pointerdown', e => {
    if (!menu.hidden && !e.target.closest('.project-progress')) setMenu(false);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) setMenu(false, true);
  });
  document.addEventListener('focusin', e => {
    if (!menu.hidden && !e.target.closest('.project-progress')) setMenu(false);
  });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  compact.addEventListener('change', () => setMenu(false));
  document.addEventListener('visibilitychange', () => { if (document.hidden) setMenu(false); });

  function setFolder(open) {
    folder.classList.toggle('is-open', open);
    folderToggle.setAttribute('aria-expanded', String(open));
    folderToggle.querySelector('.folder-action > span').textContent = open ? '收起资料夹' : '打开资料夹';
    files.inert = !open;
    files.setAttribute('aria-hidden', String(!open));
  }
  folderToggle.addEventListener('click', () => setFolder(!folder.classList.contains('is-open')));
  document.querySelectorAll('a[href="#resources"]').forEach(a => a.addEventListener('click', () => setFolder(true)));
  setFolder(false);
  root.classList.add('navigation-ready');

  function update() {
    queued = false;
    const y = scrollY;
    if (!menu.hidden && Math.abs(y - openAt) > 24) setMenu(false);
    if (Math.abs(y - directionY) > 24) {
      rail.style.setProperty('--rail-direction', y > directionY ? '180deg' : '0deg');
      directionY = y;
    }
    const reading = y + Math.min(innerHeight * .32, 240);
    let index = -1;
    for (let i = 0; i < bounds.length; i++) if (reading >= bounds[i]) index = i;
    const atAbout = reading >= aboutTop;
    const atResources = reading >= resourceTop;
    const atContact = reading >= contactTop;
    const next = atContact ? 'contact' : atResources ? 'resources' : atAbout ? 'about' : index < 0 ? 'overview' : sections[index].id;
    if (next === active) return;
    active = next;
    const selected = atAbout || index < 0 ? -1 : index;
    allLinks.forEach(a => {
      const on = a.hash === '#' + next;
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
    railLinks.forEach((a, i) => a.classList.toggle('is-past', i < index || atAbout));
    const n = selected < 0 ? '' : String(selected + 1).padStart(2, '0');
    count.textContent = atContact ? 'LET’S TALK' : atResources ? '02 FILES' : atAbout ? 'ABOUT KENNY' : n ? n + ' / 05' : '5 个项目';
    label.textContent = atContact ? '联系我' : atResources ? '作品资料' : atAbout ? '关于我' : selected < 0 ? '作品导览' : sections[selected].label;
    current.classList.remove('is-changing');
    requestAnimationFrame(() => current.classList.add('is-changing'));
    rail.classList.toggle('has-project', selected >= 0);
    const dot = railLinks[Math.max(0, selected)];
    if (selected >= 0 && dot) {
      const center = dot.offsetTop + dot.offsetHeight / 2;
      rail.style.setProperty('--rail-y', (center - 8.5) + 'px');
      rail.style.setProperty('--rail-fill', Math.max(0, center - 26) + 'px');
    } else rail.style.setProperty('--rail-fill', atAbout ? '100%' : '0px');
    document.querySelectorAll('.rail-resources').forEach(a => {
      if (atResources && !atContact) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    });
  }
  function scheduleUpdate() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  function measure() {
    measureQueued = false;
    bounds = sections.map(s => s.node.getBoundingClientRect().top + scrollY);
    aboutTop = about.getBoundingClientRect().top + scrollY;
    resourceTop = resources.getBoundingClientRect().top + scrollY;
    contactTop = contact.getBoundingClientRect().top + scrollY;
    active = '';
    update();
  }
  function scheduleMeasure() { if (!measureQueued) { measureQueued = true; requestAnimationFrame(measure); } }
  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleMeasure, { passive: true });
  window.addEventListener('load', scheduleMeasure);
  if (document.fonts) document.fonts.ready.then(scheduleMeasure);
  if (window.ResizeObserver) new ResizeObserver(scheduleMeasure).observe(document.body);
  if (location.hash === '#resources') setFolder(true);
  measure();
})();
