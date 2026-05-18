// src/selector.js
// 素材・コラム選出ロジック

/**
 * 素材に対応する月リストを返す
 */
function getMonthsForMaterial(material, monthMap) {
  const months = new Set();
  const cat = material.category || '';
  const catMap = monthMap.categoryToMonths || {};
  const tagMap = monthMap.tagToMonths || {};

  if (catMap[cat] && catMap[cat].length > 0) {
    catMap[cat].forEach(m => months.add(m));
  }
  (material.tags || []).forEach(tag => {
    if (tagMap[tag]) {
      tagMap[tag].forEach(m => months.add(m));
    }
  });
  return months;
}

/**
 * 今月の季節素材を抽出（投稿済みを除外）
 */
export function getSeasonalCandidates(materials, monthMap, postedIds, targetMonth) {
  const month = targetMonth || new Date().getMonth() + 1;
  return materials.filter(m =>
    getMonthsForMaterial(m, monthMap).has(month) &&
    !postedIds.includes(m.id)
  );
}

/**
 * 通年素材を抽出（投稿済みを除外）
 */
export function getYearRoundCandidates(materials, monthMap, postedIds) {
  return materials.filter(m =>
    getMonthsForMaterial(m, monthMap).size === 0 &&
    !postedIds.includes(m.id)
  );
}

/**
 * 素材を選出（季節優先 → 通年フォールバック → 全体フォールバック）
 */
export function selectMaterial(materials, monthMap, postedIds, targetMonth) {
  const month = targetMonth || new Date().getMonth() + 1;

  let candidates = getSeasonalCandidates(materials, monthMap, postedIds, month);

  // 季節素材が10件未満なら通年素材も候補に入れる
  if (candidates.length < 10) {
    const yearRound = getYearRoundCandidates(materials, monthMap, postedIds);
    candidates = [...candidates, ...yearRound];
  }

  // それでもなければ全素材（投稿済み含む）
  if (candidates.length === 0) {
    candidates = materials;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * 未投稿コラムを選出（全部投稿済みなら古いものから再利用）
 */
export function selectColumn(columns, postedIds) {
  const unposted = columns.filter(c => !postedIds.includes(c.id));
  if (unposted.length > 0) {
    return unposted[Math.floor(Math.random() * unposted.length)];
  }
  // 全部消化したらリセット扱いでランダム
  return columns[Math.floor(Math.random() * columns.length)];
}
