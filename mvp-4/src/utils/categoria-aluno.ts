const CATEGORIAS_JOVEM = [
  'Jovens Conectados',
  'Jovens Capacitados',
  'Jovens Transformados',
] as const;

function normalizarTexto(valor?: string | null): string {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function categoriaEhValida(categoria?: string | null): boolean {
  const categoriaNormalizada = normalizarTexto(categoria);

  return [
    'jovens conectados',
    'jovens capacitados',
    'jovens transformados',
    'conectado',
    'capacitado',
    'transformado',
  ].includes(categoriaNormalizada);
}

export function preencherCategoriaAluno<T extends { ra: number; categoria?: string | null }>(aluno: T): T {
  const categoriaAtual = String(aluno.categoria || '').trim();

  if (categoriaAtual && categoriaEhValida(categoriaAtual)) {
    return aluno;
  }

  const indiceCategoria = Math.abs(Number(aluno.ra) || 0) % CATEGORIAS_JOVEM.length;

  return {
    ...aluno,
    categoria: CATEGORIAS_JOVEM[indiceCategoria],
  };
}
