import { english, caseEnglish } from './translations.mjs';
const key = 'whichcan-introduction-language';
let language = 'zh';
const entryLanguage = new URLSearchParams(location.search).get('lang');
if (entryLanguage === 'en' || entryLanguage === 'zh') language = entryLanguage;
else { try { if (localStorage.getItem(key) === 'en') language = 'en'; } catch {} }
export const currentLanguage = () => language;
export const translate = text => language === 'en' ? (english[text] ?? text) : text;
const originals = new WeakMap();
function render() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement.closest('script,style,[data-language-switch],[data-dynamic-language]')) continue;
    if (!originals.has(node)) originals.set(node, node.nodeValue);
    const source = originals.get(node);
    node.nodeValue = source.replace(source.trim(), translate(source.trim()));
  }
  document.querySelectorAll('[aria-roledescription],[aria-label],[alt],meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(node => {
    for (const attribute of ['aria-roledescription', 'aria-label', 'alt', 'content']) {
      if (!node.hasAttribute(attribute) || node.closest('[data-language-switch],[data-dynamic-language]')) continue;
      let source = originals.get(node);
      if (!source) { source = {}; originals.set(node, source); }
      source[attribute] ??= node.getAttribute(attribute);
      node.setAttribute(attribute, attribute === 'alt' && node.dataset.caseId && language === 'en' ? (caseEnglish[node.dataset.caseId] ?? translate(source[attribute])) : translate(source[attribute]));
    }
  });
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'en' ? 'en_US' : 'zh_CN');
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
}
export function setLanguage(value) {
  language = value === 'en' ? 'en' : 'zh';
  try { localStorage.setItem(key, language); } catch {}
  const localized = new URL(location.href); localized.searchParams.set('lang', language);
  history.replaceState(history.state, '', localized);
  render();
  window.dispatchEvent(new Event('whichcan-language-change'));
}
const header = document.querySelector('.site-header');
const switcher = document.createElement('div');
switcher.className = 'language-switch';
switcher.dataset.languageSwitch = '';
switcher.setAttribute('role', 'group');
switcher.setAttribute('aria-label', 'Language / 语言');
switcher.innerHTML = '<button type="button" data-language="zh" lang="zh-CN" aria-label="中文">CN</button><button type="button" data-language="en" lang="en" aria-label="English">EN</button>';
header.append(switcher);
switcher.addEventListener('click', event => { if (event.target.dataset.language) setLanguage(event.target.dataset.language); });
render();


// Manual carousel: categories are discovered from markup, so the catalog can grow.
for (const carousel of document.querySelectorAll('.family-carousel')) {
  const track = carousel.querySelector('.family-grid');
  const cards = [...track.children];
  const previous = carousel.querySelector('[data-family-prev]');
  const next = carousel.querySelector('[data-family-next]');
  const position = carousel.querySelector('.family-position');
  let index = 0;
  function show(value) {
    index = (value + cards.length) % cards.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    cards.forEach((card, i) => {
      card.inert = i !== index;
      card.setAttribute('aria-hidden', String(i !== index));
      card.setAttribute('role', 'group');
      card.setAttribute('aria-roledescription', language === 'en' ? 'slide' : '幻灯片');
      card.setAttribute('aria-label', `${i + 1} / ${cards.length}`);
    });
    position.textContent = language === 'en' ? `Category ${index + 1} of ${cards.length}` : `第 ${index + 1} 类，共 ${cards.length} 类`;
    previous.disabled = next.disabled = cards.length < 2;
  }
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  carousel.addEventListener('keydown', event => {
    const target = {ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: cards.length - 1}[event.key];
    if (target === undefined) return;
    event.preventDefault();
    show(target);
  });
  window.addEventListener('whichcan-language-change', () => show(index));
  show(0);
}
