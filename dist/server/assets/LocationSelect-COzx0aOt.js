import { aM as reactExports, aX as LOCATION_OPTIONS, aN as jsxRuntimeExports } from "./index-CSpjggkr.js";
import { S as Search } from "./search-D1JnBu8u.js";
import { C as Check } from "./check-C_HETtUw.js";
function matches(option, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return option.label.toLowerCase().includes(needle) || option.shortLabel.toLowerCase().includes(needle);
}
function LocationSelect({
  value,
  onChange,
  options = LOCATION_OPTIONS,
  className = "w-full"
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [query, setQuery] = reactExports.useState("");
  const [activeIndex, setActiveIndex] = reactExports.useState(0);
  const containerRef = reactExports.useRef(null);
  const inputRef = reactExports.useRef(null);
  const listRef = reactExports.useRef(null);
  const selected = options.find((option) => option.code === value) ?? null;
  const filtered = reactExports.useMemo(
    () => options.filter((option) => matches(option, query)),
    [options, query]
  );
  reactExports.useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    inputRef.current?.focus();
  }, [open]);
  reactExports.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      const target = event.target;
      if (target instanceof Node && !containerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);
  reactExports.useEffect(() => {
    if (!open) return;
    const activeItem = listRef.current?.children[activeIndex];
    activeItem?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);
  const select = (option) => {
    onChange(option.code);
    setOpen(false);
  };
  const handleKeyDown = (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case "Enter": {
        event.preventDefault();
        const option = filtered[activeIndex];
        if (option) select(option);
        break;
      }
      case "Escape":
        event.preventDefault();
        setOpen(false);
        break;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: containerRef, className: `relative ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        className: "select select-bordered flex w-full items-center justify-between gap-2 text-left font-normal",
        "aria-haspopup": "listbox",
        "aria-expanded": open,
        onClick: () => setOpen((prev) => !prev),
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: selected?.label ?? "Select country" })
      }
    ),
    open ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed z-30 mt-2 w-full max-w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 rounded-lg border border-base-300 px-3 py-2 focus-within:border-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4 shrink-0 text-base-content/50" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            ref: inputRef,
            type: "text",
            className: "grow min-w-0 bg-transparent text-sm outline-none placeholder:text-base-content/40",
            placeholder: "Search countries",
            value: query,
            onChange: (event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            },
            onKeyDown: handleKeyDown
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "ul",
        {
          ref: listRef,
          role: "listbox",
          className: "menu mt-2 max-h-64 w-full flex-nowrap overflow-y-auto p-0",
          children: filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "w-full break-all px-3 py-2 text-sm text-base-content/50", children: [
            "No countries match “",
            query.trim(),
            "”"
          ] }) : filtered.map((option, index) => {
            const isSelected = option.code === value;
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              "li",
              {
                role: "option",
                "aria-selected": isSelected,
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "button",
                  {
                    type: "button",
                    className: `w-full ${index === activeIndex ? "menu-focus" : ""}`,
                    onClick: () => select(option),
                    onMouseEnter: () => setActiveIndex(index),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 truncate", children: option.label }),
                      isSelected ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4 shrink-0 text-primary" }) : null
                    ]
                  }
                )
              },
              option.code
            );
          })
        }
      )
    ] }) : null
  ] });
}
export {
  LocationSelect as L
};
