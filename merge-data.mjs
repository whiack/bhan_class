import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data.json', 'utf8'));
let html = readFileSync('../教务管理综合平台.html', 'utf8');

const CO = ['基础课1','基础课2','项目1','项目2','项目3','项目4'];

// Build defaultStudents - each mk call
const mkLines = [];
data.students.forEach(s => {
  const cd = CO.map(c => s.courses[c] || {status:'none',text:''});
  const cdStr = '[' + cd.map(x => `{s:'${x.status}',t:'${(x.text||'').replace(/'/g,"\\'")}'}`).join(',') + ']';
  mkLines.push('    mk(' + [s.id, `'${s.name}'`, `'${s.group}'`, s.coming, s.master, `'${s.vip||''}'`, `'${s.direction||''}'`, cdStr, s.completed || false].join(',') + '),');
});

const newDefaultStudents = `function defaultStudents() {
  const mk = (id,name,group,coming,master,vip,dir,cd,cmpl) => ({id,name,group,coming,master,vip,direction:dir,courses:Object.fromEntries(COURSES.map((c,i)=>{const d=cd[i]||{};return[c,{status:d.s||'none',text:d.t||''}]})),completed:cmpl||false});
  return [
${mkLines.join('\n')}
  ];
}`;

// Replace using function boundaries
html = replaceFunc(html, 'defaultStudents', newDefaultStudents);
html = replaceFunc(html, 'defaultKpi', `function defaultKpi() { return ${JSON.stringify(data.kpiData)}; }`);
html = replaceFunc(html, 'defaultSched', `function defaultSched() { return ${JSON.stringify(data.schedule)}; }`);

function replaceFunc(html, name, replacement) {
  const start = html.indexOf(`function ${name}`);
  if (start === -1) throw new Error(`Cannot find function ${name}`);
  // Find the matching closing brace
  let depth = 0;
  let i = html.indexOf('{', start);
  for (; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') { depth--; if (depth === 0) break; }
  }
  return html.substring(0, start) + replacement + html.substring(i + 1);
}

// Increment DATA_VER to force refresh on all devices
html = html.replace(/const DATA_VER = (\d+)/, (m, v) => `const DATA_VER = ${parseInt(v) + 1}`);

['../教务管理综合平台.html', '../index.html', 'index.html'].forEach(p => writeFileSync(p, html));
console.log('Merged OK: ' + data.students.length + ' students, DATA_VER incremented');
