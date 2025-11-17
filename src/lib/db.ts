import { neon } from '@neondatabase/serverless';

// Usar a variável de ambiente criada pelo Neon
const sql = neon(process.env.POSTGRES_URL!);

export { sql };
