use anchor_lang::prelude::*;

#[account]
pub struct User {
    pub todo_count: u64,
}

#[account]
pub struct Authority {}

#[account]
pub struct Todo {
    pub content: String,    // 4 + len()
    pub todo_index: u64,    // 8
    pub status: TodoStatus, // 1
}

#[derive(AnchorDeserialize, AnchorSerialize, Clone, PartialEq, Eq, Debug)]
pub enum TodoStatus {
    Active,
    Completed,
}
