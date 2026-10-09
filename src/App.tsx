import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  Clock,
  GripVertical,
  History,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react'
import { tarefasApi, type TarefaDaApi } from './services/tasksApi'

export type Category = 'Estudos' | 'Trabalho' | 'Faculdade' | 'Compras' | 'Outros'

const CATEGORIES: Category[] = ['Estudos', 'Trabalho', 'Faculdade', 'Compras', 'Outros']

const CATEGORY_COLORS: Record<Category, string> = {
  Estudos: '#181818',
  Trabalho: '#4b5563',
  Faculdade: '#6b7280',
  Compras: '#9ca3af',
  Outros: '#d1d5db',
}

function resolveCategory(task: TarefaDaApi): Category {
  const raw = (task.lista || '').trim().toLowerCase()
  if (raw === 'estudos' || raw === 'estudo') return 'Estudos'
  if (raw === 'faculdade') return 'Faculdade'
  if (raw === 'compras' || raw === 'compra') return 'Compras'
  if (raw === 'outros') return 'Outros'
  if (raw === 'trabalho' || raw === 'work') {
    const t = task.titulo.toLowerCase()
    if (
      t.includes('estudo') ||
      t.includes('estudos') ||
      t.includes('bíblico') ||
      t.includes('biblico') ||
      t.includes('wsus') ||
      t.includes('livro') ||
      t.includes('curso') ||
      t.includes('ler')
    ) {
      return 'Estudos'
    }
    if (
      t.includes('faculdade') ||
      t.includes('aula') ||
      t.includes('prova') ||
      t.includes('tcc') ||
      t.includes('matéria') ||
      t.includes('materia')
    ) {
      return 'Faculdade'
    }
    if (
      t.includes('compra') ||
      t.includes('compras') ||
      t.includes('mercado') ||
      t.includes('comprar')
    ) {
      return 'Compras'
    }
    return 'Trabalho'
  }
  return 'Trabalho'
}

export function formatTempoRelativo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'recentemente'

  const data = new Date(dateStr)
  if (isNaN(data.getTime())) return 'recentemente'

  const agora = new Date()
  const diffMs = agora.getTime() - data.getTime()

  if (diffMs < 0) return 'hoje'

  const diffSegundos = Math.floor(diffMs / 1000)
  const diffMinutos = Math.floor(diffSegundos / 60)
  const diffHoras = Math.floor(diffMinutos / 60)
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  const mesmoDia =
    agora.getFullYear() === data.getFullYear() &&
    agora.getMonth() === data.getMonth() &&
    agora.getDate() === data.getDate()

  if (mesmoDia) {
    if (diffMinutos < 1) return 'agora há pouco'
    if (diffHoras < 1) return `há ${diffMinutos} min`
    return `hoje (${diffHoras}h atrás)`
  }

  if (diffDias === 1) return 'ontem'
  if (diffDias < 7) return `há ${diffDias} dias`

  const diffSemanas = Math.floor(diffDias / 7)
  if (diffSemanas === 1) return 'há 1 semana'
  if (diffSemanas < 4) return `há ${diffSemanas} semanas`

  const diffMeses = Math.floor(diffDias / 30)
  if (diffMeses <= 1) return 'há 1 mês'
  if (diffMeses < 12) return `há ${diffMeses} meses`

  const diffAnos = Math.floor(diffDias / 365)
  if (diffAnos === 1) return 'há 1 ano'
  return `há ${diffAnos} anos`
}

function isWithinLast12Months(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true
  const data = new Date(dateStr)
  if (isNaN(data.getTime())) return true
  const agora = new Date()
  const diffDias = (agora.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)
  return diffDias <= 366
}

