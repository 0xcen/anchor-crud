import { Box, Button, flexbox, Input, Stack, VStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import * as anchor from '@project-serum/anchor';
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import idl from '../../target/idl/todo.json';
import { PublicKey } from '@solana/web3.js';
import { Todo as TodoIdl } from '../../target/types/todo';
import { IdlAccounts, Program } from '@project-serum/anchor';
import { AppBar } from '../components/AppBar';
import { getAccount, getAssociatedTokenAddress } from '@solana/spl-token';
import {
  IdlAccount,
  IdlEnumFields,
  IdlEnumVariant,
} from '@project-serum/anchor/dist/cjs/idl';

type Todo = IdlAccounts<TodoIdl>['todo'];
// type TodoStatus = Idlenum<TodoIdl>['TodoStatus'];

const Todo = () => {
  const [content, setContent] = useState('');
  const [userBalance, setUserBalance] = useState<number>();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [program, setProgram] = useState<anchor.Program<TodoIdl>>();
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [userPda, setUserPda] = useState<PublicKey>();

  const submitTodo = async () => {
    const { todoCount } = await program.account.user.fetch(userPda);

    if (todoCount) {
      const nextCount: number = todoCount.toNumber();
      const [todoPda] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          wallet.publicKey.toBuffer(),
          new anchor.BN(nextCount).toArrayLike(Buffer, 'le', 8),
        ],
        program.programId
      );

      const tx = await program.methods
        .createTodo(content, todoCount)
        .accounts({ userAccount: userPda, todo: todoPda })
        .rpc();

      setRefresh(r => !r);
      console.log(
        `https://explorer.solana.com/tx/${tx}?cluster=devnet&customUrl=http://localhost:8899`
      );
    }
  };

  useEffect(() => {
    if (userPda) return;
    try {
      const [pda] = anchor.web3.PublicKey.findProgramAddressSync(
        [wallet?.publicKey.toBuffer()],
        program.programId
      );
      setUserPda(pda);
    } catch (error) {
      console.log('🚀 ~ file: index.tsx:64 ~ useEffect ~ error', error);
    }
  }, [wallet]);

  const initializeUser = async () => {
    const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('mint')],
      program.programId
    );
    const [authority] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      program.programId
    );
    const ATA = await getAssociatedTokenAddress(mint, wallet.publicKey);
    if (!userPda) return;
    const tx = await program.methods
      .initializeUser()
      .accounts({
        userAccount: userPda,
        user: wallet.publicKey,
        mint,
        tokenAccount: ATA,
      })
      .rpc();

    console.log(
      `https://explorer.solana.com/tx/${tx}?cluster=devnet&customUrl=http://localhost:8899`
    );

    setIsInitialized(true);
  };

  const getTodos = async (counter: number) => {
    const accounts = [];
    try {
      for (let i = 0; i < counter; i++) {
        const [todoPda] = anchor.web3.PublicKey.findProgramAddressSync(
          [
            wallet.publicKey.toBuffer(),
            new anchor.BN(i).toArrayLike(Buffer, 'le', 8),
          ],
          program.programId
        );
        accounts.push(new PublicKey(todoPda));
      }

      const todos = await program.account.todo.fetchMultiple(accounts);
      setTodos(todos as Todo[]);
    } catch (error) {
      console.log('🚀 ~ file: todo.tsx:81 ~ getTodos ~ error', error);
      setTodos([]);
    }
  };

  const completeTodo = async (index: anchor.BN) => {
    const [todoPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [wallet.publicKey.toBuffer(), index.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );
    const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('mint')],
      program.programId
    );
    const [authority] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('authority')],
      program.programId
    );

    const ata = await getAssociatedTokenAddress(mint, wallet.publicKey);

    const tx = await program.methods
      .completeTodo(index)
      .accounts({ todo: todoPda, mint, tokenAccount: ata, authority })
      .rpc();

    console.log(
      `https://explorer.solana.com/tx/${tx}?cluster=localnet&customUrl=http://localhost:8899`
    );

    setRefresh(r => !r);
  };

  const deleteTodo = async (index: anchor.BN) => {
    const [todoPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [wallet.publicKey.toBuffer(), index.toArrayLike(Buffer, 'le', 8)],
      program.programId
    );

    const tx = await program.methods
      .deleteTodo(index)
      .accounts({ todo: todoPda })
      .rpc();

    console.log(
      `https://explorer.solana.com/tx/${tx}?cluster=localnet&customUrl=http://localhost:8899`
    );

    setRefresh(r => !r);
  };

  useEffect(() => {
    let provider: anchor.Provider;

    try {
      provider = anchor.getProvider();
    } catch (error) {
      if (wallet) {
        provider = new anchor.AnchorProvider(connection, wallet, {});
      }
    }

    if (provider) {
      const program = new anchor.Program(
        idl as anchor.Idl,
        new PublicKey('H2GTK5fQwrZPkT9QiZvujUad9UB1k69P7CCbLxiQHeGj'),
        provider
      );
      setProgram(program as Program<TodoIdl>);
    }
  }, [wallet]);

  const getUserBalance = async () => {
    const [mint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from('mint')],
      program.programId
    );
    const ata = await getAssociatedTokenAddress(mint, wallet.publicKey);
    const userBalance = await getAccount(connection, ata);

    setUserBalance(Number(userBalance.amount) / 10 ** 6);
  };

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey && program) {
        const userAccount = await program.account.user.fetchNullable(userPda);
        if (userAccount) {
          await getTodos(userAccount.todoCount.toNumber());
          await getUserBalance();

          setIsInitialized(true);
        }
      }
    })();
  }, [wallet, program, refresh]);

  return (
    <div className=''>
      <Box justifyContent='center' alignContent='center' w='full'>
        <AppBar />

        {!wallet?.publicKey ? (
          <div>Connect your wallet 🧸</div>
        ) : !isInitialized ? (
          <Button onClick={initializeUser}>Init user</Button>
        ) : (
          <Stack
            w='700px'
            h='calc(100vh)'
            margin='auto'
            justify='center'
            align='center'>
            <div>
              <h2>Points</h2>
              {userBalance ?? ''}
            </div>
            <Input
              onChange={e => setContent(e.currentTarget.value)}
              value={content}
              type='text'
            />
            <Button onClick={submitTodo}>Add todo</Button>

            {todos &&
              todos
                .filter(t => t)
                .map((t, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                    }}>
                    <>
                      {Object.keys(t.status).includes('completed') ? (
                        <span style={{ textDecoration: 'line-through' }}>
                          {t?.content}
                        </span>
                      ) : (
                        t.content
                      )}
                    </>
                    <div>
                      <Button onClick={() => deleteTodo(t.todoIndex)}>
                        Delete
                      </Button>

                      {!Object.keys(t.status).includes('completed') && (
                        <Button onClick={() => completeTodo(t.todoIndex)}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
          </Stack>
        )}
      </Box>
    </div>
  );
};

export default Todo;
