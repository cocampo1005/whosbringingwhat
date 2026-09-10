import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import prefixSelector from "postcss-prefix-selector";

// Every rule — Tailwind's preflight, the @layer base element rules, Calendar.css — is scoped
// under the app's root element, so nothing restyles a host page that mounts the app, and the
// host's resets cannot reach past the wrapper's own rules.
export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
    prefixSelector({
      prefix: ".wbw",
      // Vite extracts index.html's inline <style> block into its own virtual CSS module
      // (its source file is reported as "index.html?html-proxy&inline-css&index=0.css") and
      // runs it through this same PostCSS pipeline. That block is the standalone-only page
      // reset (see index.html) and must keep its literal html/body selectors, so it is the one
      // file this plugin must never touch.
      ignoreFiles: [/\.html\?html-proxy/],
      transform(prefix, selector, prefixedSelector) {
        if (
          selector === "html" ||
          selector === "body" ||
          selector === ":root"
        ) {
          return prefix;
        }
        if (selector === "*") {
          return `${prefix}, ${prefix} *`;
        }
        if (/^html\s+body$/.test(selector)) {
          return prefix;
        }
        const rootScoped = selector.match(/^(html|body)\s+(.*)$/);
        if (rootScoped) {
          return `${prefix} ${rootScoped[2]}`;
        }
        return prefixedSelector;
      },
    }),
  ],
};
