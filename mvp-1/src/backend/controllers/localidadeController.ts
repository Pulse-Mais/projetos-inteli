import { Request, Response } from 'express';
import { asyncHandler } from '../helpers/asyncHandler';

const ESTADOS = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];

const ESTAGIOS = [
  { value: 'conectado',    label: 'Conectado' },
  { value: 'capacitado',   label: 'Capacitado' },
  { value: 'transformado', label: 'Transformado' },
];

export const listarEstados = asyncHandler(async (_req: Request, res: Response) => {
  res.json(ESTADOS);
});

export const listarEslagios = asyncHandler(async (_req: Request, res: Response) => {
  res.json(ESTAGIOS);
});

export const listarCidades = asyncHandler(async (req: Request, res: Response) => {
  const uf = String(req.params.uf || '').toUpperCase();

  const estadoValido = ESTADOS.some((e) => e.uf === uf);
  if (!estadoValido) {
    res.status(400).json({ error: 'UF inválida' });
    return;
  }

  const resp = await fetch(
    `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
  );

  if (!resp.ok) {
    res.status(502).json({ error: 'Erro ao consultar IBGE' });
    return;
  }

  const data = (await resp.json()) as { nome: string }[];
  res.json(data.map((m) => m.nome));
});
