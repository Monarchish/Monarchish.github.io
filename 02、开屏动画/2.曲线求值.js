/* ============================================================
   02、开屏动画 · 2.曲线求值.js
   ------------------------------------------------------------
   这是什么：动画曲线的数学求值器。
   它做的事：把 3.动画数据.js 里的一串关键帧 [时间, 数值]
             用 Hermite 插值算出任意时刻的值，支持
             标量、向量、绕 Z 轴角度三种类型。
   谁在用它：被 1.动画播放器.js import。
   要不要改：纯数学工具，正常情况下永远不用动。
   ============================================================ */

export function evaluateScalar(keys, time) {
  if (time <= keys[0][0]) return keys[0][1];
  if (time >= keys.at(-1)[0]) return keys.at(-1)[1];

  let low = 0;
  let high = keys.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (keys[middle][0] <= time) low = middle;
    else high = middle;
  }

  const first = keys[low];
  const second = keys[high];
  if (typeof first[3] === "string" || typeof second[2] === "string") {
    return first[1];
  }

  const duration = second[0] - first[0];
  const t = (time - first[0]) / duration;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return (
    h00 * first[1] +
    h10 * duration * first[3] +
    h01 * second[1] +
    h11 * duration * second[2]
  );
}

export function evaluateVector(keys, time) {
  const width = keys[0][1].length;
  return Array.from({ length: width }, (_, index) =>
    evaluateScalar(
      keys.map((key) => [key[0], key[1][index], key[2][index], key[3][index]]),
      time,
    ),
  );
}

export function quaternionZDegrees([x, y, z, w]) {
  const magnitude = Math.hypot(x, y, z, w) || 1;
  x /= magnitude;
  y /= magnitude;
  z /= magnitude;
  w /= magnitude;
  return (Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z)) * 180) / Math.PI;
}
