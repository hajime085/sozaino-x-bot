// src/scheduler.js
export function generateDailySchedule() {
  const timeSlots = [
    { start: 8,  end: 11 },
    { start: 12, end: 14 },
    { start: 17, end: 20 },
    { start: 20, end: 23 },
  ];

  return timeSlots.map(slot => {
    // 時間帯内でランダムな「時」を選ぶ（分は必ず0）
    const hour = slot.start + Math.floor(Math.random() * (slot.end - slot.start));
    const minute = 0;  // 必ず0分に固定
    const utcHour = (hour - 9 + 24) % 24;
    return {
      jstHour: hour,
      jstMinute: minute,
      utcHour,
      utcMinute: 0,
      cron: `0 ${utcHour} * * *`,
      label: `${String(hour).padStart(2,'0')}:00 JST`,
    };
  });
}

export function isPostTime(scheduledUtcHour, scheduledUtcMinute) {
  const now = new Date();
  const nowHour = now.getUTCHours();
  return nowHour === scheduledUtcHour;
}
