"""API Python do seu projeto To-do."""

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from database import criar_banco, obter_sessao
from models import Tarefa
from schemas import TarefaAtualizar, TarefaCriar, TarefasReordenar


@asynccontextmanager
async def ciclo_de_vida(app: FastAPI):
    """Executa uma vez quando o servidor é iniciado."""
    criar_banco()
    yield


app = FastAPI(title="API do To-do da Amanda", lifespan=ciclo_de_vida)

# O navegador bloqueia, por segurança, pedidos entre portas diferentes.
# Esta lista libera somente o endereço do React durante o desenvolvimento.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Rota de teste: confirma que o FastAPI está no ar."""
    return {"message": "API do To-do funcionando!"}


@app.get("/tarefas", response_model=list[Tarefa])
def listar_tarefas(sessao: Session = Depends(obter_sessao)):
    """Lê todas as tarefas salvas no SQLite."""
    return sessao.exec(select(Tarefa).order_by(Tarefa.ordem, Tarefa.id)).all()


@app.post("/tarefas", response_model=Tarefa, status_code=201)
def criar_tarefa(dados: TarefaCriar, sessao: Session = Depends(obter_sessao)):
    """Recebe uma tarefa do React e salva uma nova linha no banco."""
    ultima = sessao.exec(select(Tarefa).order_by(Tarefa.ordem.desc())).first()
    proxima_ordem = (ultima.ordem if ultima else 0) + 1
    tarefa = Tarefa(**dados.model_dump(), ordem=proxima_ordem)
    sessao.add(tarefa)
    sessao.commit()
    sessao.refresh(tarefa)
    return tarefa


@app.put("/tarefas/ordem", response_model=list[Tarefa])
def reordenar_tarefas(dados: TarefasReordenar, sessao: Session = Depends(obter_sessao)):
    """Salva a ordem em uma transação, preservando posições fora do filtro."""
    if len(dados.ids) != len(set(dados.ids)):
        raise HTTPException(status_code=422, detail="IDs repetidos na ordenação.")
    tarefas = list(sessao.exec(select(Tarefa).order_by(Tarefa.ordem, Tarefa.id)).all())
    por_id = {tarefa.id: tarefa for tarefa in tarefas}
    if any(tarefa_id not in por_id for tarefa_id in dados.ids):
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")
    ids = set(dados.ids)
    reordenadas = iter(por_id[tarefa_id] for tarefa_id in dados.ids)
    resultado = [next(reordenadas) if tarefa.id in ids else tarefa for tarefa in tarefas]
    for ordem, tarefa in enumerate(resultado, start=1):
        tarefa.ordem = ordem
        sessao.add(tarefa)
    sessao.commit()
    return resultado


@app.patch("/tarefas/{tarefa_id}", response_model=Tarefa)
def atualizar_tarefa(
    tarefa_id: int,
    dados: TarefaAtualizar,
    sessao: Session = Depends(obter_sessao),
):
    """Atualiza somente os campos enviados: conclusão, prioridade, texto ou ordem."""
    tarefa = sessao.get(Tarefa, tarefa_id)
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(tarefa, campo, valor)

    sessao.add(tarefa)
    sessao.commit()
    sessao.refresh(tarefa)
    return tarefa


@app.delete("/tarefas/{tarefa_id}")
def excluir_tarefa(tarefa_id: int, sessao: Session = Depends(obter_sessao)):
    """Remove uma tarefa definitivamente do banco."""
    tarefa = sessao.get(Tarefa, tarefa_id)
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")

    sessao.delete(tarefa)
    sessao.commit()
    return {"ok": True}

  