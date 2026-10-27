/* Animation enhances the original evidence; original values stay in accessible text. */
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = motionPreference.matches;
if (!reduceMotion) document.documentElement.classList.add('motion');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const easeOut=t=>1-Math.pow(1-t,3);
const nav=document.querySelector('#nav'), progress=document.querySelector('.progress');
const heroImage=document.querySelector('.hero-image'), links=document.querySelector('#navlinks');
const menu=document.querySelector('.menu');
const closeMenu=()=>{links.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.querySelector('span').textContent='+';};
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);links.classList.toggle('open',open);menu.querySelector('span').textContent=open?'−':'+';});
links.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});

const counterStates=new Map();
document.querySelectorAll('[data-count]').forEach(el=>{
  const value=Number(el.dataset.count), decimals=Number(el.dataset.decimals||0), suffix=el.dataset.suffix||'';
  const final=value.toFixed(decimals)+suffix;
  let visual=el;
  if(el.namespaceURI!=='http://www.w3.org/2000/svg'){
    visual=document.createElement('span');visual.className='count-value';visual.setAttribute('aria-hidden','true');
    const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=final;
    el.replaceChildren(visual,accessible);
  }
  visual.textContent=reduceMotion?final:(0).toFixed(decimals)+suffix;
  counterStates.set(el,{value,decimals,suffix,final,visual,started:reduceMotion});
});
function countUp(el,delay=0,duration=1650){
  const state=counterStates.get(el);if(!state||state.started)return;
  state.started=true;
  setTimeout(()=>{
    if(reduceMotion){state.visual.textContent=state.final;return;}
    el.classList.add('count-running');
    const start=performance.now();
    function tick(now){
      const t=clamp((now-start)/duration);
      state.visual.textContent=(state.value*easeOut(t)).toFixed(state.decimals)+state.suffix;
      if(t<1&&!reduceMotion)requestAnimationFrame(tick);
      else{state.visual.textContent=state.final;el.classList.remove('count-running');el.classList.add('count-finished');}
    }
    requestAnimationFrame(tick);
  },delay);
}
const numberObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){countUp(e.target);numberObserver.unobserve(e.target);}});},{threshold:.5,rootMargin:'0px 0px -25px 0px'});
counterStates.forEach((_,el)=>{if(!el.hasAttribute('data-chart-number')&&!el.closest('.cost-bars,.donut-center'))numberObserver.observe(el);});
const revealObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target);}});},{threshold:.13});
document.querySelectorAll('.reveal,.circular-life,.province-figure').forEach(el=>revealObserver.observe(el));
function onEntry(el,callback,threshold=.22){if(!el)return;const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){callback(el);observer.disconnect();}},{threshold});observer.observe(el);}
onEntry(document.querySelector('.share-chart'),el=>el.classList.add('constructed'),.12);
onEntry(document.querySelector('.share-donut'),el=>{el.classList.add('constructed');el.querySelectorAll('[data-count]').forEach(n=>countUp(n));},.45);
onEntry(document.querySelector('.waste-chart'),el=>{
  el.classList.add('visible','constructed');
  const points=el.querySelectorAll('.chart-points circle');
  el.querySelectorAll('[data-chart-number]').forEach((label,i)=>{
    const delay=reduceMotion?0:i*1050;
    setTimeout(()=>{points[i].classList.add('point-on');label.classList.add('point-on');countUp(label,0,1300);},delay);
  });
},.22);
document.querySelectorAll('.chart-points circle').forEach((point,i)=>{
 const title=document.createElementNS('http://www.w3.org/2000/svg','title');
 title.textContent=['2030 · 3.47 Mt','2040 · 9.99 Mt','2050 · 26.0 Mt'][i]+' · Modelled projection · Wang et al. 2025, Figure 2';
 point.append(title);point.setAttribute('tabindex','0');point.setAttribute('role','img');point.setAttribute('aria-label',title.textContent);
});
document.querySelectorAll('.cost-bars i').forEach((bar,i)=>{bar.style.setProperty('--fraction',String([.8012,.8774,1][i]));bar.style.setProperty('--delay',`${i*.18}s`);});
onEntry(document.querySelector('.cost-bars'),el=>{el.closest('.research-note').classList.add('constructed');el.querySelectorAll('[data-count]').forEach((n,i)=>countUp(n,reduceMotion?0:i*180));},.35);

// Existing lifecycle controls retain their original explanations.
const lifeTexts={repair:'Repair can extend useful service when condition and safety allow. Retirement is not automatically the best next step.',reuse:'A functioning panel may enter a second use after suitable assessment. Reuse delays the material flow; it does not remove the need for a future return pathway.',repower:'Replacing an operating system can retire panels before physical failure. Technical condition and economic decisions can lead to different dates.',recycle:'When further use is unsuitable, collection and a traceable handover are needed before formal recycling can recover materials.'};
const lifeControls=[...document.querySelectorAll('[data-life]')];
let lifeManualY=null,lifeCurrent=-1;
function activateLife(index){lifeCurrent=index;lifeControls.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));document.querySelector('#life-detail').textContent=lifeTexts[lifeControls[index].dataset.life];}
lifeControls.forEach((button,i)=>button.addEventListener('click',()=>{lifeManualY=scrollY;activateLife(i);}));

const lifecycle=document.querySelector('.lifecycle'),lifeStages=[...document.querySelectorAll('.life-start>span')],lifeBranch=document.querySelector('.life-branch');

// Build the equation and flow diagrams in deliberate, readable sequences.
const equation=document.querySelector('.equation');
[...equation.childNodes].forEach(node=>{if(node.nodeType===Node.TEXT_NODE&&node.textContent.trim()){const span=document.createElement('span');span.className='equation-term';span.textContent=node.textContent.trim();node.replaceWith(span);}});
[...equation.children].forEach((el,i)=>el.style.setProperty('--stagger',`${i*.30}s`));
onEntry(equation,el=>el.classList.add('constructed'),.7);
const balance=document.querySelector('.balance');
const balanceColumns=balance.querySelectorAll(':scope>div');
balanceColumns[0].querySelectorAll('.eyebrow,h3,li').forEach((el,i)=>el.style.setProperty('--stagger',`${i*.16}s`));
balance.querySelector('.minus').style.setProperty('--stagger','1.15s');
balanceColumns[1].querySelectorAll('.eyebrow,h3,li').forEach((el,i)=>el.style.setProperty('--stagger',`${1.35+i*.19}s`));
onEntry(balance,el=>el.classList.add('constructed'),.3);
document.querySelectorAll('.chain,.tracking-chain,.simple-route,.record-extension').forEach(el=>{
  const children=el.classList.contains('record-extension')?el.querySelectorAll('li'):el.children;
  [...children].forEach((child,i)=>child.style.setProperty('--stagger',`${i*.18}s`));
  onEntry(el,node=>node.classList.add('constructed'),.25);
});
const network=document.querySelector('.network-figure');
network.querySelectorAll('.network-lines path').forEach((path,i)=>{path.style.setProperty('--path-length',path.getTotalLength());path.style.setProperty('--stagger',`${i*.07}s`);});
network.querySelectorAll('.network-roofs circle,.network-hubs>*').forEach((el,i)=>el.style.setProperty('--stagger',`${i*.1}s`));
onEntry(network,el=>el.classList.add('constructed'),.35);
onEntry(document.querySelector('.geography'),el=>el.classList.add('constructed'),.15);

