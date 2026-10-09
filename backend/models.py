"""Modelos/tabelas do banco de dados."""

from sqlmodel import Field, SQLModel


class Tarefa(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    titulo: str
    lista: str = "Work"
    prioridade: str = "none"
    concluida: bool = False
    ordem: int = 0
