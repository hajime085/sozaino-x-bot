// src/execute-post.js
// GitHub Actions から毎時呼び出され、該当時刻の投稿を実行する

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isPostTime }    from './scheduler.js';
import { uploadMedia, postTweet } from './poster.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadJSON(filePath) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', filePath), 'utf8'));
}
function saveJSON(filePath, data) {
  fs.writeFileSync(path.join(__dirname, '..', filePath), JSON.stringify(data, null, 2), 'utf8');
}

async function main() {
  const scheduleFile = path.join(__dirname, '../data/today-schedule.json');
  if (!fs.existsSync(scheduleFile)) {
    console.log('⏭️ today-schedule.json が見つかりません。スキップ。');
    return;
  }

  const todayPosts = loadJSON('./data/today-schedule.json');
  let posted = false;

  for (const post of todayPosts) {
    if (post.done) continue;

    const { utcHour, utcMinute } = post.schedule;
    if (!isPostTime(utcHour, utcMinute)) continue;

    console.log(`🚀 投稿実行: ${post.schedule.label}`);
    console.log(post.text.substring(0, 100));

    let mediaId = null;
    if (post.imageUrl) {
      mediaId = await uploadMedia(post.imageUrl);
    }

    const tweetId = await postTweet(post.text, mediaId);
    if (tweetId) {
      post.done    = true;
      post.tweetId = tweetId;
      posted = true;
    }

    break; // 1回の実行で1件のみ
  }

  if (posted) {
    saveJSON('./data/today-schedule.json', todayPosts);
    console.log('✅ today-schedule.json 更新完了');
  } else {
    console.log('⏭️ 該当する投稿時刻なし。スキップ。');
  }
}

main().catch(err => {
  console.error('❌ エラー:', err);
  process.exit(1);
});
