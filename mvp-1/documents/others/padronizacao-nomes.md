# Padronizacao de nomes - Pulse Mais G01

Este documento define as convencoes de nomes para variaveis, funcoes, arquivos, tabelas, colunas e demais estruturas do projeto. O objetivo e manter o codigo previsivel, facil de ler e consistente entre todos os integrantes.

---

## 1. Regras gerais

- Use nomes claros e descritivos.
- Evite abreviacoes que nao sejam obvias.
- Mantenha o idioma em portugues quando o nome representar regra de negocio do projeto.
- Use ingles apenas em termos tecnicos ja consolidados no codigo, como `create`, `findAll`, `findById`, `error`, `request` e `response`.
- Nao misture estilos no mesmo tipo de item. Se tabelas estao em `snake_case`, todas devem seguir `snake_case`.
- Prefira nomes no singular para entidades principais: `usuario`, `aluno`, `programa`.

---

## 2. Variaveis e constantes em TypeScript

### Variaveis locais

Use `camelCase`.

```typescript
const idUsuario = Number(req.params.id);
const usuarioEncontrado = await usuarioRepository.findById(idUsuario);
const dataIngresso = req.body.dataIngresso;
```

### Constantes fixas

Use `UPPER_SNAKE_CASE` quando o valor representar uma configuracao fixa ou regra global.

```typescript
const LIMITE_TENTATIVAS_LOGIN = 3;
const STATUS_PADRAO_ALUNO = true;
```

Para constantes comuns de escopo pequeno, `camelCase` tambem e aceito.

```typescript
const usuario = await usuarioService.buscarPorId(idUsuario);
```

### Booleanos

Prefira nomes que indiquem verdadeiro ou falso.

```typescript
const isAtivo = aluno.ativo;
const temMentor = aluno.id_mentor !== null;
const podeEditar = usuarioLogado.tipo === 'coordenador';
```

---

## 3. Funcoes e metodos

Use `camelCase` e verbo no inicio do nome.

```typescript
function validarEmail(email: string) {}
function criarUsuario(data: CreateUsuarioData) {}
function buscarAlunoPorId(idUsuario: number) {}
```

Nos repositories, manter o padrao ja usado no projeto:

```typescript
findAll()
findById(id)
findByEmail(email)
create(data)
update(id, data)
remove(id)
```

Quando a funcao fizer uma consulta especifica, use `findBy` seguido do campo:

```typescript
findByCpf(cpf)
findByPrograma(idPrograma)
findByAluno(idAluno)
```

---

## 4. Interfaces e tipos

Use `PascalCase`.

```typescript
export interface Usuario {}
export interface CreateUsuarioData {}
export interface UpdateAlunoData {}
```

Padroes recomendados:

- `Entidade`: representa um registro completo vindo do banco.
- `CreateEntidadeData`: dados necessarios para criar um registro.
- `UpdateEntidadeData`: dados permitidos para atualizar um registro.
- `EntidadeResponse`: formato retornado pela API quando for diferente do banco.

Exemplos:

```typescript
export interface Programa {}
export interface CreateProgramaData {}
export interface UpdateProgramaData {}
export interface ProgramaResponse {}
```

---

## 5. Arquivos e pastas

### Pastas

Use plural em minusculo para separar responsabilidades.

```text
controllers/
services/
repositories/
routes/
middlewares/
helpers/
errors/
```

### Arquivos TypeScript

Use o nome da entidade em `camelCase` + a responsabilidade do arquivo.

```text
usuarioController.ts
usuarioService.ts
usuarioRepository.ts
usuarioRoutes.ts
```

Para entidades com nome composto, mantenha `camelCase`.

```text
historicoProfissionalRepository.ts
anotacaoPrivadaService.ts
participaEventoRoutes.ts
```

---

## 6. Rotas da API

Use nomes no plural, em minusculo e com hifen quando necessario.

```text
/usuarios
/alunos
/programas
/historicos-profissionais
/anotacoes-privadas
```

Parametros de rota devem usar `camelCase`.

```text
/usuarios/:idUsuario
/programas/:idPrograma/alunos
```

Evite verbos na URL. O verbo deve estar no metodo HTTP.

```text
GET    /usuarios
GET    /usuarios/:idUsuario
POST   /usuarios
PUT    /usuarios/:idUsuario
DELETE /usuarios/:idUsuario
```

---

