// Render source SVG excerpts for reviewing mismatched boundary references.
const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/skale/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const read = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const source=read('scripts/data/warsh-divisions/thumn.json');
const markers=read('build/rub-starts-audit/printed-markers.json');
const bridge=read('app/src/main/assets/warsh_ayah_map.json').chapters;
const geometry=read('app/src/main/assets/warsh_maknoon_positions.json');
const all=markers.map(m=>({...m,s:m.refs[0][0],a:m.refs[0][1]}));
for(const r of source.filter(r=>r.starting_aya===1)) {
 const [pg,d]=Object.entries(geometry).find(([p,d])=>d.segments.some(v=>v[0]===r.sura_number&&v[1]===1));
 const y=Math.min(...d.segments.filter(v=>v[0]===r.sura_number&&v[1]===1).map(v=>v[3]))*d.height;
 all.push({page:+pg,y,s:r.sura_number,a:1});
}
all.sort((a,b)=>a.s-b.s||a.a-b.a);
(async()=>{
 const tiles=[];
 for(let i=0;i<480;i++) {
  const m=all[i], r=source[i];
  if(r.sura_number===m.s&&(r.starting_aya===m.a||bridge[m.s][m.a-1].includes(r.starting_aya)))continue;
  const input=path.join(root,`.artifacts/warsh-maknoon/${String(m.page).padStart(3,'0')}.svgz`);
  const img=await sharp(input,{density:190}).flatten({background:'#fff'}).resize({width:760}).png().toBuffer();
  const meta=await sharp(img).metadata(), h=310;
  const top=Math.max(0,Math.min(meta.height-h,Math.round(m.y/geometry[m.page].height*meta.height)-110));
  const crop=await sharp(img).extract({left:0,top,width:760,height:h}).toBuffer();
  const label=Buffer.from(`<svg width="760" height="35"><rect width="760" height="35" fill="#eee"/><text x="12" y="24" font-size="18">Part ${i+1} | page ${m.page} | Warsh ${m.s}:${m.a} | source ${r.sura_number}:${r.starting_aya}</text></svg>`);
  tiles.push(await sharp({create:{width:760,height:345,channels:3,background:'#fff'}}).composite([{input:label,top:0,left:0},{input:crop,top:35,left:0}]).png().toBuffer());
 }
 for(let i=0;i<tiles.length;i+=6) {
  const part=tiles.slice(i,i+6);
  await sharp({create:{width:1520,height:345*Math.ceil(part.length/2),channels:3,background:'#fff'}})
    .composite(part.map((input,j)=>({input,left:(j%2)*760,top:Math.floor(j/2)*345}))).png()
    .toFile(path.join(root,`build/rub-starts-audit/review-${i/6+1}.png`));
 }
 console.log(`${tiles.length} excerpts rendered.`);
})();
