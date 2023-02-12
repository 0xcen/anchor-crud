use anchor_lang::prelude::*;

declare_id!("2AmpRig1p78Morj1ASrihySWj1oAJhnDSQKRqV6zQpWi");

#[program]
pub mod todo {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        msg!("Initializing user: {}", ctx.accounts.user.key());
        ctx.accounts.counter.count = 0;
        msg!("Todo counter set to: {}", ctx.accounts.counter.count);
        Ok(())
    }

    pub fn create_todo(ctx: Context<CreateTodo>, content: String) -> Result<()> {
        msg!("Creating todo: {}", content);
        ctx.accounts.todo.content = content;
        ctx.accounts.counter.count += 1;
        msg!("Count incrememnted to: {}", ctx.accounts.counter.count);
        Ok(())
    }

    pub fn update_todo(ctx: Context<UpdateTodo>, content: String, _todo_index: u64) -> Result<()> {
        msg!("Updating todo from: {}", &ctx.accounts.todo.content);
        ctx.accounts.todo.content = content;
        msg!("New todo: {}", ctx.accounts.todo.content);
        Ok(())
    }

    pub fn delete_todo(ctx: Context<DeleteTodo>, _todo_index: u64) -> Result<()> {
        msg!("{} deleted", ctx.accounts.todo.content);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(init, seeds= [user.key().as_ref()], bump, space = 8 + 8, payer = user)]
    counter: Account<'info, Counter>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(content: String)]
pub struct CreateTodo<'info> {
    #[account(init, seeds = [user.key().as_ref(), &counter.count.to_le_bytes()], bump, payer = user, space = 8 + 4 + content.len())]
    todo: Account<'info, Todo>,
    #[account(mut, seeds = [user.key().as_ref()], bump)]
    counter: Account<'info, Counter>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(content: String, todo_index: u64)]
pub struct UpdateTodo<'info> {
    #[account(mut, seeds = [user.key().as_ref(), &todo_index.to_le_bytes()], bump, realloc = 8 + 4 + content.len(), realloc::zero = true, realloc::payer = user)]
    todo: Account<'info, Todo>,
    #[account(seeds = [user.key().as_ref()], bump)]
    counter: Account<'info, Counter>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(todo_index: u64)]
pub struct DeleteTodo<'info> {
    #[account(mut, close = user ,  seeds = [user.key().as_ref(), &todo_index.to_le_bytes()], bump)]
    todo: Account<'info, Todo>,
    #[account(mut)]
    user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[account]
pub struct Counter {
    count: u64,
}

#[account]
pub struct Todo {
    content: String,
}
