
# to do list

tarefas = []

print("Minha lista de tarefas")

nova_tarefa = input("Digite uma nova tarefa: ")
tarefas.append(nova_tarefa)

tarefa_a_excluir = input("Digite a tarefa que deseja excluir: ")

if tarefa_a_excluir in tarefas:
    tarefas.remove(tarefa_a_excluir)
    print("Tarefa excluída com sucesso!")
else:
    print("Essa tarefa não foi encontrada.")

print(tarefas)