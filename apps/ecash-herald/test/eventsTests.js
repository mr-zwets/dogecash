// Copyright (c) 2023 The Bitcoin developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

'use strict';
const assert = require('assert');
const config = require('../config');
const blocks = require('./mocks/blocks');

const { handleBlockConnected } = require('../src/events');
const { MockChronikClient } = require('./mocks/chronikMock');
const { MockTelegramBot, mockChannelId } = require('./mocks/telegramBotMock');

const axios = require('axios');
const MockAdapter = require('axios-mock-adapter');

describe('ecash-herald events.js', async function () {
    it('handleBlockConnected creates and sends a telegram msg with price info for all mocked blocks if api call succeeds', async function () {
        // Initialize chronik mock
        const mockedChronik = new MockChronikClient();

        for (let i = 0; i < blocks.length; i += 1) {
            const thisBlock = blocks[i];
            const thisBlockHash = thisBlock.blockDetails.blockInfo.hash;
            const thisBlockChronikBlockResponse = thisBlock.blockDetails;

            // Tell mockedChronik what response we expect for chronik.block(thisBlockHash)
            mockedChronik.setMock('block', {
                input: thisBlockHash,
                output: thisBlockChronikBlockResponse,
            });
            const thisBlockExpectedMsgs = thisBlock.blockSummaryTgMsgs;

            const telegramBot = new MockTelegramBot();
            const channelId = mockChannelId;

            // Mock coingecko price response
            // onNoMatch: 'throwException' helps to debug if mock is not being used
            const mock = new MockAdapter(axios, {
                onNoMatch: 'throwException',
            });

            const mockResult = thisBlock.coingeckoResponse;

            // Mock a successful API request
            mock.onGet().reply(200, mockResult);

            const result = await handleBlockConnected(
                mockedChronik,
                telegramBot,
                channelId,
                thisBlockHash,
            );

            // Check that sendMessage was called successfully
            assert.strictEqual(telegramBot.messageSent, true);

            // Build expected array of successful msg returns
            let msgSuccessArray = [];
            for (let i = 0; i < thisBlockExpectedMsgs.length; i += 1) {
                msgSuccessArray.push({
                    success: true,
                    channelId,
                    msg: thisBlockExpectedMsgs[i],
                    options: config.tgMsgOptions,
                });
            }

            // Check that the correct msg info was sent
            assert.deepEqual(result, msgSuccessArray);
        }
    });
    it('handleBlockConnected creates and sends a telegram msg without price info for all mocked blocks if api call fails', async function () {
        // Initialize chronik mock
        const mockedChronik = new MockChronikClient();

        for (let i = 0; i < blocks.length; i += 1) {
            const thisBlock = blocks[i];
            const thisBlockHash = thisBlock.blockDetails.blockInfo.hash;
            const thisBlockChronikBlockResponse = thisBlock.blockDetails;

            // Tell mockedChronik what response we expect for chronik.block(thisBlockHash)
            mockedChronik.setMock('block', {
                input: thisBlockHash,
                output: thisBlockChronikBlockResponse,
            });
            const thisBlockExpectedMsgs =
                thisBlock.blockSummaryTgMsgsPriceFailure;

            const telegramBot = new MockTelegramBot();
            const channelId = mockChannelId;

            // Mock coingecko price response
            // onNoMatch: 'throwException' helps to debug if mock is not being used
            const mock = new MockAdapter(axios, {
                onNoMatch: 'throwException',
            });

            // Mock a failed API request
            mock.onGet().reply(500, { error: 'error' });

            const result = await handleBlockConnected(
                mockedChronik,
                telegramBot,
                channelId,
                thisBlockHash,
            );

            // Check that sendMessage was called successfully
            assert.strictEqual(telegramBot.messageSent, true);

            // Build expected array of successful msg returns
            let msgSuccessArray = [];
            for (let i = 0; i < thisBlockExpectedMsgs.length; i += 1) {
                msgSuccessArray.push({
                    success: true,
                    channelId,
                    msg: thisBlockExpectedMsgs[i],
                    options: config.tgMsgOptions,
                });
            }

            // Check that the correct msg info was sent
            assert.deepEqual(result, msgSuccessArray);
        }
    });
    it('handleBlockConnected sends desired backup msg if it encounters an error in message creation', async function () {
        // Initialize chronik mock
        const mockedChronik = new MockChronikClient();
        for (let i = 0; i < blocks.length; i += 1) {
            const thisBlock = blocks[i];
            const thisBlockHash = thisBlock.blockDetails.blockInfo.hash;

            // Tell mockedChronik what response we expect for chronik.block(thisBlockHash)
            mockedChronik.setMock('block', {
                input: thisBlockHash,
                output: null,
            });

            const telegramBot = new MockTelegramBot();
            const channelId = mockChannelId;

            const result = await handleBlockConnected(
                mockedChronik,
                telegramBot,
                channelId,
                thisBlockHash,
            );

            // Check that sendMessage was called successfully
            assert.strictEqual(telegramBot.messageSent, true);

            // Expect the backup msg
            const expectedMsg = `New Block Found\n\n${thisBlockHash}\n\n<a href="https://explorer.e.cash/block/${thisBlockHash}">explorer</a>`;

            // Check that the correct msg info was sent
            assert.deepEqual(result, {
                success: true,
                channelId,
                msg: expectedMsg,
                options: config.tgMsgOptions,
            });
        }
    });
    it('handleBlockConnected returns false if it encounters an error in telegram bot sendMessage routine', async function () {
        const wsTestAddress =
            'ecash:prfhcnyqnl5cgrnmlfmms675w93ld7mvvqd0y8lz07';
        // Initialize chronik mock
        const mockedChronik = new MockChronikClient(wsTestAddress, []);

        for (let i = 0; i < blocks.length; i += 1) {
            const thisBlock = blocks[i];
            const thisBlockHash = thisBlock.blockDetails.blockInfo.hash;
            const thisBlockChronikBlockResponse = thisBlock.blockDetails;

            // Tell mockedChronik what response we expect for chronik.block(thisBlockHash)
            mockedChronik.setMock('block', {
                input: thisBlockHash,
                output: thisBlockChronikBlockResponse,
            });

            const telegramBot = new MockTelegramBot();
            telegramBot.setExpectedError(
                'sendMessage',
                'Error: message failed to send',
            );
            const channelId = mockChannelId;

            const result = await handleBlockConnected(
                mockedChronik,
                telegramBot,
                channelId,
                thisBlockHash,
            );

            // Check that the correct msg info was sent
            assert.deepEqual(result, false);
        }
    });
});