## 7. Tabelas do banco de dados

Use `snake_case`, minusculo e singular.

```sql
usuario
programa
indicador
atividade
historico_profissional
anotacao_privada
```

Tabelas associativas tambem devem usar `snake_case`. Quando possivel, o nome deve indicar a relacao ou acao representada.

```sql
matricula
gerencia
participa_evento
participa_mentoria
realiza_entrega
```

Evite:

```sql
Usuarios
tb_usuario
usuario_programa_table
```

---

## 8. Colunas do banco de dados

Use `snake_case`, minusculo e nomes descritivos.

```sql
id_usuario
nome
email
data_inicio
data_fim
id_programa
status_conclusao
```

### Chaves primarias

Para entidades principais, use:

```sql
id_nome_da_tabela
```

Exemplos:

```sql
id_usuario
id_programa
id_evento
id_mentoria
```

### Chaves estrangeiras

Use o mesmo nome da chave primaria referenciada sempre que possivel.

```sql
id_usuario
id_aluno
id_mentor
id_programa
```

Quando a coluna representar um papel especifico, o nome pode indicar esse papel.

```sql
id_coordenador
id_aluno
```

### Datas

Use prefixos claros:

```sql
data_inicio
data_fim
data_ingresso
data_entrega
data_registro
```

Use `data` apenas quando a tabela tiver uma unica data principal, como em `evento` ou `mentoria`.

### Campos booleanos

Use nomes afirmativos.

```sql
ativo
presenca
```

Evite nomes negativos:

```sql
nao_ativo
sem_presenca
```

---

## 9. Constraints e indices

### Primary key

Quando a chave primaria for simples, pode ser declarada direto na coluna.

```sql
id_usuario SERIAL PRIMARY KEY
```

Quando for composta, declare ao final da tabela.

```sql
PRIMARY KEY (id_programa, id_aluno)
```

### Foreign keys

Use o formato:

```text
fk_tabela_coluna
```

Exemplos:

```sql
fk_aluno_usuario
fk_mentor_coordenador
fk_matricula_programa
```

### Unique constraints

Use o formato:

```text
uq_tabela_coluna
```

Exemplos:

```sql
uq_usuario_email
uq_usuario_cpf
```

### Check constraints

Use o formato:

```text
chk_tabela_regra
```

Exemplos:

```sql
chk_programa_periodo
chk_avaliacao_nota
```

### Indices

Use o formato:

```text
idx_tabela_coluna
```

Exemplos:

```sql
idx_usuario_email
idx_aluno_ativo
idx_matricula_id_aluno
```

---

## 10. Padrao entre banco e TypeScript

No banco de dados, use `snake_case`.

```sql
id_usuario
data_ingresso
status_conclusao
```

No TypeScript, use `camelCase` para variaveis e parametros.

```typescript
const idUsuario = req.params.idUsuario;
const dataIngresso = req.body.dataIngresso;
const statusConclusao = req.body.statusConclusao;
```

Nas interfaces que representam diretamente uma tabela do banco, e aceitavel manter os campos em `snake_case` para refletir o retorno do Supabase.

```typescript
export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  senha: string;
  cpf: string;
}
```

Quando a API expor dados para o front-end, prefira converter para `camelCase`.

```typescript
export interface UsuarioResponse {
  idUsuario: number;
  nome: string;
  email: string;
}
```

---

## 11. Commits, branches e pull requests

### Branches

Use nomes curtos, em minusculo e com hifen.

```text
feature/cadastro-usuario
fix/validacao-email
docs/padronizacao-nomes
```

### Commits

Use mensagens objetivas, no imperativo ou em formato convencional.

```text
docs: adiciona guia de padronizacao de nomes
feat: cria rota de usuarios
fix: corrige validacao de cpf
test: adiciona testes de aluno
```

---

## 12. Checklist antes de criar novo codigo

- O nome esta no idioma e no estilo correto?
- O arquivo segue o padrao `entidadeResponsabilidade.ts`?
- A tabela esta em `snake_case`, singular e minuscula?
- As colunas do banco estao em `snake_case`?
- As variaveis TypeScript estao em `camelCase`?
- Interfaces e classes estao em `PascalCase`?
- Constraints e indices seguem os prefixos `fk_`, `uq_`, `chk_` e `idx_`?
- A rota usa plural, minusculo e sem verbo?
- O nome escolhido deixa claro o papel da informacao?

