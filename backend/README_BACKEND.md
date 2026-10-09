# Daylight: API e banco local

O projeto está em desenvolvimento. A tela React chama a API FastAPI para salvar tarefas no SQLite. A coluna única se chama **To do's**. Arrastar tarefas ou usar as setas salva a ordem no banco e muda a ordenação da tela para Manual.

## 1. Iniciar a API

No terminal PowerShell do VS Code, dentro da pasta principal do projeto:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --app-dir backend --host 127.0.0.1 --port 8000
```

Deixe esse terminal aberto. `--reload` atualiza o servidor quando o código Python muda. Para parar, pressione `Ctrl+C` nesse terminal. Se a porta estiver em uso, já existe um servidor nela; não inicie outro.

Caso as dependências ainda não estejam instaladas:

```powershell
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Não é necessário ativar o ambiente com `Activate.ps1`.

- Teste da API: <http://127.0.0.1:8000/>
- Documentação interativa: <http://127.0.0.1:8000/docs>

## 2. Iniciar a interface

Abra um segundo terminal na pasta principal:

```powershell
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Abra <http://127.0.0.1:5173>. Os dois servidores precisam estar ligados. O CORS permite as origens `http://127.0.0.1:5173` e `http://localhost:5173`.

## 3. Ver a tabela dentro do VS Code

O banco atual é **SQLite**. **Microsoft SQL Server** é outro banco e exige instalação, conexão e adaptação do backend. O SQLite Viewer é uma extensão para abrir arquivos SQLite; ele não instala um servidor SQL Server.

1. Abra [tarefas.db](../tarefas.db) no explorador do VS Code.
2. Se necessário, clique com o botão direito e escolha **Open With… / Abrir com…** e **SQLite Viewer** (extensão `qwtel.sqlite-viewer`).
3. Selecione a tabela `tarefa`.
4. Crie uma tarefa no aplicativo e atualize ou reabra o visualizador para ver a linha.

A API cria a tabela ao iniciar, usando [models.py](./models.py). Não é necessário criá-la manualmente. O caminho do banco está em [database.py](./database.py).

| Coluna | Conteúdo |
| --- | --- |
| id | Identificador numérico |
| titulo | Texto da tarefa |
| lista | Identificador da lista, por exemplo `work` |
| prioridade | `none`, `yellow` ou `red` |
| concluida | Se a tarefa está concluída |
| ordem | Posição manual da tarefa |

Os nomes e as cores das listas, além do tema, ainda ficam no navegador. Não existe tabela separada para listas nesta etapa. Tarefas antigas que ficaram no armazenamento local do navegador não são migradas automaticamente.

## 4. Testar o fluxo

1. Crie duas tarefas na tela.
2. Arraste a segunda acima da primeira. Soltar na metade superior de um cartão coloca a tarefa antes dele; na metade inferior, depois. Soltar no espaço vazio da coluna coloca no fim. As setas são uma alternativa ao arrastar.
3. Recarregue a página: a ordem deve continuar igual.
4. Marque uma como concluída e confira a coluna `concluida` no visualizador.
5. Exclua uma tarefa e confira sua remoção.

Ao filtrar uma lista, a reordenação preserva as posições das tarefas das outras listas. A API grava a ordem em uma única transação.

## Rotas

| Método | Rota | Função |
| --- | --- | --- |
| GET | `/` | Testar a API |
| GET | `/tarefas` | Listar tarefas |
| POST | `/tarefas` | Criar tarefa |
| PUT | `/tarefas/ordem` | Salvar ordem: `{"ids": [2, 1]}` |
| PATCH | `/tarefas/{tarefa_id}` | Atualizar tarefa |
| DELETE | `/tarefas/{tarefa_id}` | Excluir tarefa |

## Verificações de desenvolvimento

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s backend -p test_*.py -v
npm run build
```

Os testes de ordenação usam SQLite em memória e não alteram o banco local.
