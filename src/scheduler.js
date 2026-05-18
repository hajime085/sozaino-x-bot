// src/scheduler.js
// ランダム投稿時刻スケジューラー（1日4ポスト・bot っぽくならないよう分散）

/**
 * 1日4ポスト分のランダム時刻を生成（JST）
 * 各時間帯内でランダムに選出
 */
export function generateDailySchedule() {
  const timeSlots = [
    { start: 8,  end: 11 },  // 朝
    { start: 12, end: 14 },  // 昼
    { start: 17, end: 20 },  // 夕方
    { start: 20, end: 23 },  // 夜
  ];

  return timeSlots.map(slot => {
    const hour   = slot.start + Math.floor(Math.random() * (slot.end - slot.start));
    const minute = Math.floor(Math.random() * 60);
    // GitHub Actions は UTC なので JST-9h
    const utcHour = (hour - 9 + 24) % 24;
    return {
      jstHour:   hour,
      jstMinute: minute,
      utcHour,
      utcMinute: minute,
      cron: `${minute} ${utcHour} * * *`,
      label: `${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')} JST`,
    };
  });
}

/**
 * 今が投稿時刻かどうかを判定（±5分の余裕を持たせる）
 */
export function isPostTime(scheduledUtcHour, scheduledUtcMinute) {
  const now = new Date();
  const nowHour   = now.getUTCHours();
  const nowMinute = now.getUTCMinutes();
  const nowTotal  = nowHour * 60 + nowMinute;
  const schedTotal = scheduledUtcHour * 60 + scheduledUtcMinute;
  return Math.abs(nowTotal - schedTotal) <= 5;
}
