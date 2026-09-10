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
        const rootScoped = selector.match(/^(html|body)\s+(.*)$/);
        if (rootScoped) {
          return `${prefix} ${rootScoped[2]}`;
        }
        return prefixedSelector;
      },
    }),
  ],
};
