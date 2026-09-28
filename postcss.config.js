import { fileURLToPath } from 'node:url';

// Resolve the Tailwind config next to this file so builds work from any working directory.
const config = fileURLToPath(new URL('./tailwind.config.js', import.meta.url));

export default { plugins: { tailwindcss: { config }, autoprefixer: {} } };
