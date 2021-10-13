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

        L1Token: '0x65e467Cbe170B0fF8f707F4B8105daCd4A3517c0',
        L1ClaimableToken: '0x8D5Ad25Fed932d6BAC2361882E08C83cbA8EfFF4',
        L1Oracle: '0xb33f704f2C43F36Cb3cE10f111887acafDf4D3Bc',
        L1Auction: '0xfB89AFCcA4bd1e29FEd2B1D15a104D2A1324E10e',
      }
      const l2Contracts = {
        L2Token: '0x0e2F71F8DCd29D41AB3EED826B467e48c3D7519b',
        L2BridgeWrapper: '0xcdd55650a64A5C0238b779d342F681F8469Ac118',
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
