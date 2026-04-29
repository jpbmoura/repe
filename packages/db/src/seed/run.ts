import '../load-env.js';
import { db, queryClient } from '../client.js';
import { exercicios } from '../schema/exercicios.js';
import { exerciciosSeed } from './exercicios.js';

await db.insert(exercicios).values(exerciciosSeed).onConflictDoNothing();

console.log(`Seeded ${exerciciosSeed.length} exercícios.`);
await queryClient.end();
process.exit(0);
