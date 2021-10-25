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

        L1Auction: '0x7Da7BEaa787FAF68a2e5a74f8EDEdCE2a9251b77',
        L1ClaimableToken: '0x8Df10660186dC0D89664E56b1de3304DB2eFeC0d',
        L1Oracle: '0x0c1D3D83ce2635e8fF26cA5761D5A2cD9c349f17',
        L1Token: '0xF2e47aC4072E26DBdB26dacEA32AaC2703B53B39',
      }
      const l2Contracts = {
        L2BridgeWrapper: '0x1177C0d69d3eC21a35B14ddc3DFF1E1FADc747A1',
        L2Token: '0xD769b0ae3a1A63fcC9b239c1c662273882B5Dee4',
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
