import { neon } from '@neondatabase/serverless';

// Vercel adiciona automaticamente a variável STORAGE_URL quando crias a base de dados
const sql = neon(process.env.STORAGE_URL!);

export { sql };
