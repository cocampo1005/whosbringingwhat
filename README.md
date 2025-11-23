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
3. Configure Firebase Functions (Optional - only needed if working with Cloud Functions):
   
   If you're working with the Firebase Cloud Functions (e.g., image upload features), you need to configure environment variables:
   
   ```bash
   cd functions
   cp .env.example .env
   # Edit .env and add your API keys
   ```
   
   See [`functions/README.md`](functions/README.md) for detailed setup instructions including how to obtain API keys.

4. Running / Development
   ```bash
   npm run dev
   ```
   or
   ```bash
   npx vite
   ```

## Acknowledgments 💡

This project was built using the following technologies:

- [React.js](https://reactjs.org/) – A JavaScript library for building user interfaces.
- [Firebase](https://firebase.google.com/) – A comprehensive app development platform.
- [Tailwind CSS](https://tailwindcss.com/) – A utility-first CSS framework for rapid UI development.
