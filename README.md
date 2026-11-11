# Learning Management System

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/React_Router-6-CA4245?logo=reactrouter&logoColor=white" alt="React Router 6" />
  <img src="https://img.shields.io/badge/Axios-HTTP_Client-671DDF?logo=axios&logoColor=white" alt="Axios" />
</p>

## Introduction

Learning Management System (LMS) is a web-based learning platform frontend
that brings the learner journey into one place. Learners can discover courses,
review course information and curriculum, add courses to a wishlist or cart,
and continue learning from their enrolled courses.

The application also includes account registration and recovery, wallet
checkout, course reviews, lesson video viewing, and profile management. It is
designed to connect to a separate backend API; this repository contains the
frontend application.

## Features

- Account registration, sign-in, email OTP verification, and password recovery.
- Course catalog with search, filters, curriculum, and reviews.
- Wishlist, shopping cart, and wallet checkout.
- Enrolled course library and lesson video viewing.
- Student profile viewing and editing.

## Technology

- React 18 and Vite 5
- React Router 6
- Axios
- CSS
- ESLint 9

## Project structure

```text
src/
├── api/                 # API client and endpoint functions
├── pages/
│   ├── auth/            # Registration and account recovery
│   ├── courses/         # Course discovery, details, and reviews
│   └── student/         # Learning library, checkout, and profile
├── utils/               # Shared utilities
├── App.jsx              # Application routes
└── main.jsx             # Application entry point
```

## Configuration

The API base URL is configured with `VITE_API_URL` in the `.env` file:

| Variable | Description | Default |
| --- | --- | --- |
| `VITE_API_URL` | Base URL for the backend API | `http://localhost:3200/api` |

Create `.env` from `.env.example` to override the default. Do not commit `.env`
files or credentials.

## Getting started

**Requirements:** Node.js 18 or newer, npm, and a compatible backend API.

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal (usually
`http://localhost:5173`).

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build |
