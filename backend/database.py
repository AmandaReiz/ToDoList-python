"""Conexão com o banco SQLite do To-do."""

from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

# __file__ é este próprio arquivo. Assim, o caminho não muda conforme o
# terminal de onde você iniciar o servidor.
PASTA_DO_PROJETO = Path(__file__).resolve().parent.parent
CAMINHO_DO_BANCO = PASTA_DO_PROJETO / "tarefas.db"
DATABASE_URL = f"sqlite:///{CAMINHO_DO_BANCO.as_posix()}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def criar_banco() -> None:
    """Cria as tabelas definidas em models.py, caso ainda não existam."""
    SQLModel.metadata.create_all(engine)
    with engine.connect() as conn:
        colunas = [col[1] for col in conn.exec_driver_sql("PRAGMA table_info(tarefa)").fetchall()]
        if "concluida_em" not in colunas:
            conn.exec_driver_sql("ALTER TABLE tarefa ADD COLUMN concluida_em VARCHAR")
            conn.commit()


def obter_sessao():
    """Entrega uma sessão do banco para cada rota da API."""
    with Session(engine) as session:
        yield session
