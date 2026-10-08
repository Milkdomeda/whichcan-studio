// One public content contract for both home pages; no private source controls.
export const feedUrl='https://milkdomeda.github.io/whichcan-studio/showcase/cases.json';
export const cacheKey='whichcan-public-case-feed-v1';
export function validateCaseFeed(value){
 if(!Array.isArray(value))throw Error('INVALID_FEED');
 const ids=new Set(),paths=new Set();
 for(const c of value){if(!c||Object.keys(c).sort().join()!=='case_id,image,title'||typeof c.case_id!=='string'||!/^[a-z0-9-]+$/.test(c.case_id)||typeof c.title!=='string'||!c.title.trim()||c.title.length>120||typeof c.image!=='string'||!/^images\/[a-z0-9-]+\.png$/.test(c.image)||ids.has(c.case_id)||paths.has(c.image))throw Error('INVALID_FEED');ids.add(c.case_id);paths.add(c.image);}
 return value;
}
export function completeSnapshot(next,previous){
 const byId=new Map(next.map(c=>[c.case_id,c]));
 return next.length>0&&previous.every(c=>{const found=byId.get(c.case_id);return found?.image===c.image&&found.title===c.title;});
}
export function caseAlt(item,language,english){
 const known=english[item.case_id];
 return known?(language==='en'?known:item.title):(language==='en'?'A WhichCAN Studio design example':'WhichCAN Studio 设计案例');
}
export function decodePublicImage(url,signal){return new Promise((resolve,reject)=>{
 const img=new Image();const stop=()=>{img.src='';reject(Error('IMAGE_FAILED'));};
 if(signal?.aborted)return stop();signal?.addEventListener('abort',stop,{once:true});
 img.onload=()=>{signal?.removeEventListener('abort',stop);img.decode().then(resolve,reject);};img.onerror=()=>{signal?.removeEventListener('abort',stop);reject(Error('IMAGE_FAILED'));};img.referrerPolicy='no-referrer';img.src=url;
});}
export async function loadCaseFeed({url,signal,fetcher=fetch,previous,decodeImage=decodePublicImage}){
 const controller=new AbortController();const stop=()=>controller.abort();signal?.addEventListener('abort',stop,{once:true});if(signal?.aborted)stop();
 const timer=setTimeout(stop,5000);let abortReject;
 const aborted=new Promise((_,reject)=>{abortReject=()=>reject(Error('FEED_TIMEOUT'));controller.signal.addEventListener('abort',abortReject,{once:true});if(controller.signal.aborted)abortReject();});
 try{return await Promise.race([aborted,(async()=>{
  const target=new URL(url);target.searchParams.set('minute',String(Math.floor(Date.now()/60000)));
  const response=await fetcher(target.href,{signal:controller.signal,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('FEED_FAILED');
  const next=validateCaseFeed(await response.json());if(!completeSnapshot(next,previous))throw Error('INCOMPLETE_FEED');
  const old=new Set(previous.map(c=>c.image));await Promise.all(next.filter(c=>!old.has(c.image)).map(c=>decodeImage(new URL(c.image,url).href,controller.signal)));
  if(controller.signal.aborted)throw Error('FEED_TIMEOUT');return next;
 })()]);}catch{return previous;}finally{clearTimeout(timer);signal?.removeEventListener('abort',stop);controller.signal.removeEventListener('abort',abortReject);}
}
export function startCaseFeed({wall,url,language,english={},onApplied=()=>{}}){
 let current=[...wall.querySelectorAll('img')].map(img=>({case_id:img.dataset.caseId,title:img.dataset.caseTitle??img.alt,image:img.getAttribute('src').replace(/^\.\/showcase\//,'')}));
 validateCaseFeed(current);let generation=0,disposed=false,controller;
 const render=()=>{const fragment=document.createDocumentFragment();for(const [i,c]of current.entries()){const figure=document.createElement('figure'),img=document.createElement('img');img.dataset.caseId=c.case_id;img.src=new URL(c.image,url).href;img.alt=caseAlt(c,language(),english);img.width=900;img.height=700;img.loading=i<2?'eager':'lazy';figure.append(img);fragment.append(figure);}wall.replaceChildren(fragment);onApplied(current);};
 const refresh=async()=>{const ticket=++generation;controller?.abort();controller=new AbortController();const next=await loadCaseFeed({url,previous:current,signal:controller.signal});if(disposed||ticket!==generation||next===current)return;current=next;render();};
 const relabel=()=>{wall.setAttribute('aria-label',language()==='en'?'Film of real model examples':'真实模型案例胶片');wall.querySelectorAll('img').forEach((img,i)=>{img.alt=caseAlt(current[i],language(),english);});};
 wall.dataset.dynamicLanguage='';relabel();window.addEventListener('whichcan-language-change',relabel);refresh();const timer=setInterval(refresh,60000);
 return ()=>{disposed=true;++generation;controller?.abort();clearInterval(timer);window.removeEventListener('whichcan-language-change',relabel);};
}