// The dramatic question and answer are separate scroll beats.
const thesis=document.querySelector('.reveal-section'), thesisQuestion=thesis.querySelector('h2'),thesisAnswer=thesis.querySelector('.thesis-stage>p:not(.eyebrow)');
const policyTimeline=document.querySelector('.policy-timeline');
const policyArticles=[...policyTimeline.querySelectorAll('article')];
const materials=document.querySelector('.materials'),diagram=document.querySelector('.module-diagram'),layerButton=document.querySelector('#layers-toggle');
const materialLayers=[...diagram.querySelectorAll('.module-layer')], layerLabels=[...diagram.querySelectorAll('.module-labels text')];
let manualLayers=null, currentLayerValue=0, assemblyTimer,materialSelectionY=null,lastMaterialAuto=-1;
const materialButtons=[...document.querySelectorAll('[data-material]')];
const materialDescriptions={
 glass:'Glass · Front glass layer of the module.',
 aluminium:'Aluminium · The frame around the module.',
 silicon:'Silicon · The cells inside the module.',
 copper:'Copper · Interconnections between the cells, shown schematically.',
 silver:'Silver · The silver-containing contact region on the cells; not a separate layer.',
 polymers:'Polymers · Encapsulant and backsheet layers.'
};
const materialRoles={
 glass:'Lets light reach the cells while protecting the front of the module.',
 aluminium:'Supports the module edges and provides a frame for handling and mounting.',
 silicon:'The semiconductor in the cells converts incoming light into electrical energy.',
 copper:'Connects the cells electrically and carries current through the module.',
 silver:'Conductive cell contacts collect current and pass it into the interconnections.',
 polymers:'Encapsulant holds and protects the cells; the backsheet provides rear protection and insulation.'
};
const materialGroups={glass:['glass'],aluminium:['frame'],silicon:['silicon'],copper:['silicon'],silver:['silicon'],polymers:['polymer','backsheet']};
function selectMaterial(material){
 diagram.dataset.selectedMaterial=material||'all';
 document.querySelectorAll('[data-recovery]').forEach(el=>{el.hidden=el.dataset.recovery!==material;});
 materialButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.material===material)));
 materialLayers.forEach(layer=>layer.classList.toggle('material-focused',!!material&&materialGroups[material].some(group=>layer.classList.contains(group))));
 document.querySelector('#material-description').textContent=material?materialDescriptions[material]:'All materials · A complete crystalline-silicon module.';
 document.querySelector('#material-role').textContent=material?materialRoles[material]:'Scroll to see what each material does, or select a material.';
 diagram.querySelector('svg').setAttribute('aria-label','Schematic crystalline-silicon module: glass, aluminium frame, silicon cells, copper interconnections, silver-containing cell contacts and polymers.'+(material?' Selected material: '+material+'.':''));
}
materialButtons.forEach(button=>button.addEventListener('click',()=>{if(manualLayers===null)manualLayers=1;materialSelectionY=scrollY;lastMaterialAuto=-1;selectMaterial(button.dataset.material);applyLayers(manualLayers);}));
selectMaterial(null);
function updateAssemblyControl(value,busy=false){
 const separated=value>.5;
 const label=busy?(separated?'Separating Layers':'Assembling Module'):(separated?'Bring Together':manualLayers===0?'Separate Again':'Separate Layers');
 const labelNode=layerButton.querySelector('.assembly-label');if(labelNode.textContent!==label)labelNode.textContent=label;
 layerButton.setAttribute('aria-label',busy?label:separated?'Bring together: assemble the module layers':'Separate the module layers');
 layerButton.setAttribute('aria-busy',String(busy));
 document.querySelector('#assembly-status').textContent=busy?'LAYER ALIGNMENT IN PROGRESS':separated?'SEPARATED VIEW':'COMPLETE MODULE';
}
function applyLayers(value){
 currentLayerValue=value;
 const displacements=[130,65,-12,-90,-140];
 materialLayers.forEach((layer,i)=>layer.style.transform=`translateY(${displacements[i]*value}px)`);
 layerLabels.forEach((label,i)=>label.classList.toggle('label-on',value>=[.24,.12,.36,.48,.60,.72,.84][i]));
 diagram.querySelectorAll('.module-labels path').forEach(path=>path.classList.toggle('label-on',value>.2));
 if(!diagram.classList.contains('is-assembling'))updateAssemblyControl(value);
 materials.classList.toggle('recovery-on',value>.9);
}
layerButton.addEventListener('click',()=>{
 clearTimeout(assemblyTimer);materialSelectionY=scrollY;
 manualLayers=diagram.classList.contains('is-assembling')?1-manualLayers:currentLayerValue>.5?0:1;
 selectMaterial(null);
 const delays=[330,240,110,0,430];
 materialLayers.forEach((layer,i)=>layer.style.setProperty('--merge-delay',`${reduceMotion?0:manualLayers===0?delays[i]:430-delays[i]}ms`));
 diagram.classList.add('manual-transition','is-assembling');diagram.classList.remove('assembly-complete');
 applyLayers(manualLayers);updateAssemblyControl(manualLayers,!reduceMotion);
 assemblyTimer=setTimeout(()=>{
  diagram.classList.remove('is-assembling');updateAssemblyControl(manualLayers);
  if(manualLayers===0&&!reduceMotion)diagram.classList.add('assembly-complete');
 },reduceMotion?0:1550);
});

