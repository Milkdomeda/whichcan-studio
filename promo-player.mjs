import {currentLanguage} from './language.mjs';
const section = document.querySelector('.promo-section');
const video = section.querySelector('video');
const error = section.querySelector('[data-promo-error]');
function render() {
  const en = currentLanguage() === 'en';
  section.querySelector('[data-promo-title]').textContent = en ? 'See WhichCAN Studio in action' : '看看 WhichCAN Studio 如何工作';
  section.querySelector('[data-promo-description]').textContent = en ? 'English promo video · English captions' : '英文宣传视频 · 英文字幕';
  error.textContent = en ? 'The video could not load. Please refresh the page and try again.' : '视频暂时无法加载，请刷新页面重试。';
}
section.dataset.dynamicLanguage = '';
video.addEventListener('error', () => { error.hidden = false; });
video.querySelector('source').addEventListener('error', () => { error.hidden = false; });
window.addEventListener('whichcan-language-change', render);
render();
