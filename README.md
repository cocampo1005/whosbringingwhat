# Who's Bringing What 🍗🥗🥧

**Who's Bringing What** is a web application designed to help families and friends effortlessly organize potluck events. With features like event creation, item tracking, and dietary considerations, this app ensures no dish gets forgotten, and everyone’s needs are considered.

---

## Deployed URL

Try out the deployed app [here](https://whos-bringing-what.web.app/).

---

## Features 🚀

- **User Authentication**  
  Sign up and log in using Firebase Authentication for a secure and personalized experience.

- **Event Management**  
  Create, update, and delete potluck events with ease.

- **Item Tracking**  
  Manage items for each event, assign contributors, and avoid duplicate dishes.

- **Dietary and Allergy Tracking**  
  Track dietary restrictions and allergies to ensure all attendees are accommodated.

- **Responsive Design**  
  A clean and intuitive user interface built with Tailwind CSS, optimized for all devices.

---

## Tech Stack 💻

- **Frontend**: React.js
- **Backend**: Firebase (Authentication, Firestore, and Hosting)
- **Styling**: Tailwind CSS

---

## Getting Started 🛠️

### Prerequisites

Make sure you have the following installed on your machine:

- [nvm](https://github.com/nvm-sh/nvm)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/cocampo1005/whosbringingwhat.git
   ```
   ```bash
   cd whosbringingwhat
   ```
   ```bash
   nvm use
   ```
   Using `nvm`, will ensure the proper Node version is used
2. Install Dependencies:
   ```bash
   npm install
   ```
   or
   ```bash
   yarn install
   ```
3. Running / Development
   ```bash
   npm run dev
   ```
   or
   ```bash
   npx vite
   ```

## Development notes (federated build)

- **Node version**: this branch pins Node 22. Run `nvm use` before installing or running
  anything so you pick up the right version.
- **Routing**: the app uses TanStack Router with a `basepath` (see `src/router.jsx`). Every
  `to` you write must be root-relative — never hardcode a leading path like `/projects/wbw/...`;
  the router prepends the basepath for you.
- **Module Federation remote**: the app is also exposed as the Module Federation remote `wbw`,
  publishing `./app` for the portfolio to consume at
  `https://www.jsrodriguez.dev/projects/wbw`. See `src/federation/export-app.jsx` and
  `vite.config.js` for the wiring.
- **Style scoping**: every stylesheet rule is scoped under `.wbw` at build time (see
  `postcss.config.js`). Do not write rules that target `html`, `body`, or `*` — they will not
  reach the real page when this app is mounted as a remote. Also do not put utility classes on
  the element that carries the `wbw` class itself; `src/App.jsx` shows the split between the
  `.wbw` wrapper and the element that carries layout classes. The only sanctioned exception is
  `index.html`'s inline `<style>` page reset, which is kept unprefixed by the `ignoreFiles` entry
  in `postcss.config.js` — do not remove that entry.
- **Assets**: always `import` assets (images, SVGs, etc.) rather than referencing them by a
  `/src/...` string path — string paths are not resolved/bundled by Vite the same way and will
  break under federation.
- **Production `base`**: the production `base` is set to the Firebase hosting origin, so
  running `npm run preview` or the Firebase emulator loads its built assets from the live site,
  not from your local server.
- **`randomPotluckImage`**: this Cloud Function is called by its absolute URL (see
  `src/constants/api.js`) rather than a relative path, so it resolves correctly regardless of
  which origin the app is served from.
- **Version**: the package version became `1.0.0` as part of this branch.
- **Tests already failing on `main`**: the following unit tests were failing before this branch
  and are unrelated to the federated-remote work — please don't pin them on this branch:
  EventModal, ImageUpload, `events.rules` (×2), CategoryList (×2), ItemSidePanel (×2).

## Acknowledgments 💡

This project was built using the following technologies:

- [React.js](https://reactjs.org/) – A JavaScript library for building user interfaces.
- [Firebase](https://firebase.google.com/) – A comprehensive app development platform.
- [Tailwind CSS](https://tailwindcss.com/) – A utility-first CSS framework for rapid UI development.