// Native dialog supplies modal focus containment; the original source asset is unchanged.
const figurePreview=document.querySelector('#figure-preview'),figureModal=document.querySelector('#figure-lightbox');
let modalCloseTimer,previousBodyOverflow='';
function closeFigure(){
 if(!figureModal.open)return;
 figureModal.classList.remove('is-visible');clearTimeout(modalCloseTimer);
 modalCloseTimer=setTimeout(()=>{figureModal.close();},reduceMotion?0:320);
}
figurePreview.addEventListener('click',event=>{
 if(typeof figureModal.showModal!=='function')return;
 event.preventDefault();if(figureModal.open)return;clearTimeout(modalCloseTimer);
 previousBodyOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 figureModal.showModal();
 requestAnimationFrame(()=>requestAnimationFrame(()=>figureModal.classList.add('is-visible')));
});
figureModal.querySelector('.lightbox-close').addEventListener('click',closeFigure);
figureModal.addEventListener('click',event=>{if(event.target===figureModal)closeFigure();});
figureModal.addEventListener('cancel',event=>{event.preventDefault();closeFigure();});
figureModal.addEventListener('keydown',event=>{
 if(event.key!=='Tab')return;
 const focusable=[...figureModal.querySelectorAll('button:not([disabled]),a[href]')];
 const first=focusable[0],last=focusable[focusable.length-1];
 if(event.shiftKey&&(document.activeElement===first||!figureModal.contains(document.activeElement))){event.preventDefault();last.focus();}
 else if(!event.shiftKey&&(document.activeElement===last||!figureModal.contains(document.activeElement))){event.preventDefault();first.focus();}
});
figureModal.addEventListener('close',()=>{document.body.style.overflow=previousBodyOverflow;figureModal.classList.remove('is-visible');figurePreview.focus({preventScroll:true});});

// One focus language for ordered frameworks, without animating evidence paragraphs.
function focusSequence(items,index){
 items.forEach((item,i)=>{item.classList.toggle('focus-active',i===index);item.classList.toggle('focus-completed',i<index);});
}
const europeFocus=document.querySelector('.europe-focus'),europeSteps=[...document.querySelectorAll('[data-europe-stage]')],europeNotes=[...document.querySelectorAll('[data-europe-note]')];
europeFocus.classList.add('focus-ready');
const recommendationCards=[...document.querySelectorAll('.recommendation')],recommendationIndex=[...document.querySelectorAll('.recommendation-focus-nav li')];
function updateFocusSequences(){
 const er=europeFocus.getBoundingClientRect();
 if(er.top<innerHeight&&er.bottom>0){
  const ep=reduceMotion?0:clamp((innerHeight*.23-er.top)/(er.height-innerHeight*.66));
  const stage=Math.min(3,Math.floor(ep*4));
  focusSequence(europeSteps,stage);focusSequence(europeNotes,stage);
  europeFocus.dataset.focusStage=stage;
 }

}

