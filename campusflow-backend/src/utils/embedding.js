export function demoEmbedding(studentId) {
  const source = String(studentId || "campusflow");
  const vector = [];
  let seed = 1;
  for (let i = 0; i < 128; i++) {
    seed = Math.sin(seed + source.charCodeAt(i % source.length) * (i + 1)) * 10000;
    vector.push(seed - Math.floor(seed));
  }
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}
