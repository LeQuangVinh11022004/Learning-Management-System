# Contributing

Thank you for helping improve this project. Contributions, bug reports, and
clear suggestions are welcome.

## Before you start

- For significant changes, open an issue first to discuss the proposed approach.
- Check existing issues and pull requests to avoid duplicate work.
- Be respectful and follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Development setup

1. Install Node.js 18 or newer and npm.
2. Clone the repository and install dependencies:

   ```sh
   npm install
   ```

3. Configure `VITE_API_URL` in a local `.env` file if your backend does not use
   the default `http://localhost:3200/api`.
4. Start the frontend:

   ```sh
   npm run dev
   ```

## Making a change

- Keep changes focused and consistent with the existing React and CSS patterns.
- Do not include credentials, personal `.env` files, or unrelated generated
  files.
- Update the README or other documentation when behavior or setup changes.
- Add or update tests when the project has relevant test coverage.
- Run the checks before submitting:

  ```sh
  npm run lint
  npm run build
  ```

## Pull requests

- Use a clear title and explain the problem and solution.
- Include steps to verify the change; add screenshots for meaningful UI changes.
- Mention any known limitations or backend requirements.
- Confirm that lint and build checks pass.