// One physical module follows the conceptual route through six governance handovers.
const journey=document.querySelector('#journey'),journeySteps=[...document.querySelectorAll('[data-stage]')];
const journeyPanel=document.querySelector('#travel-panel'), routePath=document.querySelector('.route-dashed');
const journeyNodes=[...document.querySelectorAll('.route-nodes circle')];
const journeyStages=[
 {x:340,y:410,actor:'ROOFTOP OWNER',governance:'Responsibility',caption:'A physical asset. A decision still to make.'},
 {x:290,y:340,actor:'COLLECTION',governance:'Convenience',caption:'An accessible channel makes the first handover possible.'},
 {x:255,y:270,actor:'STORAGE',governance:'Aggregation',caption:'Scattered modules join a manageable collection flow.'},
 {x:212,y:215,actor:'TRANSPORT',governance:'Cost',caption:'Distance, loading and storage all have a cost.'},
 {x:165,y:125,actor:'FORMAL RECYCLER',governance:'Qualification',caption:'A verified downstream operator can begin formal treatment.'},
 {x:125,y:75,actor:'THE WHOLE SYSTEM',governance:'Traceability',caption:'Secondary materials carry the story toward new manufacturing.'}
];
const routeLength=routePath.getTotalLength();
journeyStages.forEach(stage=>{let best=Infinity;for(let i=0;i<=400;i++){const d=routeLength*i/400,p=routePath.getPointAtLength(d),distance=(p.x-stage.x)**2+(p.y-stage.y)**2;if(distance<best){best=distance;stage.distance=d;}}});
let lastStage=-1;
function updateJourney(){
 const mobile=innerWidth<=800,target=innerHeight*(mobile?.73:.52);
 let fractional=0;
 for(let i=0;i<journeySteps.length-1;i++){
  const a=journeySteps[i].getBoundingClientRect(),b=journeySteps[i+1].getBoundingClientRect();
  const ca=a.top+a.height/2,cb=b.top+b.height/2;
  if(target>=ca)fractional=i+clamp((target-ca)/(cb-ca));
 }
 const index=clamp(Math.round(fractional),0,5);
 if(index!==lastStage){
  const current=journeyStages[index];lastStage=index;
  journey.dataset.activeStage=index;
  document.querySelector('#journey-number').textContent=`0${index+1} / 06`;
  document.querySelector('#journey-actor').textContent=current.actor;
  document.querySelector('#journey-governance').textContent=current.governance;
  document.querySelector('#journey-caption').textContent=current.caption;
  journeySteps.forEach((el,i)=>el.classList.toggle('current',i===index));
  journeyNodes.forEach((el,i)=>el.classList.toggle('node-active',i===index));
 }
 const lower=Math.floor(fractional),upper=Math.min(lower+1,5),part=fractional-lower;
 const distance=journeyStages[lower].distance+(journeyStages[upper].distance-journeyStages[lower].distance)*part;
 const p=routePath.getPointAtLength(distance);
 // Reduced motion retains a static complete route; all six descriptions remain in document order.
 journeyPanel.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
 document.querySelectorAll('[data-journey-jump]').forEach((button,i)=>{if(i===index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
}

// Stable page numbers map to existing narrative sections, not arbitrary viewport lengths.
const pages=[...document.querySelectorAll('main>section[data-page]')];
let lastPage='';
function updatePage(){
 let current=pages[0];
 for(const page of pages){if(page.getBoundingClientRect().top<=innerHeight*.35)current=page;else break;}
 if(current.dataset.page!==lastPage){
  lastPage=current.dataset.page;
  document.querySelector('#page-current').textContent=lastPage;
  document.querySelector('#page-title').textContent=current.dataset.pageTitle;
  document.querySelector('.page-indicator').setAttribute('aria-label',`Page ${lastPage} of 17: ${current.dataset.pageTitle}`);
 }
 const navIds=['boom','wave','journey','policy','fix','sources'];
 let active='';navIds.forEach(id=>{if(document.getElementById(id).getBoundingClientRect().top<innerHeight*.4)active=id;});
 links.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.hash==='#'+active));
}
let frame=false;
function updateScroll(){
 const h=innerHeight,y=scrollY,max=document.documentElement.scrollHeight-h;
 progress.style.width=`${max?y/max*100:0}%`;nav.classList.toggle('scrolled',y>80);
 if(!reduceMotion&&y<h*1.3)heroImage.style.transform=`scale(${1.15-Math.min(y/h,1)*.15}) translateY(${y*.06}px)`;
 updatePage();
 updateFocusSequences();
 if(!reduceMotion){
  const lr=lifecycle.getBoundingClientRect();const lifeProgress=clamp((h*.8-lr.top)/(h*.62));
  lifeStages.forEach((el,i)=>el.classList.toggle('life-on',lifeProgress>=i*.23));lifeBranch.classList.toggle('life-on',lifeProgress>.7);
  focusSequence(lifeStages,Math.min(2,Math.floor(lifeProgress*3)));lifeBranch.classList.toggle('focus-active',lifeProgress>.7);
  const tr=thesis.getBoundingClientRect(),tp=clamp((h*.15-tr.top)/(tr.height-h*.8));
  const questionFade=clamp((tp-.32)/.20),answer=clamp((tp-.58)/.17);
  thesisQuestion.style.opacity=1-questionFade;thesisQuestion.style.transform=`translateY(${-24*questionFade}px)`;
  thesisAnswer.style.opacity=answer;thesisAnswer.style.transform=`translateY(${18*(1-answer)}px)`;
  const pr=policyTimeline.getBoundingClientRect(),pp=clamp((h*.80-pr.top)/(pr.height+h*.08));
  policyTimeline.style.setProperty('--policy-progress',pp);
  focusSequence(policyArticles,pp<.50?0:1);
  policyArticles.forEach((article,i)=>[...article.children].forEach((el,j)=>el.classList.toggle('timeline-on',pp>=[0,.12,.22,.34,.48,.62,.74,.85][i*4+j])));
 }
 updateContinuousScenes();updateLinkedTransitions();updateResponsibilityIntro();
 const jr=journey.getBoundingClientRect();if(jr.top<h&&jr.bottom>0)updateJourney();
 frame=false;
}
function requestScroll(){if(!frame){frame=true;requestAnimationFrame(updateScroll);}}
addEventListener('scroll',requestScroll,{passive:true});addEventListener('resize',requestScroll,{passive:true});
motionPreference.addEventListener('change',e=>{reduceMotion=e.matches;document.documentElement.classList.toggle('motion',!reduceMotion);if(reduceMotion){counterStates.forEach(state=>{state.visual.textContent=state.final;state.started=true;});applyLayers(1);}requestScroll();});
requestScroll();

// The existing province data are retained. Asset dots and routes remain explicitly conceptual.
const ns='http://www.w3.org/2000/svg';
function svgEl(tag,attrs){const el=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;}
fetch('assets/jiangsu.json').then(r=>{if(!r.ok)throw Error('Map unavailable');return r.json();}).then(data=>{
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;const polygons=[];
 data.features.forEach(f=>{const polys=f.geometry.type==='MultiPolygon'?f.geometry.coordinates:[f.geometry.coordinates];polys.forEach(p=>{polygons.push(p);p.forEach(ring=>ring.forEach(([x,y])=>{minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}));});});
 const scale=Math.min(400/((maxX-minX)*Math.cos(33*Math.PI/180)),500/(maxY-minY));
 const project=([x,y])=>[30+(x-minX)*Math.cos(33*Math.PI/180)*scale,530-(y-minY)*scale];
 const pointIn=(p,ring)=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 document.querySelectorAll('.jiangsu-map').forEach(svg=>{
  polygons.forEach(p=>{const d=p.map(ring=>ring.map((pt,i)=>`${i?'L':'M'}${project(pt).map(v=>v.toFixed(1)).join(',')}`).join('')+'Z').join('');svg.append(svgEl('path',{d,class:'map-region'}));});
  if(!svg.classList.contains('route-map')){
   let n=0;
   for(let x=minX+.05;x<maxX;x+=.135)for(let y=minY+.05;y<maxY;y+=.14){const p=[x,y];if(polygons.some(poly=>pointIn(p,poly[0]))&&((Math.floor(x*100)+Math.floor(y*100))%3!==0)){const [cx,cy]=project(p);svg.append(svgEl('circle',{cx,cy,r:1.8,class:'map-dot',style:`animation-delay:${.6+n++*.009}s;transform-origin:${cx}px ${cy}px`}));}}
   const cohorts=Array.from({length:14},(_,i)=>{const g=svgEl('g',{class:'dot-cohort',style:`--cohort:${i/14}`});svg.append(g);return g;});
   [...svg.querySelectorAll('.map-dot')].forEach((dot,i)=>{const count=svg.querySelectorAll('.map-dot').length,cols=Math.ceil(Math.sqrt(count*.85)),rows=Math.ceil(count/cols),col=i%cols,row=Math.floor(i/cols);dot.setAttribute('style',`--matrix-dx:${40+col*380/Math.max(1,cols-1)-(+dot.getAttribute('cx'))}px;--matrix-dy:${65+row*430/Math.max(1,rows-1)-(+dot.getAttribute('cy'))}px;--matrix-row:${row/Math.max(1,rows-1)}`);cohorts[(i*11+Math.floor(i/14))%14].append(dot);});
   const [cx,cy]=project([120.58,31.30]);const label=svgEl('text',{x:cx-10,y:cy+22,fill:'#8dcaf5','font-size':'11'});label.textContent='SUZHOU';svg.append(label);
  }
 });
}).catch(()=>{document.querySelectorAll('.jiangsu-map').forEach(svg=>{const text=svgEl('text',{x:40,y:250,fill:'#8dcaf5','font-size':18});text.textContent='Jiangsu · distributed rooftop assets';svg.append(text);});});

// Scene objects retain their provenance; overlay copies never enter the accessibility tree.
const bridgeScenes=[...document.querySelectorAll('.scene-bridge')].map((scene,index)=>{
 const original=scene.querySelector('figure img,.project-profile'),record=scene.classList.contains('bridge-record');
 const text=scene.querySelector(record?'.two-col>div:first-child':'.geography>div:not(.geo-focus)');
 const overlay=document.createElement('div');overlay.className='handover-overlay '+(record?'handover-record':'handover-module');overlay.setAttribute('aria-hidden','true');
 let tile=null,frame=null;
 if(record){tile=document.createElement('div');tile.className='handover-source';const copy=original.cloneNode(true);copy.removeAttribute('id');copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));tile.append(copy);overlay.append(tile);}
 else{frame=svgEl('svg',{class:'handover-frame-lines','aria-hidden':'true'});for(let i=0;i<4;i++)frame.append(svgEl('line',{pathLength:1,class:'handover-frame-edge'}));overlay.append(frame);}
 let destination,cards=[];
 if(record){
  const labels=['Make responsibility visible','Use existing networks','Track the life cycle'];
  cards=labels.map((label,i)=>{const card=document.createElement('div');card.className='handover-solution';card.innerHTML=`<span>0${i+1}</span><strong>${label}</strong>`;overlay.append(card);return card;});
  destination=document.querySelector('.recommendation-focus-nav');
 }else{
  const panel=document.createElement('div');panel.className='handover-panel';const svg=document.querySelector('#module-visual').cloneNode(true);
  const ids=[...svg.querySelectorAll('[id]')];ids.forEach(el=>{const old=el.id,next='handover-'+old;el.id=next;svg.querySelectorAll('*').forEach(node=>{for(const attr of ['fill','clip-path']){const val=node.getAttribute(attr);if(val&&val.includes('#'+old))node.setAttribute(attr,val.replace('#'+old,'#'+next));}});});
  svg.removeAttribute('id');svg.removeAttribute('aria-label');svg.querySelectorAll('.module-labels,.assembly-glint').forEach(el=>el.remove());svg.querySelectorAll('.module-layer').forEach(el=>el.removeAttribute('style'));panel.append(svg);overlay.append(panel);destination=panel;
 }
 const caption=document.createElement('p');caption.className='handover-caption';caption.textContent=record?'ONE PROJECT RECORD → THREE PRACTICAL ACTIONS':'FOUR EDGES → ONE PHOTOVOLTAIC MODULE';overlay.append(caption);document.body.append(overlay);
 return {scene,original,text,overlay,tile,frame,destination,cards,caption,record};
});

