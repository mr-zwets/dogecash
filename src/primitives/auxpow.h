// Copyright (c) 2024 The Bitcoin developers
// Distributed under the MIT software license, see the accompanying
// file license.txt or http://www.opensource.org/licenses/mit-license.php.

#ifndef BITCOIN_PRIMITIVES_AUXPOW_H
#define BITCOIN_PRIMITIVES_AUXPOW_H

#include <cstdint>

/** Bit that indicates a block has auxillary PoW. Bits below that are
 * interpreted as the "traditional" Bitcoin version. */
static constexpr int32_t VERSION_AUXPOW_BIT_POS = 8;
static constexpr int32_t VERSION_AUXPOW_BIT = 1 << VERSION_AUXPOW_BIT_POS;

/** Position of the bits reserved for the auxpow chain ID. */
static constexpr int32_t VERSION_CHAIN_ID_BIT_POS = 16;

/** Chain ID used by Dogecoin. */
static constexpr int32_t AUXPOW_CHAIN_ID = 0x62;

/** Max allowed chain ID */
static constexpr uint32_t MAX_ALLOWED_CHAIN_ID =
    (1 << (32 - VERSION_CHAIN_ID_BIT_POS)) - 1;

/**
 * Build version bits from the given parameters, with AuxPow disabled.
 * @param nChainId The auxpow chain ID.
 * @param nLowVersionBits The low version bits below the AuxPow flag.
 */
int32_t MakeVersionWithChainId(uint32_t nChainId, uint32_t nLowVersionBits);

/**
 * Set the AuxPow flag bit in the nVersion.
 * @param nVersion A block's nVersion.
 * @param hasAuxPow Whether the AuxPow flag should be set.
 */
int32_t VersionWithAuxPow(uint32_t nVersion, bool hasAuxPow);

/**
 * Extract the low version bits, which are interpreted as the "traditional"
 * Bitcoin version. The upper bits are used to signal presence of AuxPow and
 * to set the chain ID.
 */
inline uint32_t VersionLowBits(int32_t nVersion) {
    return nVersion & (VERSION_AUXPOW_BIT - 1);
}

/**
 * Extract the chain ID from the nVersion.
 */
inline uint32_t VersionChainId(int32_t nVersion) {
    return uint32_t(nVersion) >> VERSION_CHAIN_ID_BIT_POS;
}

/**
 * Check if the auxpow flag is set in nVersion.
 */
inline bool VersionHasAuxPow(int32_t nVersion) {
    return nVersion & VERSION_AUXPOW_BIT;
}

/**
 * Check whether this is a "legacy" block without chain ID.
 */
inline bool VersionIsLegacy(int32_t nVersion) {
    return nVersion == 1
           // Dogecoin: We have a random v2 block with no AuxPoW, treat as
           // legacy
           || nVersion == 2;
}

#endif // BITCOIN_PRIMITIVES_AUXPOW_H