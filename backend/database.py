"""Conexão com o banco SQLite do To-do."""

import os
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

IS_LAMBDA = "AWS_LAMBDA_FUNCTION_NAME" in os.environ
BUCKET_NAME = os.environ.get("DATA_BUCKET_NAME", "todolist-data-003107248488")

if IS_LAMBDA:
    CAMINHO_DO_BANCO = Path("/tmp/tarefas.db")
else:
    PASTA_DO_PROJETO = Path(__file__).resolve().parent.parent
    CAMINHO_DO_BANCO = PASTA_DO_PROJETO / "tarefas.db"

DATABASE_URL = f"sqlite:///{CAMINHO_DO_BANCO.as_posix()}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


def sincronizar_de_s3() -> None:
    """Carrega o banco de dados do S3 quando executando em ambiente serverless."""
    if not IS_LAMBDA:
        return
    try:
        import boto3
        s3 = boto3.client("s3")
        s3.download_file(BUCKET_NAME, "tarefas.db", str(CAMINHO_DO_BANCO))
        print("Banco SQLite sincronizado do S3 com sucesso.")
    except Exception as e:
        print(f"Info S3 (download): {e}")


def sincronizar_para_s3() -> None:
    """Persiste o banco de dados no S3 após alterações em ambiente serverless."""
    if not IS_LAMBDA:
        return
    try:
        import boto3
        s3 = boto3.client("s3")
        s3.upload_file(str(CAMINHO_DO_BANCO), BUCKET_NAME, "tarefas.db")
        print("Banco SQLite salvo no S3 com sucesso.")
    except Exception as e:
        print(f"Erro S3 (upload): {e}")


def criar_banco() -> None:
    """Cria as tabelas definidas em models.py, caso ainda não existam."""
    sincronizar_de_s3()
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
