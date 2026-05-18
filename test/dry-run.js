// test/dry-run.js
// 実際には投稿せず、今日の投稿内容を確認するスクリプト

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDailySchedule }               from '../src/scheduler.js';
import { selectMaterial, selectColumn }        from '../src/selector.js';
import { generateMaterialPost, generateColumnPost } from '../src/generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function loadJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

const rawData   = loadJSON('./data/data.json');
const materials = rawData.materials.filter(m => m && typeof m === 'object' && m.id);
const columns   = loadJSON('./data/columns.json');
const monthMap  = loadJSON('./data/month-map.json');
const postedLog = { materials: [], columns: [] };

const month = new Date().getMonth() + 1;
const theme = monthMap.monthThemes[String(month)];
const schedule = generateDailySchedule();

console.log('='.repeat(60));
console.log(`🤖 ドライラン - ${new Date().toLocaleDateString('ja-JP')}`);
console.log(`📅 テーマ: ${theme.label} / ${theme.themes.join(', ')}`);
console.log('='.repeat(60));

const postPlan = ['seasonal', 'seasonal', 'column', 'yearround'];

for (let i = 0; i < 4; i++) {
  const type = postPlan[i];
  let text, id;

  if (type === 'column') {
    const col = selectColumn(columns, postedLog.columns);
    text = generateColumnPost(col, theme);
    id   = col.id;
    postedLog.columns.push(id);
  } else {
    const mat = selectMaterial(materials, monthMap, postedLog.materials, month);
    text = generateMaterialPost(mat, theme);
    id   = mat.id;
    postedLog.materials.push(id);
  }

  console.log(`\n[${i + 1}] ⏰ ${schedule[i].label}  (${type})`);
  console.log('-'.repeat(60));
  console.log(text);
  console.log('-'.repeat(60));
}
