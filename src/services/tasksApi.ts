export type Priority = 'none' | 'yellow' | 'red'

export type TarefaDaApi = {
  id: number
  titulo: string
  lista: string
  prioridade: Priority
  concluida: boolean
  ordem: number
  concluida_em?: string | null
}

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'http://127.0.0.1:8000'

async function pedido<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opcoes,
  })

  if (!resposta.ok) throw new Error('Não foi possível conversar com a API Python.')
  return resposta.json() as Promise<T>
}

export const tarefasApi = {
  reordenar: (ids: number[]) =>
    pedido<TarefaDaApi[]>('/tarefas/ordem', { method: 'PUT', body: JSON.stringify({ ids }) }),
  listar: () => pedido<TarefaDaApi[]>('/tarefas'),
  criar: (dados: Pick<TarefaDaApi, 'titulo' | 'lista' | 'prioridade'> & { concluida_em?: string | null }) =>
    pedido<TarefaDaApi>('/tarefas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: number, dados: Partial<Omit<TarefaDaApi, 'id'>>) =>
    pedido<TarefaDaApi>(`/tarefas/${id}`, { method: 'PATCH', body: JSON.stringify(dados) }),
  excluir: (id: number) => pedido<{ ok: boolean }>(`/tarefas/${id}`, { method: 'DELETE' }),
}
