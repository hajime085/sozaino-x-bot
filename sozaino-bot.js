// sozaino-bot.js
// エントリポイント：毎朝実行してその日のスケジュールを生成

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateDailySchedule } from './src/scheduler.js';
import { selectMaterial, selectColumn } from './src/selector.js';
import { generateMaterialPost, generateColumnPost } from './src/generator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, filePath), 'utf8'));
}
function saveJSON(filePath, data) {
  fs.writeFileSync(path.join(__dirname, filePath), JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  console.log('🤖 ソザイノ X Bot - スケジュール生成開始');

  const rawData   = loadJSON('./data/data.json');
  const materials = rawData.materials.filter(m => m && typeof m === 'object' && m.id);
  const columns   = loadJSON('./data/columns.json');
  const monthMap  = loadJSON('./data/month-map.json');

  const postedLog = fs.existsSync(path.join(__dirname, './data/posted-log.json'))
    ? loadJSON('./data/posted-log.json')
    : { materials: [], columns: [], lastReset: new Date().toISOString() };

  const month = new Date().getMonth() + 1;
  const theme = monthMap.monthThemes[String(month)];

  console.log(`📅 今月のテーマ: ${theme.label} / ${theme.themes.join(', ')}`);

  const schedule = generateDailySchedule();

  // 1日4ポストの構成：季節素材 × 2、コラム × 1、通年素材 × 1
  const postPlan = ['seasonal', 'seasonal', 'column', 'yearround'];
  const todayPosts = [];

  for (let i = 0; i < 4; i++) {
    const type = postPlan[i];
    let post;

    if (type === 'column') {
      const column = selectColumn(columns, postedLog.columns);
      if (!column) continue;
      const text = generateColumnPost(column, theme);
      post = { type: 'column', id: column.id, text, imageUrl: null };
      postedLog.columns.push(column.id);

    } else {
      const material = selectMaterial(materials, monthMap, postedLog.materials, month);
      if (!material) continue;
      const text     = generateMaterialPost(material, theme);
      const imageUrl = `https://sozaino.com/webp/${material.filename}`;
      post = { type: 'material', id: material.id, text, imageUrl };
      postedLog.materials.push(material.id);
    }

    post.schedule = schedule[i];
    todayPosts.push(post);

    console.log(`\n[${i + 1}] ${schedule[i].label} - ${type}`);
    console.log(post.text.substring(0, 80) + '...');
  }

  // 投稿履歴が増えすぎたらリセット（素材総数の 80% を超えたら）
  const RESET_THRESHOLD = Math.floor(materials.length * 0.8);
  if (postedLog.materials.length > RESET_THRESHOLD) {
    console.log('\n🔄 投稿履歴リセット（素材を一周しました）');
    postedLog.materials = [];
  }
  if (postedLog.columns.length >= columns.length) {
    console.log('🔄 コラム履歴リセット');
    postedLog.columns = [];
  }

  saveJSON('./data/posted-log.json', postedLog);
  saveJSON('./data/today-schedule.json', todayPosts);

  console.log(`\n✅ スケジュール生成完了（${todayPosts.length}件）`);
}

main().catch(err => {
  console.error('❌ エラー:', err);
  process.exit(1);
});
