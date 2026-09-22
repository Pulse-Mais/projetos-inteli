import dotenv from "dotenv";
import path from "path";

// Carrega as credenciais reais ANTES de qualquer placeholder. A ordem importa:
// dotenv NUNCA sobrescreve uma variavel ja definida em process.env, entao o
// primeiro arquivo a definir uma var "ganha". Carregamos primeiro o .env.test
// (config explicita de teste, se existir) e depois o .env (credenciais do
// projeto), garantindo que os testes de integracao usem o Supabase real.
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Fixar timezone em UTC para garantir determinismo de relogio nos testes
process.env.TZ = "UTC";

// Apenas como ultimo recurso (ambiente sem .env, ex.: CI de testes unitarios),
// preenche placeholders para que modulos que carregam o supabaseClient
// (src/db/supabaseClient.ts) nao quebrem ja na importacao por falta de
// credenciais. Estes valores NAO conectam de verdade — testes unitarios devem
// mockar o supabaseClient via jest.mock(...). Como sao definidos depois do
// dotenv acima, nunca sobrescrevem credenciais reais quando o .env existe.
if (!process.env.SUPABASE_URL) { 
  process.env.SUPABASE_URL = "http://localhost:54321";
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
}
if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = "test-anon-key";
}
