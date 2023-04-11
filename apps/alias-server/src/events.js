// Copyright (c) 2023 The Bitcoin developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

'use strict';
const config = require('../config');
const log = require('./log');
const { wait } = require('./utils');
const { isFinalBlock } = require('./rpc');

module.exports = {
    handleAppStartup: async function (
        chronik,
        db,
        telegramBot,
        channelId,
        avalancheRpc,
    ) {
        log(`Checking for new aliases on startup`);
        // If this is app startup, get the latest tipHash and tipHeight by querying the blockchain

        // Get chain tip
        let chaintipInfo;
        try {
            chaintipInfo = await chronik.blockchainInfo();
        } catch (err) {
            log(`Error in chronik.blockchainInfo() in handleAppStartup()`, err);
            // Server will wait until receiving ws msg to handleBlockConnected()
            return false;
        }
        const { tipHash, tipHeight } = chaintipInfo;
        // Validate for good chronik response
        if (typeof tipHash === 'string' && typeof tipHeight === 'number') {
            return module.exports.handleBlockConnected(
                chronik,
                db,
                telegramBot,
                channelId,
                avalancheRpc,
                tipHash,
                tipHeight,
            );
        }
        return false;
    },
    handleBlockConnected: async function (
        chronik,
        db,
        telegramBot,
        channelId,
        avalancheRpc,
        tipHash,
        tipHeight,
    ) {
        /*
         * BlockConnected callback
         *
         * This is where alias-server queries the blockchain for new transactions and
         * parses those transactions to determine if any are valid alias registrations
         *
         * The database may only be updated if we have a known blockhash and height with
         * isFinalBlock = true confirmed by avalanche
         *
         * A number of error conditions may cause parseWebsocketMessage to exit before any update to
         * the database occurs.
         *
         * If alias-server determines a blockhash and height with isFinalBlock === true,
         * valid alias registrations will be processed up to and including that blockheight
         *
         * Otherwise parseWebsocketMessage will exit before any updates are made to the database
         *
         * Note: websockets disconnect and reconnect frequently. It cannot be assumed that
         * every found block will triggger parseWebsocketMessage. So, parseWebsocketMessage must be designed such that
         * it will always update for all unseen valid alias registrations.
         *
         */

        if (typeof tipHeight === 'undefined') {
            let blockResult;
            try {
                blockResult = await chronik.block(tipHash);
                // chronik blockdetails returns the block height at the 'blockInfo.height' key
                tipHeight = blockResult.blockInfo.height;
            } catch (err) {
                log(
                    `Error in chronik.block(${tipHash} in handleBlockConnected(). Exiting function.`,
                    err,
                );
                // Exit handleBlockConnected on chronik error
                return false;
            }
        }

        // Initialize isAvalancheFinalized as false. Only set to true if you
        // prove it so with a node rpc call
        let isAvalancheFinalized = false;

        for (let i = 0; i < config.avalancheCheckCount; i += 1) {
            // Check to see if block tipHash has been finalized by avalanche
            try {
                isAvalancheFinalized = await isFinalBlock(
                    avalancheRpc,
                    tipHash,
                );
            } catch (err) {
                log(`Error in isFinalBlock for ${tipHash}`, err);
            }
            if (isAvalancheFinalized) {
                // If isAvalancheFinalized, stop checking
                break;
            }
            wait(config.avalancheCheckWaitInterval);
        }

        if (!isAvalancheFinalized) {
            log(
                `Block ${tipHash} is not avalanche finalized after ${
                    config.avalancheCheckWaitInterval *
                    config.avalancheCheckCount
                } ms. Exiting handleBlockConnected().`,
            );
            return false;
        }

        // TODO Get the valid aliases already in the db

        // TODO get server state
        // processedConfirmedTxs - count of processed confirmed txs
        // processedBlockheight - highest blockheight seen by the server

        // TODO get set of transactions not yet processed by the server
        // If app startup, this is full tx history of alias registration address

        // TODO parse tx history for latest valid alias registrations
        // with valid format and fee

        // TODO update database with latest valid alias information

        // TODO update server state
        // TODO If you have new aliases to add to the db, add them + send a tg msg
        // TODO If not, exit loop

        log(
            `Alias registrations updated to block ${tipHash} at height ${tipHeight}`,
        );
        return `Alias registrations updated to block ${tipHash} at height ${tipHeight}`;
    },
};