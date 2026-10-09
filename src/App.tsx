import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Check, GripVertical, Plus, X } from 'lucide-react'
import { tarefasApi, type TarefaDaApi } from './services/tasksApi'

function App() {
  const [tasks, setTasks] = useState<TarefaDaApi[]>([])
  const [newTitle, setNewTitle] = useState('')
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
    tarefasApi.listar().then((data) => {
      if (active) setTasks(data)
    }).catch(() => {
      if (active) setApiError('Não foi possível carregar suas tarefas. Confira se a API está ligada.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const visibleTasks = tasks.filter((task) => !task.concluida).sort((a, b) => a.ordem - b.ordem || a.id - b.id)

  const mutate = async (action: () => Promise<void>) => {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    setApiError('')
    try { await action() }
    catch { setApiError('Não foi possível salvar a alteração. Tente novamente.') }
    finally { locked.current = false; setBusy(false) }
  }

  const addTask = async () => {
    const title = newTitle.trim()
    if (!title) { inputRef.current?.focus(); return }
    await mutate(async () => {
      const task = await tarefasApi.criar({ titulo: title, lista: 'work', prioridade: 'none' })
      setTasks((current) => [...current, task])
      setNewTitle('')
      setAnnouncement('Tarefa adicionada.')
    })
    inputRef.current?.focus()
  }

  const completeTask = (id: number) => mutate(async () => {
    const updated = await tarefasApi.atualizar(id, { concluida: true })
    setTasks((current) => current.map((task) => task.id === id ? updated : task))
    setAnnouncement('Tarefa concluída.')
    inputRef.current?.focus()
  })

  const deleteTask = (id: number) => mutate(async () => {
    await tarefasApi.excluir(id)
    setTasks((current) => current.filter((task) => task.id !== id))
    setAnnouncement('Tarefa excluída.')
  })

  const saveOrder = (ids: number[]) => mutate(async () => {
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

  return <main className="app-shell">
    <section className="todo-card" aria-labelledby="list-title">
      <header className="card-header">
        <span className="card-mark" aria-hidden="true"><Check size={22} strokeWidth={1.8}/></span>
        <h1 id="list-title">To do list</h1>
      </header>

      {apiError && <p className="api-error" role="alert">{apiError}</p>}
      <span className="sr-only" role="status">{announcement}</span>

      <section className="task-list" aria-label="Tarefas pendentes" aria-busy={loading || busy}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); dropTask(null) }}>
        {loading && <p className="empty-state">Carregando tarefas…</p>}
        {!loading && visibleTasks.length === 0 && !apiError && <p className="empty-state">Tudo em dia.<br/><span>Adicione sua próxima tarefa abaixo.</span></p>}
        {visibleTasks.map((task, index) => <article
          className={`task-row ${dragged === task.id ? 'dragging' : ''} ${dropTarget === task.id ? 'drop-target' : ''}`}
          key={task.id} draggable={!busy}
          onDragStart={(event) => { setDragged(task.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(task.id)) }}
          onDragEnd={() => { setDragged(null); setDropTarget(null) }}
          onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'move'; setDropTarget(task.id) }}
          onDragLeave={() => setDropTarget(null)}
          onDrop={(event) => {
            event.preventDefault(); event.stopPropagation()
            const bounds = event.currentTarget.getBoundingClientRect()
            dropTask(task.id, event.clientY > bounds.top + bounds.height / 2)
          }}>
          <span className="drag-handle" title="Arrastar tarefa" aria-hidden="true"><GripVertical size={16}/></span>
          <button className="complete-button" aria-label={`Concluir: ${task.titulo}`} disabled={busy} onClick={() => void completeTask(task.id)}><Check size={15}/></button>
          <span className="task-title">{task.titulo}</span>
          <span className="task-actions">
            <button aria-label={`Subir: ${task.titulo}`} title="Subir tarefa" disabled={busy || index === 0} onClick={() => moveTask(task.id, -1)}><ArrowUp size={15}/></button>
            <button aria-label={`Descer: ${task.titulo}`} title="Descer tarefa" disabled={busy || index === visibleTasks.length - 1} onClick={() => moveTask(task.id, 1)}><ArrowDown size={15}/></button>
            <button aria-label={`Excluir: ${task.titulo}`} title="Excluir tarefa" disabled={busy} onClick={() => void deleteTask(task.id)}><X size={17}/></button>
          </span>
        </article>)}

        <form className="inline-add" onSubmit={(event) => { event.preventDefault(); void addTask() }}>
          <Plus className="add-mark" size={21} aria-hidden="true"/>
          <input ref={inputRef} aria-label="Nova tarefa" placeholder="Adicionar tarefa" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} readOnly={busy} autoComplete="off"/>
          <button type="submit" aria-label="Adicionar tarefa" title="Adicionar tarefa" disabled={busy || loading || !newTitle.trim()}><Plus size={20}/></button>
        </form>
      </section>
      <footer>Desenvolvido por <strong>Amanda Reis</strong></footer>
    </section>
  </main>
}

export default App
