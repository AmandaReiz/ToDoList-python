"""Formatos que a API recebe e devolve."""

from sqlmodel import SQLModel


class TarefaCriar(SQLModel):
    titulo: str
    lista: str = "Work"
    prioridade: str = "none"


class TarefaAtualizar(SQLModel):
    titulo: str | None = None
    lista: str | None = None
    prioridade: str | None = None
    concluida: bool | None = None
    ordem: int | None = None


class TarefasReordenar(SQLModel):
    ids: list[int]
