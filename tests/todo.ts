import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
import {
  getAccount,
  getAssociatedTokenAddress,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { BN } from 'bn.js';
import { expect } from 'chai';
import { Todo, IDL } from '../target/types/todo';

describe('todo', async () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Todo as Program<Todo>;

  const [userAccountPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [provider.wallet.publicKey.toBuffer()],
    program.programId
  );

  const [todoPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [provider.wallet.publicKey.toBuffer(), new anchor.BN(0).toBuffer('le', 8)],
    program.programId
  );

  const todo = 'hello world';

  const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('mint')],
    program.programId
  );

  const [authority] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from('authority')],
    program.programId
  );

  const ATA = await getAssociatedTokenAddress(mint, provider.wallet.publicKey);

  it('initializes the mint', async () => {
    await program.methods
      .initializeTokenMint()
      .accounts({ mint, authority })
      .rpc();
  });

  it('user is initialized', async () => {
    await program.methods
      .initializeUser()
      .accounts({ userAccount: userAccountPda, mint: mint, tokenAccount: ATA })
      .rpc();
  });

  it('todo is added', async () => {
    await program.methods
      .createTodo(todo, new anchor.BN(0))
      .accounts({ userAccount: userAccountPda, todo: todoPda })
      .rpc();

    const todoAccount = await program.account.todo.fetch(todoPda);
    const freshUserAccount = await program.account.user.fetch(userAccountPda);
    expect(todoAccount.content).to.equal(todo);
    expect(freshUserAccount.todoCount.toNumber()).to.equal(1);
  });

  it('todo is updated', async () => {
    const newTodo = 'Updated todo';
    await program.methods
      .updateTodo(newTodo, new anchor.BN(0))
      .accounts({ userAccount: userAccountPda, todo: todoPda })
      .rpc();

    const updatedTodoAccount = await program.account.todo.fetch(todoPda);
    expect(updatedTodoAccount.content).to.equal(newTodo);
  });

  it('completes a todo', async () => {
    await program.methods
      .completeTodo(new BN(0))
      .accounts({
        todo: todoPda,
        mint: mint,
        tokenAccount: ATA,
        authority: authority,
      })
      .rpc();

    const data = await program.account.todo.fetch(todoPda);
    const accountData = await getAccount(provider.connection, ATA);

    expect(Number(accountData.amount)).to.eq(5 * 10 ** 6);
    expect(data.status).to.have.property('completed');
  });

  it('deletes a todo', async () => {
    await program.methods
      .deleteTodo(new anchor.BN(0))
      .accounts({ todo: todoPda })
      .rpc();

    const data = await program.account.todo.fetchNullable(todoPda);
    expect(data).to.equal(null);
  });
});
