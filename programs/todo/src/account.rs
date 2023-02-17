use anchor_lang::{prelude::*, solana_program::instruction};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::state::*;

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(init, seeds= [user.key().as_ref()], bump, space = 8 + 8, payer = user)]
    pub user_account: Account<'info, User>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,

    pub token_program: Program<'info, Token>,
    #[account(
        mut,
        seeds = ["mint".as_bytes()],
        bump
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = mint,
        associated_token::authority = user
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(content: String)]
pub struct CreateTodo<'info> {
    #[account(init, seeds = [user.key().as_ref(), &user_account.todo_count.to_le_bytes()], bump, payer = user, space = 8 + 1 + 4 + content.len() + 8)]
    pub todo: Account<'info, Todo>,
    #[account(mut, seeds = [user.key().as_ref()], bump)]
    pub user_account: Account<'info, User>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(content: String, todo_index: u64)]
pub struct UpdateTodo<'info> {
    #[account(mut, seeds = [user.key().as_ref(), &todo_index.to_le_bytes()], bump, realloc = 8 + 4 +1+ content.len() + 8, realloc::zero = true, realloc::payer = user)]
    pub todo: Account<'info, Todo>,
    #[account(seeds = [user.key().as_ref()], bump)]
    pub user_account: Account<'info, User>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitMint<'info> {
    #[account(
        init,
        seeds = [b"mint"],
        bump,
        payer = user,
        mint::decimals = 6,
        mint::authority = authority
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(init, seeds = [b"authority"],bump, payer = user, space = 8)]
    pub authority: Account<'info, Authority>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(todo_index: u64)]
pub struct DeleteTodo<'info> {
    #[account(mut, close = user ,  seeds = [user.key().as_ref(), &todo_index.to_le_bytes()], bump)]
    pub todo: Account<'info, Todo>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(todo_index: u64)]
pub struct CompleteTodo<'info> {
    // Storage account
    #[account(mut, seeds= [user.key().as_ref(), &todo_index.to_le_bytes()], bump)]
    pub todo: Account<'info, Todo>,

    // Authority
    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,

    // Token program stuff
    pub token_program: Program<'info, Token>,

    #[account(mut, seeds=[b"authority"], bump)]
    pub authority: Account<'info, Authority>,

    // Program's global mint
    #[account(mut, seeds=[b"mint"], bump)]
    pub mint: Account<'info, Mint>,

    // User's ATA
    #[account(mut, associated_token::mint = mint, associated_token::authority = user)]
    pub token_account: Account<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}
