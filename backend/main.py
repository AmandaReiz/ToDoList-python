"""API Python do seu projeto To-do."""

from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from sqlmodel import Session, select

from database import criar_banco, obter_sessao, sincronizar_para_s3
from models import Tarefa
from schemas import TarefaAtualizar, TarefaCriar, TarefasReordenar


@asynccontextmanager
async def ciclo_de_vida(app: FastAPI):
    """Executa uma vez quando o servidor é iniciado."""
    criar_banco()
    yield


app = FastAPI(title="API do To-do da Amanda", lifespan=ciclo_de_vida)

# Permite requisições de origens locais e de produção (CloudFront, S3, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializa o banco na importação (essencial para ambientes serverless)
criar_banco()


@app.get("/")
def read_root():
    """Rota de teste: confirma que o FastAPI está no ar."""
    return {"message": "API do To-do funcionando na nuvem!"}


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
    sincronizar_para_s3()
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
    sincronizar_para_s3()
    return resultado


@app.patch("/tarefas/{tarefa_id}", response_model=Tarefa)
def atualizar_tarefa(
    tarefa_id: int,
    dados: TarefaAtualizar,
    sessao: Session = Depends(obter_sessao),
):
    """Atualiza somente os campos enviados: conclusão, prioridade, texto, ordem ou data."""
    tarefa = sessao.get(Tarefa, tarefa_id)
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")

    dados_dict = dados.model_dump(exclude_unset=True)
    if "concluida" in dados_dict:
        if dados_dict["concluida"]:
            if "concluida_em" not in dados_dict and not tarefa.concluida_em:
                tarefa.concluida_em = datetime.now().isoformat()
        else:
            tarefa.concluida_em = None

    for campo, valor in dados_dict.items():
        setattr(tarefa, campo, valor)

    sessao.add(tarefa)
    sessao.commit()
    sessao.refresh(tarefa)
    sincronizar_para_s3()
    return tarefa


@app.delete("/tarefas/{tarefa_id}")
def excluir_tarefa(tarefa_id: int, sessao: Session = Depends(obter_sessao)):
    """Remove uma tarefa definitivamente do banco."""
    tarefa = sessao.get(Tarefa, tarefa_id)
    if not tarefa:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada.")

    sessao.delete(tarefa)
    sessao.commit()
    sincronizar_para_s3()
    return {"ok": True}


# Handler padrão para a AWS Lambda
handler = Mangum(app, lifespan="off")