import { q as createLucideIcon } from "./router-8qflvY1T.js";
import { aM as reactExports } from "./index-CSpjggkr.js";
const __iconNode$1 = [
  ["path", { d: "M12 6v6l4 2", key: "mmk7yg" }],
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }]
];
const Clock = createLucideIcon("clock", __iconNode$1);
const __iconNode = [
  ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" }],
  ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ["path", { d: "M12 7v5l4 2", key: "1fdv2h" }]
];
const History = createLucideIcon("history", __iconNode);
function loadHistory(storageKey, parse, maxItems) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = parse(raw);
    return parsed ? parsed.slice(0, maxItems) : [];
  } catch {
    return [];
  }
}
function saveHistory(storageKey, items) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
  }
}
function useLocalHistoryStore({
  storageKey,
  maxItems = 20,
  parse,
  isSameItem,
  createItem,
  getItemKey
}) {
  const parseRef = reactExports.useRef(parse);
  const [history, setHistory] = reactExports.useState([]);
  const [isLoaded, setIsLoaded] = reactExports.useState(false);
  reactExports.useEffect(() => {
    parseRef.current = parse;
  }, [parse]);
  reactExports.useEffect(() => {
    setHistory(loadHistory(storageKey, parseRef.current, maxItems));
    setIsLoaded(true);
  }, [maxItems, storageKey]);
  const addItem = reactExports.useCallback(
    (input) => {
      setHistory((prev) => {
        const filtered = prev.filter(
          (existing) => !isSameItem(existing, input)
        );
        const next = [createItem(input), ...filtered].slice(0, maxItems);
        saveHistory(storageKey, next);
        return next;
      });
    },
    [createItem, isSameItem, maxItems, storageKey]
  );
  const removeItem = reactExports.useCallback(
    (itemKey) => {
      setHistory((prev) => {
        const next = prev.filter((item) => getItemKey(item) !== itemKey);
        saveHistory(storageKey, next);
        return next;
      });
    },
    [getItemKey, storageKey]
  );
  const clearItems = reactExports.useCallback(() => {
    setHistory([]);
    saveHistory(storageKey, []);
  }, [storageKey]);
  return { history, isLoaded, addItem, removeItem, clearItems };
}
export {
  Clock as C,
  History as H,
  useLocalHistoryStore as u
};
