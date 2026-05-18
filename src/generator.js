// src/generator.js
// 投稿文生成ロジック

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 素材投稿文を生成
 * usage_guide の scenes / headlines / summary を活用
 */
export function generateMaterialPost(material, monthTheme) {
  const intro = pick(monthTheme.intro);
  const guide = material.usage_guide || {};
  const scenes = guide.scenes || [];
  const headlines = guide.headlines || [];
  const summary = guide.summary || material.description?.substring(0, 80) || '';
  const tags = (material.tags || []).slice(0, 3).map(t => `#${t}`).join(' ');
  const url = `https://sozaino.com/download?id=${material.id}`;

  const templates = [
    // A：季節感 + 使い道（scenes）
    () => {
      const scene = scenes.length > 0 ? `\n📌 ${pick(scenes)}に最適` : '';
      return `🎨 ${intro}\n\n【${material.title}】\n${summary}${scene}\n\n✅ 無料・商用OK・WebP形式\n→ ${url}\n\n${tags} #フリー素材 #ソザイノ`;
    },

    // B：見出し文例を活用
    () => {
      const headline = headlines.length > 0 ? `\n💡 使用例：「${pick(headlines)}」` : '';
      return `📸 素材紹介\n\n${material.title}${headline}\n\n${summary}\n\n無料でDLできます\n→ ${url}\n\n${tags} #素材配布`;
    },

    // C：シンプル紹介
    () => {
      const sceneList = scenes.slice(0, 2).map(s => `▸ ${s}`).join('\n');
      return `✨ 【無料素材】${material.title}\n\n${sceneList ? sceneList + '\n\n' : ''}${summary}\n\nWebP形式 / 商用利用可\n→ ${url}\n\n#フリー素材 #ソザイノ ${tags}`;
    },

    // D：月テーマ連動
    () => {
      const theme = pick(monthTheme.themes);
      const scene = scenes.length > 0 ? pick(scenes) : 'ブログやSNS投稿';
      return `🗓️ ${monthTheme.label}の素材\n\n「${theme}」の季節にぴったりな素材を紹介します。\n\n【${material.title}】\n${scene}に使えます。\n\n→ ${url}\n\n${tags} #フリー素材 #ソザイノ`;
    },
  ];

  return pick(templates)();
}

/**
 * コラム投稿文を生成
 */
export function generateColumnPost(column, monthTheme) {
  const intro = pick(monthTheme.intro);

  const templates = [
    () => `📝 ${intro}に合わせて\n\n${column.title}\n\n${column.excerpt}\n\n詳しくはこちら\n→ ${column.url}\n\n#デザイン #素材活用 #ソザイノ`,
    () => `💡 デザインのヒント\n\n${column.title}\n\n${column.excerpt}\n\n→ ${column.url}`,
    () => `📖 ソザイノ コラム\n\n${column.title}\n\n${column.excerpt}\n\nブログ・動画制作に役立つ情報を発信中\n→ ${column.url}\n\n#フリー素材 #ブログ運営`,
  ];

  return pick(templates)();
}
