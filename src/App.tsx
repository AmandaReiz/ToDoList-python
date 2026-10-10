import { useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  GripVertical,
  History,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react'
import { tarefasApi, type TarefaDaApi } from './services/tasksApi'

export type Category = string

const DEFAULT_CATEGORIES: string[] = ['Trabalho', 'Estudos', 'Faculdade', 'Compras', 'Outros']

const CATEGORY_COLORS: Record<string, string> = {
  Estudos: '#181818',
  Trabalho: '#4b5563',
  Faculdade: '#6b7280',
  Compras: '#9ca3af',
  Outros: '#d1d5db',
}

const COLOR_PALETTE = [
  '#181818',
  '#4b5563',
  '#6b7280',
  '#9ca3af',
  '#2563eb',
  '#059669',
  '#d97706',
  '#7c3aed',
  '#db2777',
]

function getCategoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category]
  let hash = 0
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}

function resolveCategory(task: TarefaDaApi, availableCategories: string[]): string {
  const raw = (task.lista || '').trim()
  if (!raw) return availableCategories[0] || 'Trabalho'
  const match = availableCategories.find((c) => c.toLowerCase() === raw.toLowerCase())
  if (match) return match
  return raw.charAt(0).toUpperCase() + raw.slice(1)
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
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('todolist_categories')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_CATEGORIES
  })
  const [isManagingCategories, setIsManagingCategories] = useState(false)
  const [view, setView] = useState<'tasks' | 'history'>('tasks')
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState<string>('Trabalho')
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
        if (active) {
          setTasks(data)
          setCategories((current) => {
            const extra = data
              .map((t) => (t.lista || '').trim())
              .filter(Boolean)
              .map((l) => l.charAt(0).toUpperCase() + l.slice(1))
            const merged = Array.from(new Set([...current, ...extra]))
            return merged
          })
        }
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
    return resolveCategory(task, categories) === selectedCategory
  })

  // Estatísticas de distribuição da barra de progresso
  const totalCompleted = completedTasks.length
  const distributionStats = categories
    .map((cat) => {
      const count = completedTasks.filter((t) => resolveCategory(t, categories) === cat).length
      const percent = totalCompleted > 0 ? Math.round((count / totalCompleted) * 100) : 0
      return {
        category: cat,
        count,
        percent,
        color: getCategoryColor(cat),
      }
    })
    .filter((item) => item.count > 0 || item.category === categories[0] || item.category === categories[1])

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

  const changeTaskCategory = (taskId: number, newCat: string) => {
    void mutate(async () => {
      const updated = await tarefasApi.atualizar(taskId, { lista: newCat.toLowerCase() })
      setTasks((current) => current.map((t) => (t.id === taskId ? updated : t)))
      setAnnouncement(`Categoria alterada para ${newCat}.`)
    })
  }

  const handleAddNewCategory = () => {
    const name = window.prompt('Digite o nome da nova categoria:')?.trim()
    if (!name) return
    const formatted = name.charAt(0).toUpperCase() + name.slice(1)
    if (!categories.includes(formatted)) {
      const updated = [...categories, formatted]
      setCategories(updated)
      try {
        localStorage.setItem('todolist_categories', JSON.stringify(updated))
      } catch {}
    }
    setNewCategory(formatted)
    setAnnouncement(`Categoria "${formatted}" criada.`)
  }

  const handleRenameCategory = (oldCat: string) => {
    const name = window.prompt(`Renomear categoria "${oldCat}" para:`, oldCat)?.trim()
    if (!name || name === oldCat) return
    const formatted = name.charAt(0).toUpperCase() + name.slice(1)
    const updated = categories.map((c) => (c === oldCat ? formatted : c))
    setCategories(updated)
    try {
      localStorage.setItem('todolist_categories', JSON.stringify(updated))
    } catch {}

    if (newCategory === oldCat) setNewCategory(formatted)
    if (selectedCategory === oldCat) setSelectedCategory(formatted)

    void mutate(async () => {
      const tasksToUpdate = tasks.filter(
        (t) => resolveCategory(t, categories).toLowerCase() === oldCat.toLowerCase()
      )
      const updatedTasks = await Promise.all(
        tasksToUpdate.map((t) => tarefasApi.atualizar(t.id, { lista: formatted.toLowerCase() }))
      )
      const updatedMap = new Map(updatedTasks.map((t) => [t.id, t]))
      setTasks((current) => current.map((t) => updatedMap.get(t.id) || t))
      setAnnouncement(`Categoria renomeada para "${formatted}".`)
    })
  }

  const handleDeleteCategory = (catToDelete: string) => {
    if (categories.length <= 1) return
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${catToDelete}"?`)) return
    const updated = categories.filter((c) => c !== catToDelete)
    setCategories(updated)
    try {
      localStorage.setItem('todolist_categories', JSON.stringify(updated))
    } catch {}

    const fallback = updated[0]
    if (newCategory === catToDelete) setNewCategory(fallback)
    if (selectedCategory === catToDelete) setSelectedCategory('Todas')

    void mutate(async () => {
      const tasksToUpdate = tasks.filter(
        (t) => resolveCategory(t, categories).toLowerCase() === catToDelete.toLowerCase()
      )
      if (tasksToUpdate.length > 0) {
        const updatedTasks = await Promise.all(
          tasksToUpdate.map((t) => tarefasApi.atualizar(t.id, { lista: fallback.toLowerCase() }))
        )
        const updatedMap = new Map(updatedTasks.map((t) => [t.id, t]))
        setTasks((current) => current.map((t) => updatedMap.get(t.id) || t))
      }
      setAnnouncement(`Categoria "${catToDelete}" excluída.`)
    })
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
              const category = resolveCategory(task, categories)
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
                    <div className="tag-badge-wrapper">
                      <select
                        className="tag-badge-select"
                        value={category}
                        aria-label={`Alterar categoria da tarefa ${task.titulo}`}
                        title="Clique para alterar a categoria"
                        disabled={busy}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '__ADD_NEW__') {
                            const nova = window.prompt('Digite o nome da nova categoria:')?.trim()
                            if (nova) {
                              const formatada = nova.charAt(0).toUpperCase() + nova.slice(1)
                              if (!categories.includes(formatada)) {
                                const upd = [...categories, formatada]
                                setCategories(upd)
                                try {
                                  localStorage.setItem('todolist_categories', JSON.stringify(upd))
                                } catch {}
                              }
                              changeTaskCategory(task.id, formatada)
                            }
                          } else {
                            changeTaskCategory(task.id, val)
                          }
                        }}
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                        <option value="__ADD_NEW__">+ Nova categoria...</option>
                      </select>
                      <ChevronDown size={10} className="tag-badge-arrow" aria-hidden="true" />
                    </div>
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
                {categories.map((cat) => (
                  <div key={cat} className="cat-chip-container">
                    <button
                      type="button"
                      className={`add-cat-btn ${newCategory === cat ? 'active' : ''}`}
                      onClick={() => setNewCategory(cat)}
                    >
                      {cat}
                    </button>
                    {isManagingCategories && (
                      <div className="cat-manage-actions">
                        <button
                          type="button"
                          className="cat-edit-btn"
                          title={`Renomear categoria ${cat}`}
                          onClick={() => handleRenameCategory(cat)}
                        >
                          <Pencil size={11} />
                        </button>
                        {categories.length > 1 && (
                          <button
                            type="button"
                            className="cat-delete-btn"
                            title={`Excluir categoria ${cat}`}
                            onClick={() => handleDeleteCategory(cat)}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="add-cat-new-btn"
                  title="Adicionar nova categoria"
                  onClick={handleAddNewCategory}
                >
                  <Plus size={13} />
                  <span>Nova</span>
                </button>

                <button
                  type="button"
                  className={`add-cat-manage-toggle ${isManagingCategories ? 'active' : ''}`}
                  title={isManagingCategories ? 'Concluir edição de categorias' : 'Editar categorias'}
                  onClick={() => setIsManagingCategories(!isManagingCategories)}
                >
                  <Pencil size={12} />
                </button>
              </div>

              <form
                className="inline-add"
                onSubmit={(event) => {
                  event.preventDefault()
                  void addTask()
                }}
              >
                <input
                  ref={inputRef}
                  aria-label="Nova tarefa"
                  placeholder="Nova tarefa"
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
              {(['Todas', ...categories] as const).map((cat) => {
                const count =
                  cat === 'Todas'
                    ? completedTasks.length
                    : completedTasks.filter((t) => resolveCategory(t, categories) === cat).length
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
                  const cat = resolveCategory(task, categories)
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
