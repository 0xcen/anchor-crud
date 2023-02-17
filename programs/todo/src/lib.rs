use account::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};
use state::*;

pub mod account;
pub mod state;

declare_id!("2AmpRig1p78Morj1ASrihySWj1oAJhnDSQKRqV6zQpWi");

#[program]
pub mod todo {
    use anchor_spl::token::mint_to;

    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        msg!("Initializing user: {}", ctx.accounts.user.key());
        ctx.accounts.user_account.todo_count = 0;
        msg!(
            "Todo counter set to: {}",
            ctx.accounts.user_account.todo_count
        );

        // Anchor creates user's token account if needed

        Ok(())
    }

    pub fn initialize_token_mint(_ctx: Context<InitMint>) -> Result<()> {
        msg!("Token mint initialized");
        Ok(())
    }

    pub fn create_todo(ctx: Context<CreateTodo>, content: String, _index: u64) -> Result<()> {
        msg!("Creating todo: {}", content);
        ctx.accounts.todo.content = content;
        // ctx.accounts.todo.status = TodoStatus::Active;

        ctx.accounts.todo.todo_index = ctx.accounts.user_account.todo_count;
        ctx.accounts.user_account.todo_count += 1;
        msg!(
            "Count incrememnted to: {}",
            ctx.accounts.user_account.todo_count
        );

        Ok(())
    }

    pub fn update_todo(ctx: Context<UpdateTodo>, content: String, _todo_index: u64) -> Result<()> {
        msg!("Updating todo from: {}", &ctx.accounts.todo.content);
        msg!("Status set to {:?}", &ctx.accounts.todo.status);
        ctx.accounts.todo.content = content;
        msg!("New todo: {}", ctx.accounts.todo.content);
        Ok(())
    }

    pub fn delete_todo(ctx: Context<DeleteTodo>, _todo_index: u64) -> Result<()> {
        msg!("{} deleted", ctx.accounts.todo.content);
        Ok(())
    }

    pub fn complete_todo(ctx: Context<CompleteTodo>, _todo_index: u64) -> Result<()> {
        msg!("Completed :{}", ctx.accounts.todo.content);
        ctx.accounts.todo.status = TodoStatus::Completed;

        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::MintTo {
                    authority: ctx.accounts.authority.to_account_info(),
                    to: ctx.accounts.token_account.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                },
                &[&[b"authority", &[*ctx.bumps.get("authority").unwrap()]]],
            ),
            5 * u64::pow(10, 6),
        )?;
        Ok(())
    }
}
