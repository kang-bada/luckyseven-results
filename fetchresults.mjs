/* 럭키세븐 — 당첨번호 주간 자동 갱신 v3 (GitHub Actions용)
   로또: ① smok95.github.io (전 회차 일괄) → ② puzizig 회차 조회(최신 3회차) → ③ 동행복권 API
   연금: puzizig 회차 조회 (최신 5회차)
   결과는 results.json 에 누적. 이미 있는 회차는 절대 덮어쓰지 않는다. */
import fs from 'node:fs';

const OUT='results.json';
const cur = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT,'utf8')) : {};
cur['kr-lotto645']   ||= {};
cur['kr-pension720'] ||= {};
let changed = 0;
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const UA = { headers:{ 'user-agent':'Mozilla/5.0' } };
const strip = h => h.replace(/<script[\s\S]*?<\/script>/gi,' ')
  .replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ');
const latestLotto = 1 + Math.floor((Date.now() - Date.UTC(2002,11,7)) / (7*864e5));

/* ══ 로또 ① — 전 회차 일괄 ══ */
try{
  const r = await fetch('https://smok95.github.io/lotto/results/all.json', UA);
  if(!r.ok) throw new Error('HTTP '+r.status);
  const arr = await r.json(); let got=0;
  for(const it of arr){
    const rd=it.draw_no, main=it.numbers, bonus=it.bonus_no;
    if(!rd || !Array.isArray(main) || main.length!==6 || !bonus) continue;
    if(cur['kr-lotto645'][rd]) continue;
    cur['kr-lotto645'][rd] = { main: main.slice().sort((a,b)=>a-b), bonus };
    got++; changed++;
  }
  console.log('로또①:', got? got+'회차 추가':'새 회차 없음');
}catch(e){ console.log('로또① 실패:', e.message); }

/* ══ 로또 ② — 1순위가 아직 안 올렸으면 puzizig에서 최신 회차 직접 ══ */
function parseLotto(html, round){
  const text = strip(html);
  if(text.indexOf(round+'회') < 0) return null;
  /* 태그 제거 후 45 이하 숫자 7개(본6+보너스1) 연속 구간을 찾는다 */
  const seg = text.slice(text.indexOf(round+'회'));
  const nums = (seg.match(/\b\d{1,2}\b/g)||[]).map(Number).filter(n=>n>=1&&n<=45);
  for(let i=0;i+7<=nums.length;i++){
    const main=nums.slice(i,i+6), bonus=nums[i+6];
    if(new Set(main).size===6 && !main.includes(bonus))
      return { main: main.slice().sort((a,b)=>a-b), bonus };
  }
  console.log('  (해석 실패 — 본문 앞부분:', seg.slice(0,200)+')');
  return null;
}
for(let rd=latestLotto; rd>latestLotto-3; rd--){
  if(cur['kr-lotto645'][rd]) continue;
  try{
    const html = await (await fetch('https://puzizig.com/programs/lotto-result/?round='+rd, UA)).text();
    const v = parseLotto(html, rd);
    if(v){ cur['kr-lotto645'][rd]=v; changed++; console.log('로또② OK', rd, JSON.stringify(v)); }
    else console.log('로또② 아직', rd);
  }catch(e){ console.log('로또② 실패', rd, e.message); }
  await sleep(200);
}

/* ══ 로또 ③ — 옛 공식 API (혹시 되살아났을 때용) ══ */
for(let rd=latestLotto; rd>latestLotto-2; rd--){
  if(cur['kr-lotto645'][rd]) continue;
  try{
    const t = await (await fetch('https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo='+rd, UA)).text();
    if(t.trim().startsWith('{')){
      const d=JSON.parse(t);
      if(d.returnValue==='success'){
        cur['kr-lotto645'][rd]={main:[d.drwtNo1,d.drwtNo2,d.drwtNo3,d.drwtNo4,d.drwtNo5,d.drwtNo6].sort((a,b)=>a-b),bonus:d.bnusNo};
        changed++; console.log('로또③ OK', rd);
      }
    }
  }catch(e){}
}
console.log('로또 보유:', Object.keys(cur['kr-lotto645']).length+'회차');

/* ══ 연금복권 720+ — 최근 5회차 ══ */
function parsePension(html, round){
  const text = strip(html);
  if(text.indexOf(round+'회') < 0) return null;
  const m = text.match(/([1-5])\s*조\s*((?:\d\s*){6})/);
  if(!m) return null;
  const digits = m[2].replace(/\s+/g,'').split('').map(Number);
  if(digits.length!==6) return null;
  const after = text.slice(text.indexOf(m[0]) + m[0].length);
  const bm = after.match(/보\s*너\s*스[^\d]{0,60}((?:\d\s*){6})/);
  const bonus = bm ? bm[1].replace(/\s+/g,'').split('').map(Number) : null;
  return { group:+m[1], digits, bonus: (bonus&&bonus.length===6)?bonus:null };
}
const pLatest = 1 + Math.floor((Date.now() - Date.UTC(2020,4,7)) / (7*864e5));
for(let rd=pLatest; rd>pLatest-5; rd--){
  if(rd<1 || cur['kr-pension720'][rd]) continue;
  try{
    const html = await (await fetch('https://puzizig.com/programs/lotto720-result/?round='+rd, UA)).text();
    const v = parsePension(html, rd);
    if(v){ cur['kr-pension720'][rd]=v; changed++; console.log('연금 OK', rd); }
    else console.log('연금 아직', rd);
  }catch(e){ console.log('연금 실패', rd, e.message); }
  await sleep(200);
}
console.log('연금 보유:', Object.keys(cur['kr-pension720']).length+'회차');

fs.writeFileSync(OUT, JSON.stringify(cur));
console.log(changed ? '갱신 '+changed+'건 저장' : '변경 없음 — 이미 최신');
