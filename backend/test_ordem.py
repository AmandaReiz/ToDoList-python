"""Testes da ordenação com SQLite em memória, sem alterar tarefas.db."""

import unittest

from fastapi import HTTPException
from sqlmodel import Session, SQLModel, create_engine, select

from main import criar_tarefa, reordenar_tarefas
from models import Tarefa
from schemas import TarefaCriar, TarefasReordenar


class OrdemTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        SQLModel.metadata.create_all(self.engine)
        self.session = Session(self.engine)
        for titulo, lista, ordem in [("A", "work", 1), ("B", "studies", 2), ("C", "work", 5)]:
            self.session.add(Tarefa(titulo=titulo, lista=lista, ordem=ordem))
        self.session.commit()

    def tearDown(self):
        self.session.close()
        self.engine.dispose()

    def ids(self):
        return [t.id for t in self.session.exec(select(Tarefa).order_by(Tarefa.ordem, Tarefa.id)).all()]

    def test_reordenar_filtro_preserva_posicao_da_outra_lista(self):
        reordenar_tarefas(TarefasReordenar(ids=[3, 1]), self.session)
        with Session(self.engine) as outra_sessao:
            tarefas = outra_sessao.exec(select(Tarefa).order_by(Tarefa.ordem)).all()
            self.assertEqual([t.id for t in tarefas], [3, 2, 1])
            self.assertEqual([t.ordem for t in tarefas], [1, 2, 3])

    def test_ids_invalidos_nao_alteram_ordem(self):
        for ids, status in [([3, 3], 422), ([3, 999], 404)]:
            with self.assertRaises(HTTPException) as erro:
                reordenar_tarefas(TarefasReordenar(ids=ids), self.session)
            self.assertEqual(erro.exception.status_code, status)
            self.assertEqual(self.ids(), [1, 2, 3])

    def test_nova_tarefa_fica_no_final_mesmo_com_lacunas(self):
        tarefa = criar_tarefa(TarefaCriar(titulo="D", lista="work"), self.session)
        self.assertEqual(tarefa.ordem, 6)
        self.assertEqual(self.ids(), [1, 2, 3, tarefa.id])


if __name__ == "__main__":
    unittest.main()
