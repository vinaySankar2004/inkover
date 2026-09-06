// Dev harness shim. Stands in for the WebExtension API so content.js runs in a plain page.
// architecture.md, Pieces: Dev harness. Never shipped.

window.__inkoverDev = true;

(() => {
  const PREFIX = "inkover-dev:";
  const listeners = [];

  window.browser = {
    storage: {
      local: {
        get(keys) {
          const list = Array.isArray(keys) ? keys : [keys];
          const out = {};
          for (const k of list) {
            const raw = localStorage.getItem(PREFIX + k);
            if (raw !== null) out[k] = JSON.parse(raw);
          }
          return Promise.resolve(out);
        },
        set(obj) {
          for (const [k, v] of Object.entries(obj)) localStorage.setItem(PREFIX + k, JSON.stringify(v));
          return Promise.resolve();
        },
        remove(keys) {
          for (const k of Array.isArray(keys) ? keys : [keys]) localStorage.removeItem(PREFIX + k);
          return Promise.resolve();
        },
      },
    },
    runtime: {
      onMessage: { addListener: (fn) => listeners.push(fn) },
      sendMessage: () => Promise.resolve(),
    },
  };

  // The harness's stand-in for the Safari toolbar button.
  window.__inkoverToggle = () => listeners.forEach((fn) => fn({ type: "inkover:toggle" }));
  window.__inkoverReset = () => {
    for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) localStorage.removeItem(k);
    location.reload();
  };
})();
