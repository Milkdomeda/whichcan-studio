import { english } from './translations.mjs';
const key = 'whichcan-introduction-language';
let language = 'zh';
try { if (localStorage.getItem(key) === 'en') language = 'en'; } catch {}
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
  document.querySelectorAll('[aria-label],[alt],meta[name="description"],meta[property="og:title"],meta[property="og:description"]').forEach(node => {
    for (const attribute of ['aria-label', 'alt', 'content']) {
      if (!node.hasAttribute(attribute) || node.closest('[data-language-switch],[data-dynamic-language]')) continue;
      let source = originals.get(node);
      if (!source) { source = {}; originals.set(node, source); }
      source[attribute] ??= node.getAttribute(attribute);
      node.setAttribute(attribute, translate(source[attribute]));
    }
  });
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', language === 'en' ? 'en_US' : 'zh_CN');
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
}
export function setLanguage(value) {
  language = value === 'en' ? 'en' : 'zh';
  try { localStorage.setItem(key, language); } catch {}
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