function App() {
  const [tasks, setTasks] = useState<TarefaDaApi[]>([])
  const [view, setView] = useState<'tasks' | 'history'>('tasks')
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<Category>('Trabalho')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [dragged, setDragged] = useState<number | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const locked = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    tarefasApi
      .listar()
      .then((data) => {
        if (active) setTasks(data)
      })
      .catch(() => {
        if (active) setApiError('Não foi possível carregar suas tarefas. Confira se a API está ligada.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const visibleTasks = tasks
    .filter((task) => !task.concluida)
    .sort((a, b) => a.ordem - b.ordem || a.id - b.id)

  const completedTasks = tasks.filter(
    (task) => task.concluida && isWithinLast12Months(task.concluida_em)
  )

  const filteredCompletedTasks = completedTasks.filter((task) => {
    if (selectedCategory === 'Todas') return true
    return resolveCategory(task) === selectedCategory
  })

  // Estatísticas de distribuição da barra de progresso
  const totalCompleted = completedTasks.length
  const distributionStats = CATEGORIES.map((cat) => {
    const count = completedTasks.filter((t) => resolveCategory(t) === cat).length
    const percent = totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0
    return {
      category: cat,
      count,
      percent,
      color: CATEGORY_COLORS[cat],
    }
  }).filter((item) => item.count > 0 || item.category === 'Estudos' || item.category === 'Trabalho')

  const mutate = async (action: () => Promise<void>) => {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setApiError('')
    try {
      await action()
    } catch {
      setApiError('Não foi possível salvar a alteração. Tente novamente.')
    } finally {
      locked.current = false
      setBusy(false)
    }
  }

  const addTask = async () => {
    const title = newTitle.trim()
    if (!title) {
      inputRef.current?.focus()
      return
    }
    await mutate(async () => {
      const task = await tarefasApi.criar({
        titulo: title,
        lista: newCategory.toLowerCase(),
        prioridade: 'none',
      })
      setTasks((current) => [...current, task])
      setNewTitle('')
      setAnnouncement(`Tarefa adicionada em ${newCategory}.`)
    })
    inputRef.current?.focus()
  }

  const completeTask = (id: number) =>
    mutate(async () => {
      const agoraIso = new Date().toISOString()
      const updated = await tarefasApi.atualizar(id, { concluida: true, concluida_em: agoraIso })
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)))
      setAnnouncement('Tarefa concluída e enviada ao histórico.')
      inputRef.current?.focus()
    })

  const uncompleteTask = (id: number) =>
    mutate(async () => {
      const updated = await tarefasApi.atualizar(id, { concluida: false, concluida_em: null })
      setTasks((current) => current.map((task) => (task.id === id ? updated : task)))
      setAnnouncement('Tarefa restaurada para a lista pendente.')
    })

  const deleteTask = (id: number) =>
    mutate(async () => {
      await tarefasApi.excluir(id)
      setTasks((current) => current.filter((task) => task.id !== id))
      setAnnouncement('Tarefa excluída.')
    })

  const saveOrder = (ids: number[]) =>
    mutate(async () => {
      const updated = await tarefasApi.reordenar(ids)
      setTasks(updated)
      setAnnouncement('Ordem salva.')
    })

  const moveTask = (id: number, direction: -1 | 1) => {
    const ids = visibleTasks.map((task) => task.id)
    const index = ids.indexOf(id)
    const neighbor = index + direction
    if (index < 0 || neighbor < 0 || neighbor >= ids.length) return
    ;[ids[index], ids[neighbor]] = [ids[neighbor], ids[index]]
    void saveOrder(ids)
  }

  const dropTask = (targetId: number | null, after = false) => {
    setDropTarget(null)
    setDragged(null)
    if (dragged === null || dragged === targetId || locked.current) return
    const ids = visibleTasks.map((task) => task.id).filter((id) => id !== dragged)
    const index = targetId === null ? ids.length : ids.indexOf(targetId)
    if (index < 0) return
    ids.splice(index + (after && targetId !== null ? 1 : 0), 0, dragged)
    void saveOrder(ids)
  }

  return (
    <main className="app-shell">
      <section className="todo-card" aria-labelledby="list-title">
        <header className="card-header">
          <div className="header-top">
            <span className="card-mark" aria-hidden="true">
              {view === 'tasks' ? (
                <Check size={22} strokeWidth={2} />
              ) : (
                <History size={22} strokeWidth={2} />
              )}
            </span>
            <h1 id="list-title">{view === 'tasks' ? 'To do list' : 'Histórico'}</h1>
          </div>

          <nav className="nav-tabs" aria-label="Navegação entre tarefas e histórico">
            <button
              type="button"
              className={`nav-tab ${view === 'tasks' ? 'active' : ''}`}
              onClick={() => setView('tasks')}
            >
              <Check size={14} />
              Tarefas ({visibleTasks.length})
            </button>
            <button
              type="button"
              className={`nav-tab ${view === 'history' ? 'active' : ''}`}
              onClick={() => setView('history')}
            >
              <History size={14} />
              Histórico ({completedTasks.length})
            </button>
          </nav>
        </header>

        {apiError && (
          <p className="api-error" role="alert">
            {apiError}
          </p>
        )}
        <span className="sr-only" role="status">
          {announcement}
        </span>

        {view === 'tasks' ? (
          <section
            className="task-list"
            aria-label="Tarefas pendentes"
            aria-busy={loading || busy}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              dropTask(null)
            }}
          >
            {loading && <p className="empty-state">Carregando tarefas…</p>}
            {!loading && visibleTasks.length === 0 && !apiError && (
              <p className="empty-state">
                Tudo em dia.<br />
                <span>Adicione sua próxima tarefa abaixo.</span>
              </p>
            )}

            {visibleTasks.map((task, index) => {
              const category = resolveCategory(task)
              return (
                <article
                  className={`task-row ${dragged === task.id ? 'dragging' : ''} ${dropTarget === task.id ? 'drop-target' : ''}`}
                  key={task.id}
                  draggable={!busy}
                  onDragStart={(event) => {
                    setDragged(task.id)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('text/plain', String(task.id))
                  }}
                  onDragEnd={() => {
                    setDragged(null)
                    setDropTarget(null)
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    event.dataTransfer.dropEffect = 'move'
                    setDropTarget(task.id)
                  }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    const bounds = event.currentTarget.getBoundingClientRect()
                    dropTask(task.id, event.clientY > bounds.top + bounds.height / 2)
                  }}
                >
                  <span className="drag-handle" title="Arrastar tarefa" aria-hidden="true">
                    <GripVertical size={16} />
                  </span>
                  <button
                    type="button"
                    className="complete-button"
                    aria-label={`Concluir: ${task.titulo}`}
                    title="Concluir tarefa"
                    disabled={busy}
                    onClick={() => void completeTask(task.id)}
                  >
                    <Check size={15} />
                  </button>
                  <div className="task-content">
                    <span className="task-title">{task.titulo}</span>
                    <span className="tag-badge">{category}</span>
                  </div>
                  <span className="task-actions">
                    <button
                      type="button"
                      aria-label={`Subir: ${task.titulo}`}
                      title="Subir tarefa"
                      disabled={busy || index === 0}
                      onClick={() => moveTask(task.id, -1)}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Descer: ${task.titulo}`}
                      title="Descer tarefa"
                      disabled={busy || index === visibleTasks.length - 1}
                      onClick={() => moveTask(task.id, 1)}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir: ${task.titulo}`}
                      title="Excluir tarefa"
                      disabled={busy}
                      onClick={() => void deleteTask(task.id)}
                    >
                      <X size={17} />
                    </button>
                  </span>
                </article>
              )
            })}

            <div className="add-section">
              <div className="add-category-row">
                <span className="add-cat-label">Categoria:</span>
                {(['Trabalho', 'Estudos', 'Faculdade', 'Compras'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`add-cat-btn ${newCategory === cat ? 'active' : ''}`}
                    onClick={() => setNewCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <form
                className="inline-add"
                onSubmit={(event) => {
                  event.preventDefault()
                  void addTask()
                }}
              >
                <Plus className="add-mark" size={21} aria-hidden="true" />
                <input
                  ref={inputRef}
                  aria-label="Nova tarefa"
                  placeholder={`Nova tarefa em ${newCategory}…`}
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  readOnly={busy}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  aria-label="Adicionar tarefa"
                  title="Adicionar tarefa"
                  disabled={busy || loading || !newTitle.trim()}
                >
                  <Plus size={20} />
                </button>
              </form>
            </div>
          </section>
        ) : (
          <section className="history-container" aria-label="Histórico de tarefas concluídas">
            <div className="history-period-banner">
              <Calendar size={13} />
              <span>Concluídas nos últimos 12 meses</span>
            </div>

            {/* Barra de progresso / distribuição de foco */}
            <div className="distribution-card">
              <div className="distribution-header">
                <span>Tempo & Dedicação por Categoria</span>
                <span>
                  {totalCompleted} {totalCompleted === 1 ? 'concluída' : 'concluídas'}
                </span>
              </div>

              <div
                className="distribution-bar"
                role="progressbar"
                aria-label="Distribuição de tarefas concluídas por categoria"
              >
                {distributionStats.map(
                  (item) =>
                    item.percent > 0 && (
                      <div
                        key={item.category}
                        className="distribution-segment"
                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                        title={`${item.category}: ${item.percent}% (${item.count} tarefas)`}
                      />
                    )
                )}
              </div>

              <div className="distribution-chips">
                {distributionStats.map((item) => (
                  <button
                    key={item.category}
                    type="button"
                    className={`stat-chip ${selectedCategory === item.category ? 'active' : ''}`}
                    onClick={() =>
                      setSelectedCategory(
                        selectedCategory === item.category ? 'Todas' : item.category
                      )
                    }
                  >
                    <span className="stat-dot" style={{ backgroundColor: item.color }} />
                    <span>{item.category}</span>
                    <strong>{item.percent}%</strong>
                    <span>({item.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros por Categoria */}
            <div className="history-filters" role="tablist" aria-label="Filtro de categoria">
              {(['Todas', 'Estudos', 'Trabalho', 'Faculdade', 'Compras'] as const).map((cat) => {
                const count =
                  cat === 'Todas'
                    ? completedTasks.length
                    : completedTasks.filter((t) => resolveCategory(t) === cat).length
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat}
                    className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                    <span className="filter-count">({count})</span>
                  </button>
                )
              })}
            </div>

            {/* Lista de tarefas concluídas */}
            <div className="completed-list">
              {filteredCompletedTasks.length === 0 ? (
                <p className="empty-state">
                  Nenhuma tarefa encontrada em {selectedCategory === 'Todas' ? 'nenhuma categoria' : selectedCategory} nos últimos 12 meses.
                </p>
              ) : (
                filteredCompletedTasks.map((task) => {
                  const cat = resolveCategory(task)
                  const tempoRelativo = formatTempoRelativo(task.concluida_em)
                  const dataFormatada = task.concluida_em
                    ? new Date(task.concluida_em).toLocaleDateString('pt-BR')
                    : ''
                  return (
                    <article key={task.id} className="completed-row">
                      <span className="completed-mark" title="Concluída">
                        <Check size={13} strokeWidth={2.5} />
                      </span>
                      <div className="completed-details">
                        <span className="completed-title">{task.titulo}</span>
                        <div className="completed-meta">
                          <span className="tag-badge">{cat}</span>
                          <span className="completed-period" title={dataFormatada}>
                            <Clock size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                            {tempoRelativo}
                          </span>
                        </div>
                      </div>
                      <div className="completed-actions">
                        <button
                          type="button"
                          aria-label={`Restaurar: ${task.titulo}`}
                          title="Restaurar para pendentes"
                          disabled={busy}
                          onClick={() => void uncompleteTask(task.id)}
                        >
                          <RotateCcw size={15} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Excluir: ${task.titulo}`}
                          title="Excluir tarefa"
                          disabled={busy}
                          onClick={() => void deleteTask(task.id)}
                        >
                          <X size={17} />
                        </button>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        )}

        <footer>
          Desenvolvido por <strong>Amanda Reis</strong>
        </footer>
      </section>
    </main>
  )
}

export default App