let explorationUnlocked=false;
const materialStory=document.querySelector('.material-story');
const projection=document.createElementNS('http://www.w3.org/2000/svg','g');projection.setAttribute('class','material-projections');
projection.innerHTML=['Glass','Aluminium','Silicon','Copper','Silver','Polymers'].map((name,i)=>`<path d="M${[450,430,300,215,240,330][i]} ${[180,125,265,285,300,380][i]}Q460 ${80+i*65} 525 ${80+i*65}"/><text x="530" y="${84+i*65}">${name}</text>`).join('');diagram.querySelector('svg').append(projection);
function jumpToScene(el,target){const rect=el.getBoundingClientRect();window.scrollTo({top:scrollY+rect.top+rect.height/2-innerHeight*target,behavior:reduceMotion?'instant':'smooth'});}
document.querySelectorAll('[data-journey-jump]').forEach(button=>button.addEventListener('click',()=>jumpToScene(journeySteps[+button.dataset.journeyJump],innerWidth<=800?.73:.52)));
document.querySelectorAll('[data-recommendation-jump]').forEach(button=>button.addEventListener('click',()=>window.scrollTo({top:scrollY+recommendationCards[+button.dataset.recommendationJump].getBoundingClientRect().top-210,behavior:reduceMotion?'instant':'smooth'})));
const solutionCanvas=document.querySelector('.solution-canvas'),solutionModels=[...document.querySelectorAll('.solution-model')];
recommendationCards.forEach((card,i)=>{const model=solutionModels[i].cloneNode(true);model.classList.add('mobile-solution','active');card.append(model);});
const lifecycleShapes=[...document.querySelectorAll('.solution-model .lifecycle-route')].map(route=>({route,points:Array.from({length:81},(_,i)=>{const p=route.getPointAtLength(route.getTotalLength()*i/80);return {x:p.x,y:p.y};})}));
let modelIndex=-1;
function updateContinuousScenes(){
 const short=innerHeight<=650;
 updateEditorialBridges();updateProvinceNarrative();updateLifeControls();

 const mr=materialStory.getBoundingClientRect(),mp=reduceMotion||short?1:clamp((90-mr.top)/Math.max(1,mr.height-innerHeight*.8));
 explorationUnlocked=explorationUnlocked||mp>.45;const ready=explorationUnlocked||manualLayers!==null;materialStory.classList.toggle('explore-ready',ready);
 const category=clamp((mp-.38)/.10);materialStory.style.setProperty('--category-progress',category);
 const phase=mp<.08?0:mp<.38?1:mp<.48?2:3;
 document.querySelector('.material-phase').textContent=['01 / THE COMPLETE MODULE','02 / SCROLL TO SEPARATE THE LAYERS','03 / FROM COMPONENTS TO MATERIALS','04 / SELECT A MATERIAL TO EXPLORE'][phase];
 if(manualLayers!==null)applyLayers(manualLayers);else{
  const progress=reduceMotion||short?1:clamp((mp-.08)/.35);currentLayerValue=progress;
  const starts=[.55,.43,.28,0,.14],ends=[1,.90,.72,.48,.62],offsets=[130,65,-12,-90,-140];
  materialLayers.forEach((layer,i)=>layer.style.transform=`translateY(${offsets[i]*easeOut(clamp((progress-starts[i])/(ends[i]-starts[i])))}px)`);
  layerLabels.forEach(label=>label.classList.toggle('label-on',progress>.7));diagram.querySelectorAll('.module-labels path').forEach(path=>path.classList.toggle('label-on',progress>.7));updateAssemblyControl(progress);
 }
 if(materialSelectionY!==null&&Math.abs(scrollY-materialSelectionY)>innerHeight*.12)materialSelectionY=null;
 if(mp>=.45&&materialSelectionY===null&&manualLayers!==0&&!diagram.classList.contains('is-assembling')){
  const index=Math.min(5,Math.floor(clamp((mp-.45)/.55)*6));
  if(index!==lastMaterialAuto){lastMaterialAuto=index;selectMaterial(materialButtons[index].dataset.material);}
 }else if(mp<.38&&manualLayers===null&&lastMaterialAuto!==-1){lastMaterialAuto=-1;selectMaterial(null);}
 updateEconomicsTakeaway();
 let selected=0;recommendationCards.forEach((card,i)=>{if(card.getBoundingClientRect().top<=innerHeight*.40)selected=i;});
 focusSequence(recommendationCards,selected);focusSequence(recommendationIndex,selected);
 document.querySelectorAll('[data-recommendation-jump]').forEach((button,i)=>{if(i===selected)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
 if(modelIndex!==selected){modelIndex=selected;solutionModels.forEach((el,i)=>{el.classList.toggle('active',i===selected);el.setAttribute('aria-hidden',String(i!==selected));});}

 const rr=recommendationCards[selected].getBoundingClientRect(),rp=reduceMotion?1:clamp((innerHeight*.28-rr.top)/(rr.height*.72));solutionCanvas.style.setProperty('--model-progress',rp);
 const networkRect=recommendationCards[1].getBoundingClientRect(),earlyNetwork=reduceMotion?1:clamp((innerHeight*.90-networkRect.top)/(networkRect.height*1.05));
 updateAggregationFinale(rp,selected,earlyNetwork);
 lifecycleShapes.forEach(({route,points})=>{const morph=reduceMotion?1:selected===2?smoothStep((rp-.74)/.22):0;route.setAttribute('d',points.map((p,i)=>{const angle=-Math.PI/2+i/80*Math.PI*2,x=310+170*Math.cos(angle),y=240+170*Math.sin(angle);return `${i?'L':'M'}${p.x+(x-p.x)*morph} ${p.y+(y-p.y)*morph}`;}).join(' '));route.closest('.solution-model').querySelector('.model-nodes').style.opacity=1-morph;});
 document.querySelectorAll('.solution-model').forEach(model=>{model.style.setProperty('--model-progress',rp);const route=model.querySelector('.lifecycle-route');if(route){const point=route.getPointAtLength(route.getTotalLength()*clamp(rp/.74)),dot=model.querySelector('.digital-record');dot.setAttribute('cx',point.x);dot.setAttribute('cy',point.y);}});
 const pause=document.querySelector('.journey-pause').getBoundingClientRect();document.querySelector('.journey-visual').style.opacity=reduceMotion?1:1-clamp((innerHeight*.9-pause.top)/(innerHeight*.5));
 const ep=document.querySelector('.economics-pause').getBoundingClientRect(),ef=reduceMotion?1:1-clamp((innerHeight*.9-ep.top)/(innerHeight*.7));document.querySelectorAll('.balance,.equation,.cost-bars').forEach(el=>el.style.opacity=Math.max(.15,ef));
}

// Editorial motion uses a small, bounded set of surfaces. Evidence and citations stay in normal flow.
const smoothStep=t=>{t=clamp(t);return t*t*(3-2*t);};
const provinceSection=document.querySelector('#boom'),provinceFigure=provinceSection.querySelector('.province-figure'),provinceMap=provinceFigure.querySelector('svg');
function updateProvinceNarrative(){
 const r=provinceSection.getBoundingClientRect(),h=innerHeight;
 const populate=reduceMotion?1:clamp((h-r.top)/(h*1.65));
 provinceMap.style.setProperty('--dot-progress',populate);provinceMap.style.setProperty('--matrix-progress',0);provinceMap.style.setProperty('--matrix-fade',0);provinceMap.style.setProperty('--original-dot-remain',1);provinceMap.style.setProperty('--dot-remain',1);provinceMap.style.setProperty('--dot-growth',1);provinceMap.style.setProperty('--suzhou-opacity',.5+.5*smoothStep((populate-.75)/.2));
 provinceSection.style.setProperty('--map-boundary',1);provinceSection.querySelector('.two-col>div:first-child').style.opacity=1;document.querySelector('.sip').style.setProperty('--arrival',1);
}
function updateEconomicsTakeaway(){
 const pause=document.querySelector('.economics-pause'),r=pause.getBoundingClientRect(),p=reduceMotion?1:clamp((innerHeight*.40-r.top)/Math.max(1,r.height-innerHeight*.60));
 const lines=[...pause.querySelectorAll('.takeaway-line')],index=Math.min(2,Math.floor(p*3));
 lines.forEach((line,i)=>{line.classList.toggle('takeaway-lit',reduceMotion||p>.94||i===index);});pause.dataset.focusLine=p>.94?'all':String(index+1);
}

function updateLifeControls(){
 const rect=document.querySelector('.life-buttons').getBoundingClientRect();
 if(lifeManualY!==null&&Math.abs(scrollY-lifeManualY)<90)return;
 lifeManualY=null;
 if(rect.top<innerHeight*.95&&rect.bottom>0){const index=Math.min(3,Math.floor(clamp((innerHeight*.95-rect.top)/(innerHeight*.8))*4));if(index!==lifeCurrent)activateLife(index);}
}
function updateEditorialBridges(){
 const h=innerHeight,w=innerWidth,mobile=w<=800;
 bridgeScenes.forEach(state=>{
  const {scene,original,text,overlay,tile,destination,cards,caption,record}=state;
  const sr=scene.getBoundingClientRect(),r=original.getBoundingClientRect();
  const p=mobile?clamp((h*.24-r.top)/(h*1.60)):clamp((100-sr.top)/Math.max(1,sr.height-h*.20));
  const keyboardFocus=scene.contains(document.activeElement)&&document.activeElement.matches(':focus-visible');
  const enabled=!reduceMotion&&h>650&&!figureModal.open&&!keyboardFocus;
  if(!record){updateFrameHandover(state,p,sr,enabled&&!mobile);return;}
  const active=enabled&&p>.08&&p<1&&sr.bottom>0&&sr.top<h;
  overlay.classList.toggle('handover-active',active);scene.dataset.handoverProgress=p.toFixed(3);
  if(!enabled){scene.style.setProperty('--scene-text-opacity',1);overlay.style.opacity=0;original.style.opacity=1;if(!record){original.closest('figure').style.opacity=1;original.closest('figure').style.pointerEvents='';}if(text)text.style.opacity=1;if(record)destination.style.opacity=1;else document.querySelector('#module-visual').style.opacity=1;return;}
  const lift=smoothStep((p-.10)/.30),morph=smoothStep((p-.34)/.34),arrival=smoothStep((p-.73)/.27),enter=smoothStep((p-.08)/.10),leave=1-smoothStep((p-.94)/.06);
  overlay.style.opacity=active?enter*leave:0;overlay.style.setProperty('--handover-atmosphere',Math.sin(clamp((p-.1)/.9)*Math.PI)*.92);
  original.style.opacity=record&&p>.08&&p<1?1-enter:1;if(!record){original.closest('figure').style.opacity=p>.08&&p<1?1-enter:1;original.closest('figure').style.pointerEvents=active?'none':'';}
  scene.style.setProperty('--scene-text-opacity',1-smoothStep((p-.12)/.24));if(text)text.style.opacity=1-smoothStep((p-.12)/.24);
  const centerWidth=Math.min(record?520:470,w*(mobile?.82:.56)),centerHeight=record?Math.min(r.height,h*.72):Math.min(h*.66,centerWidth*812/738);
  const tw=r.width+(centerWidth-r.width)*lift,th=r.height+(centerHeight-r.height)*lift;
  const tx=r.left+(w/2-centerWidth/2-r.left)*lift,ty=r.top+(h*.44-centerHeight/2-r.top)*lift;
  tile.style.width=tw+'px';tile.style.height=th+'px';tile.style.left=tx+'px';tile.style.top=ty+'px';tile.style.opacity=(1-morph).toFixed(4);tile.style.transform=`translateY(${-18*morph}px)`;
  caption.style.opacity=smoothStep((p-.2)/.15)*(1-arrival);caption.style.transform=`translateY(${8*(1-lift)}px)`;
  if(record){
   const targetRects=[...document.querySelectorAll('.recommendation-focus-nav li')].map(el=>el.getBoundingClientRect());
   const spread=smoothStep((p-.43)/.31),cw=mobile?w*.80:Math.min(300,(w-150)/3),ch=mobile?84:140;
   cards.forEach((card,i)=>{
    const startX=tx+(tw-cw)/2,startY=ty+th*.34+(i-1)*24;
    const splitX=mobile?(w-cw)/2:45+i*(w-90)/3,splitY=mobile?h*.24+i*108:h*.40+(i===1?-18:0);
    const tr=targetRects[i],land=mobile?0:arrival;
    const x=startX+(splitX-startX)*spread,y=startY+(splitY-startY)*spread;
    card.style.left=(x+(tr.left-x)*land)+'px';card.style.top=(y+(tr.top-y)*land)+'px';card.style.width=(cw+(tr.width-cw)*land)+'px';card.style.height=(ch+(tr.height-ch)*land)+'px';card.style.opacity=smoothStep((p-.35-i*.025)/.18);card.style.setProperty('--card-landing',land);card.querySelector('strong').style.opacity=mobile?1:smoothStep((spread-.94)/.06);
   });
   destination.style.opacity=active&&p>.45?smoothStep((p-.94)/.06):1;
  }else{
   const target=document.querySelector('#module-visual'),tr=target.getBoundingClientRect(),pw=Math.min(w*.88,720),ph=pw*500/620;
   const x=(w-pw)/2+(tr.left-(w-pw)/2)*arrival,y=h*.42-ph/2+(tr.top-(h*.42-ph/2))*arrival;
   destination.style.left=x+'px';destination.style.top=y+'px';destination.style.width=(pw+(tr.width-pw)*arrival)+'px';destination.style.height=(ph+(tr.height-ph)*arrival)+'px';destination.style.opacity=morph;
   destination.style.setProperty('--panel-trace',smoothStep((p-.31)/.35));
   target.style.opacity=active&&p>.34?smoothStep((p-.94)/.06):1;
  }
 });
}
function updateFrameHandover({scene,original,text,overlay,frame,destination,caption},p,sr,enabled){
 const w=innerWidth,h=innerHeight,figure=original.closest('figure'),fr=figure.getBoundingClientRect(),target=document.querySelector('#module-visual'),tr=target.getBoundingClientRect();
 const active=enabled&&p>.075&&p<1&&sr.bottom>0&&sr.top<h;overlay.classList.toggle('handover-active',active);scene.dataset.handoverProgress=p.toFixed(3);
 if(!enabled){overlay.style.opacity=0;figure.style.opacity=1;figure.style.pointerEvents='';original.style.opacity=1;text.style.opacity=1;scene.style.setProperty('--scene-text-opacity',1);target.style.opacity=1;return;}
 const enter=smoothStep((p-.075)/.07),leave=1-smoothStep((p-.94)/.06),morph=smoothStep((p-.32)/.30),arrival=smoothStep((p-.78)/.22),fill=smoothStep((p-.63)/.18),fade=smoothStep((p-.31)/.19);
 overlay.style.opacity=active?enter*leave:0;overlay.style.setProperty('--handover-atmosphere',smoothStep((p-.30)/.18)*(1-smoothStep((p-.82)/.18))*.92);
 figure.style.opacity=1-fade;figure.style.pointerEvents=active&&p>.30?'none':'';original.style.opacity=1;text.style.opacity=1-smoothStep((p-.26)/.20);scene.style.setProperty('--scene-text-opacity',1-smoothStep((p-.26)/.20));
 const pw=Math.min(w*.88,720),ph=pw*500/620,px=(w-pw)/2+(tr.left-(w-pw)/2)*arrival,py=h*.42-ph/2+(tr.top-(h*.42-ph/2))*arrival,ww=pw+(tr.width-pw)*arrival,hh=ph+(tr.height-ph)*arrival;
 destination.style.left=px+'px';destination.style.top=py+'px';destination.style.width=ww+'px';destination.style.height=hh+'px';destination.style.opacity=fill;
 frame.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const rectangle=[[fr.left,fr.top],[fr.right,fr.top],[fr.right,fr.bottom],[fr.left,fr.bottom]],quad=[[75,260],[395,180],[545,280],[225,360]],points=rectangle.map(([x,y],i)=>[x+(px+quad[i][0]/620*ww-x)*morph,y+(py+quad[i][1]/500*hh-y)*morph]);
 [...frame.children].forEach((line,i)=>{const a=points[i],b=points[(i+1)%4];line.setAttribute('x1',a[0]);line.setAttribute('y1',a[1]);line.setAttribute('x2',b[0]);line.setAttribute('y2',b[1]);line.style.strokeDashoffset=1-smoothStep((p-.09-i*.035)/.12);});
 caption.style.opacity=smoothStep((p-.40)/.15)*(1-arrival);target.style.opacity=active&&p>.32?smoothStep((p-.94)/.06):1;
}
// The digital record completes the lifecycle before it resolves into a circular flow.
const trackingModels=[...document.querySelectorAll('.solution-model[data-model="2"]')];
trackingModels.forEach(model=>{const label=svgEl('text',{x:310,y:252,'text-anchor':'middle',class:'recycle-final'});label.textContent='RECYCLE';model.querySelector('svg').append(label);});
function updateAggregationFinale(progress,selected,networkProgress=progress){
 solutionCanvas.classList.toggle('cycle-resolved',selected===2&&(reduceMotion||progress>.95));
 document.querySelectorAll('.solution-model[data-model="1"]').forEach(model=>{
  model.style.setProperty('--circle-final',0);model.querySelectorAll('.aggregation-line').forEach(path=>{const build=networkProgress;path.style.strokeDasharray=1;path.style.strokeDashoffset=1-smoothStep((build-(+path.dataset.order)*.055)/.68);});
 });
 trackingModels.forEach(model=>{const morph=reduceMotion?1:selected===2?smoothStep((progress-.74)/.22):0,label=reduceMotion?1:selected===2?smoothStep((progress-.93)/.07):0;model.style.setProperty('--circle-final',morph);model.style.setProperty('--recycle-label',label);});
}

// A single recycle ring carries forward into the larger lifecycle diagram.
const linkNS='http://www.w3.org/2000/svg';
const linkedOverlay=document.createElementNS(linkNS,'svg');linkedOverlay.classList.add('linked-transition');linkedOverlay.setAttribute('aria-hidden','true');
const linkedCircle=document.createElementNS(linkNS,'circle');linkedOverlay.append(linkedCircle);
const linkedRecycle=document.createElementNS(linkNS,'text');linkedRecycle.textContent='RECYCLE';linkedRecycle.setAttribute('text-anchor','middle');linkedRecycle.setAttribute('dominant-baseline','middle');linkedRecycle.classList.add('linked-recycle');linkedOverlay.append(linkedRecycle);document.body.append(linkedOverlay);
let ringStart=null,ringDrawStart=null;
function updateLinkedTransitions(){
 const h=innerHeight,w=innerWidth;linkedOverlay.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const life=document.querySelector('.circular-life'),cr=life.getBoundingClientRect(),source=document.querySelector('.solution-canvas .solution-model[data-model="2"] svg'),sr=source.getBoundingClientRect();
 const third=document.querySelectorAll('.recommendation')[2].getBoundingClientRect();
 const start=scrollY+third.top+third.height*.72-h*.28,end=scrollY+cr.top-h*.40;
 const p=reduceMotion?1:clamp((scrollY-start)/Math.max(h*.6,end-start)),active=!reduceMotion&&p>0&&p<1;
 if(p===0)ringStart=null;
 if(active&&!ringStart)ringStart={x:sr.left+sr.width*.5,y:Math.max(h*.3,Math.min(h*.6,sr.top+sr.height*.48)),r:sr.width*170/620};
 const mix=(a,b,t)=>a+(b-a)*t,t=1-Math.pow(1-p,3);
 linkedCircle.style.opacity=active?1:0;linkedRecycle.style.opacity=active?1-smoothStep(p/.25):0;
 if(active){
  const cx=mix(ringStart.x,cr.left+cr.width/2,t),cy=mix(ringStart.y,Math.max(h*.4,Math.min(h*.72,cr.top+cr.height/2)),t),r=mix(ringStart.r,cr.width*202/500,t);
  linkedCircle.setAttribute('cx',cx);linkedCircle.setAttribute('cy',cy);linkedCircle.setAttribute('r',r);linkedRecycle.setAttribute('x',cx);linkedRecycle.setAttribute('y',cy);
 }
 source.style.opacity=active?0:1;solutionCanvas.style.transform='';
 document.querySelectorAll('.bigger h2,.bigger>.wrap>.eyebrow').forEach(el=>el.style.opacity=active?0:1);
 life.style.setProperty('--linked-ring',p>=1?1:0);
 if(p<1)ringDrawStart=null;else if(ringDrawStart===null)ringDrawStart=performance.now();
 const drawing=reduceMotion?1:p<1?0:clamp((performance.now()-ringDrawStart)/300);
 if(p>=1&&drawing<1&&!reduceMotion)requestAnimationFrame(requestScroll);
 const draw=life.querySelector('.circle-draw');draw.style.strokeDasharray='1269.2';draw.style.strokeDashoffset=String(1269.2*(1-drawing));
 life.querySelector('.circle-base').style.opacity=p>=1?.25:0;
 life.style.setProperty('--linked-labels',reduceMotion?1:smoothStep((drawing-.65)/.35));
}

// Native reading panels keep the original figures and provide explicit invitations.
const readingDialogs=[...document.querySelectorAll('.reading-dialog')];
let readingReturn=null,readingOverflow='';
function openReading(id,trigger){
 const dialog=document.getElementById(id);if(!dialog||dialog.open)return;
 readingReturn=trigger;readingOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();
}
document.querySelectorAll('[data-reading-open]').forEach(button=>button.addEventListener('click',()=>openReading(button.dataset.readingOpen,button)));
readingDialogs.forEach(dialog=>{
 dialog.querySelector('.reading-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();if(event.target.closest('a[href^="#"]'))dialog.close();});
 dialog.addEventListener('close',()=>{document.body.style.overflow=readingOverflow;readingReturn?.focus({preventScroll:true});});
});
const provinceReadingMap=document.querySelector('#boom .province-figure>svg');
provinceReadingMap.addEventListener('click',()=>openReading('jiangsu-reading',document.querySelector('.map-reading-invite')));
const circularReading=document.querySelector('.circular-life');
circularReading.addEventListener('click',()=>openReading('circle-reading',circularReading));
circularReading.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openReading('circle-reading',circularReading);}});
function updateResponsibilityIntro(){
 const scene=document.querySelector('.responsibility-scroll'),r=scene.getBoundingClientRect();
 const progress=reduceMotion?0:clamp((115-r.top)/Math.max(1,r.height-innerHeight*.85)),index=Math.min(3,Math.floor(progress*4));
 scene.dataset.role=String(index);
 document.querySelectorAll('[data-role-step]').forEach((el,i)=>el.classList.toggle('active',i===index));
 document.querySelectorAll('[data-role-note]').forEach((el,i)=>{el.classList.toggle('active',i===index);el.setAttribute('aria-hidden',String(i!==index));});
}
