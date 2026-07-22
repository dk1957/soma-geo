function e(e2, t2, n2) {
  let r = (n3) => e2(n3, ...t2);
  return n2 === void 0 ? r : Object.assign(r, { lazy: n2, lazyArgs: t2 });
}
function t$1(t2, n2, r) {
  let i = t2.length - n2.length;
  if (i === 0) return t2(...n2);
  if (i === 1) return e(t2, n2, r);
  throw Error(`Wrong number of arguments`);
}
function t(...t2) {
  return t$1(n, t2);
}
function n(e2, t2) {
  if (t2 < 1) throw RangeError(`chunk: A chunk size of '${t2.toString()}' would result in an infinite array`);
  if (e2.length === 0) return [];
  if (t2 >= e2.length) return [[...e2]];
  let n2 = Math.ceil(e2.length / t2), r = Array(n2);
  if (t2 === 1) for (let [t3, n3] of e2.entries()) r[t3] = [n3];
  else for (let i = 0; i < n2; i += 1) {
    let n3 = i * t2;
    r[i] = e2.slice(n3, n3 + t2);
  }
  return r;
}
export {
  t
};
