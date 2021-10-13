import Vue from 'vue'
import Vuex from 'vuex'

import { ethers } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { loadContract } from '../utils/index'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    l1Provider: null,
    l2Provider: null,

    signer: null,
    userAddress: '',

    l1ETHBalance: '0',
    l1TONBalance: '0',

    l2ETHBalance: '0',
    l2TONBalance: '0',

    mintedEvents: [], // l1 events (Minted)
    fwEvents: [], // l2 events (FastWithdrawalInitiated)

    tokenInfos: [],

    l1Contracts: {
      OVM_CanonicalTransactionChain: null,
      L1Token: null,
      L1ClaimableToken: null,
      L1Oracle: null,
      L1Auction: null,
    },
    l2Contracts: {
      L2Token: null,
      L2BridgeWrapper: null,
    }
  },
  mutations: {
  },
  actions: {
    async run ({ state }) {
      const l1Provider = new JsonRpcProvider('https://kovan.infura.io/v3/f6429583907549eca57832ec1a60b44f')
      const l2Provider = new JsonRpcProvider('https://kovan.optimism.io')
      state.l1Provider = l1Provider
      state.l2Provider = l2Provider

      const l1Contracts = {
        OVM_CanonicalTransactionChain: '0xe28c499EB8c36C0C18d1bdCdC47a51585698cb93',

        L1Token: '0xe603C47d2037EBD079A708ee7A19D5E57955969F',
        L1ClaimableToken: '0x1440843F431144752055f7EAD75B01C1EC987529',
        L1Oracle: '0xcfAF2925Bf7c0A9F36ba0228146E2e7a110324a5',
        L1Auction: '0x3cB0b3DCc0c4709f9c352d09774f438c623A3797',
      }
      const l2Contracts = {
        L2Token: '0xB0599c90F94BBC3e817eb5ea730dc9e37A8E317a',
        L2BridgeWrapper: '0x6FEaE39cf778a39303c7F6C1A710E0FF759EfAA9',
      }

      // load l1 contracts
      const OVM_CanonicalTransactionChain = loadContract('OVM_CanonicalTransactionChain', l1Contracts.OVM_CanonicalTransactionChain, l1Provider)
      const L1Token = loadContract('L1Token', l1Contracts.L1Token, l1Provider)
      const L1ClaimableToken = loadContract('L1ClaimableToken', l1Contracts.L1ClaimableToken, l1Provider)
      const L1Oracle = loadContract('L1Oracle', l1Contracts.L1Oracle, l1Provider)
      const L1Auction = loadContract('L1Auction', l1Contracts.L1Auction, l1Provider)
      state.l1Contracts.OVM_CanonicalTransactionChain = OVM_CanonicalTransactionChain
      state.l1Contracts.L1Token = L1Token
      state.l1Contracts.L1ClaimableToken = L1ClaimableToken
      state.l1Contracts.L1Oracle = L1Oracle
      state.l1Contracts.L1Auction = L1Auction

      // load l2 contracts
      const L2Token = loadContract('L2Token', l2Contracts.L2Token, l2Provider)
      const L2BridgeWrapper = loadContract('L2BridgeWrapper', l2Contracts.L2BridgeWrapper, l2Provider)
      state.l2Contracts.L2Token = L2Token
      state.l2Contracts.L2BridgeWrapper = L2BridgeWrapper

      // l1 event filters
      const mFilter = L1ClaimableToken.filters.Minted()

      // l2 event filters
      const fwiFilter = L2BridgeWrapper.filters.FastWithdrawalInitiated()

      l1Provider.on('block', async blockNumber => {
        const events = await L1ClaimableToken.queryFilter(
          mFilter,
          blockNumber,
        )
        if (events.length > 0) {
          // events.blockNumber = blockNumber
          // state.mintedEvents.push(events)
          console.log(blockNumber)

          const tokenId = parseInt(events[0].topics[1], 16)
          const tokenInfo = await L1ClaimableToken.tokenInfos(tokenId)
          // tokenInfo.tokenId = tokenId
          state.tokenInfos.push(tokenInfo)
        }
      })

      l2Provider.on('block', async blockNumber => {
        const events = await L2BridgeWrapper.queryFilter(
          fwiFilter,
          blockNumber,
        )
        if (events.length > 0) {
          events.blockNumber = blockNumber
          state.fwEvents.push(events)
        }
      })
    },
    async connect ({ state, dispatch }) {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();

          state.l1Contracts.L1Token = state.l1Contracts.L1Token.connect(signer)
          state.l1Contracts.L1ClaimableToken = state.l1Contracts.L1ClaimableToken.connect(signer)
          state.l1Contracts.L1Oracle = state.l1Contracts.L1Oracle.connect(signer)
          state.l1Contracts.L1Auction = state.l1Contracts.L1Auction.connect(signer)
          state.l2Contracts.L2Token = state.l2Contracts.L2Token.connect(signer)
          state.l2Contracts.L2BridgeWrapper = state.l2Contracts.L2BridgeWrapper.connect(signer)

          state.userAddress = await signer.getAddress()
          state.signer = signer;

          await dispatch('getBalance')
        } catch (err) {
          console.log(err.message);
        }
      }
    },
    async getBalance ({ state }) {
      const userAddress = state.userAddress

      const l1Provider = state.l1Provider
      const l2Provider = state.l2Provider

      const l1Token = (state.l1Contracts.L1Token).connect(l1Provider)
      const l2Token = (state.l2Contracts.L2Token).connect(l2Provider)

      const [
        l1ETHBalance,
        l2ETHBalance,
        l1TONBalance,
        l2TONBalance
      ] = await Promise.all([
        l1Provider.getBalance(userAddress),
        l2Provider.getBalance(userAddress),
        l1Token.balanceOf(userAddress),
        l2Token.balanceOf(userAddress),
      ])

      state.l1ETHBalance = l1ETHBalance
      state.l2ETHBalance = l2ETHBalance
      state.l1TONBalance = l1TONBalance
      state.l2TONBalance = l2TONBalance
    },
    async switchL1Chain({ dispatch }) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [
            {
              chainId: "0x2A", // 42
            },
          ],
        });
        await dispatch('connect')
      } catch (err) {
        console.log(err.message)
      }
    },
    async switchL2Chain({ dispatch }) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [
            {
              chainId: "0x45", // 69
            },
          ],
        })
        await dispatch('connect')
      } catch (err) {
        console.log(err.message)
      }
    },
  },
  modules: {
  }
})
