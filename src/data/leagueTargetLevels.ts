export function buildLeagueTargetLevelSteps() {
  const out = [];
  for (let k = 17; k >= 1; k -= 1) {
    out.push({ label: `${k} Kyu`, value: `${k}k` });
  }
  out.push({ label: '1 Dan', value: '1d' });
  return out;
}
