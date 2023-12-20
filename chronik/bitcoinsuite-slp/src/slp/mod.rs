// Copyright (c) 2023 The Bitcoin developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

//! Modules for the Simple Ledger Protocol
//!
//! See this repo for specifications:
//! https://github.com/badger-cash/slp-specifications/

mod build;
mod common;
pub mod consts;
mod error;
mod genesis;
mod parse;

pub use crate::slp::build::*;
pub use crate::slp::error::*;
pub use crate::slp::parse::*;