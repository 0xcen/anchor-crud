import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { BN } from 'bn.js';
import { expect } from 'chai';
import { Todo } from '../target/types/todo';

describe('todo', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Todo as Program<Todo>;

  const [counterPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  const [todoPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [provider.wallet.publicKey.toBuffer(), new anchor.BN(0).toBuffer('le', 8)],
    program.programId
  );

  const todo = 'hello world';

  // it('todo is added', async () => {
  //   await program.methods
  //     .initializeUser()
  //     .accounts({ counter: counterPda })
  //     .rpc();

  //   await program.methods
  //     .createTodo(todo)
  //     .accounts({ counter: counterPda, todo: todoPda })
  //     .rpc();

  //   const counterAccount = await program.account.counter.fetch(counterPda);
  //   const todoAccount = await program.account.todo.fetch(todoPda);

  //   expect(todoAccount.content).to.equal(todo);
  //   expect(counterAccount.count.toNumber()).to.equal(1);
  // });

  it('todo is updated', async () => {
    await program.methods
      .initializeUser()
      .accounts({ counter: counterPda })
      .rpc();

    await program.methods
      .createTodo(todo)
      .accounts({ counter: counterPda, todo: todoPda })
      .rpc();

    const counterAccount = await program.account.counter.fetch(counterPda);
    const todoAccount = await program.account.todo.fetch(todoPda);

    expect(todoAccount.content).to.equal(todo);
    expect(counterAccount.count.toNumber()).to.equal(1);

    const newTodo = 'Updated todo';
    await program.methods
      .updateTodo(newTodo, new anchor.BN(0))
      .accounts({ counter: counterPda, todo: todoPda })
      .rpc();

    const updatedTodoAccount = await program.account.todo.fetch(todoPda);
    console.log(
      '🚀 ~ file: todo.ts:67 ~ it ~ updatedTodoAccount',
      updatedTodoAccount.content
    );
    expect(updatedTodoAccount.content).to.equal(newTodo);
  });

  // it('deletes a todo', async () => {
  //   await program.methods
  //     .initializeUser()
  //     .accounts({ counter: counterPda })
  //     .rpc();

  //   await program.methods
  //     .createTodo(todo)
  //     .accounts({ counter: counterPda, todo: todoPda })
  //     .rpc();

  //   await program.methods
  //     .deleteTodo(new anchor.BN(0))
  //     .accounts({ todo: todoPda })
  //     .rpc();

  //   const endState = await program.account.counter.fetch(counterPda);

  //   const data = await program.account.todo.fetchNullable(todoPda);
  //   expect(data).to.equal(null);
  //   expect(endState.count.toNumber()).to.equal(1);
  // });
});
