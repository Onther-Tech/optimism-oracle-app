const { ethers, Contract, BigNumber } = require("ethers")
const { MerkleTree } = require("merkletreejs")

const OVM_CanonicalTransactionChain = require("./OVM_CanonicalTransactionChain.json")
const OVM_ExecutionManager = require("./OVM_ExecutionManager.json")

export class Generator {
  constructor (provider) {
    this.provider = provider
    this.ctc = new Contract(
      "0x4bf681894abec828b212c906082b444ceb2f6cf6",
      OVM_CanonicalTransactionChain.abi,
      this.provider
    )
    this.em = new Contract(
      "0x2745C24822f542BbfFB41c6cB20EdF766b5619f5",
      OVM_ExecutionManager.abi,
      this.provider
    )
  }

  setIndex (index) {
    this.index = index
  }

  async getBatchEvent () {
    const index = this.index

    const r = 250
    let to = await this.provider.getBlockNumber()
    let from = to - r

    let matching = []
    while (matching.length === 0) {
      const events = await this.ctc.queryFilter(
        this.ctc.filters,
        from,
        to
      )

      // TODO: fix issue
      // const batchEvents = events.filter(e => e.event === "TransactionBatchAppended")
      // console.log(batchEvents[0].args._prevTotalElements.toNumber(), batchEvents[0].args._batchSize.toNumber())

      matching = events.filter(
        e =>
        e.event === "TransactionBatchAppended" &&
        e.args._prevTotalElements.toNumber() <= index &&
        e.args._prevTotalElements.toNumber() + e.args._batchSize.toNumber() > index
      )

      to = from
      from = from - r
    }

    return matching[0]
  }

  fromHexString (buf) {
    if (typeof buf === 'string' && buf.startsWith('0x')) {
      return Buffer.from(buf.slice(2), 'hex')
    }

    return Buffer.from(buf)
  }

  toHexString (buf) {
    if (typeof buf === 'number') {
      return BigNumber.from(buf).toHexString()
    } else {
      return '0x' + this.fromHexString(buf).toString('hex')
    }
  }

  async getTransactions (event) {
    const transaction = await this.provider.getTransaction(
      event.transactionHash
    )
    const emGasLimit = await this.em.getMaxTransactionGasLimit()

    const transactions = []
    const txdata = this.fromHexString(transaction.data)
    // const shouldStartAtBatch = BigNumber.from(txdata.slice(4, 9))
    // const totalElementsToAppend = BigNumber.from(txdata.slice(9, 12))
    const numContexts = BigNumber.from(txdata.slice(12, 15))

    let nextTxPointer = 15 + 16 * numContexts.toNumber()
    for (let i = 0; i < numContexts.toNumber(); i++) {
      const contextPointer = 15 + 16 * i
      const context = {
        numSequencedTransactions: BigNumber.from(
          txdata.slice(contextPointer, contextPointer + 3)
        ),
        numSubsequentQueueTransactions: BigNumber.from(
          txdata.slice(contextPointer + 3, contextPointer + 6)
        ),
        ctxTimestamp: BigNumber.from(
          txdata.slice(contextPointer + 6, contextPointer + 11)
        ),
        ctxBlockNumber: BigNumber.from(
          txdata.slice(contextPointer + 11, contextPointer + 16)
        ),
      }

      for (let j = 0; j < context.numSequencedTransactions.toNumber(); j++) {
        const txDataLength = BigNumber.from(
          txdata.slice(nextTxPointer, nextTxPointer + 3)
        )
        const txData = txdata.slice(
          nextTxPointer + 3,
          nextTxPointer + 3 + txDataLength.toNumber()
        )

        transactions.push({
          transaction: {
            blockNumber: context.ctxBlockNumber.toNumber(),
            timestamp: context.ctxTimestamp.toNumber(),
            gasLimit: emGasLimit.toNumber(), // TODO: ovm 2.0 removes ExecutionManager contract.
            entrypoint: '0x4200000000000000000000000000000000000005',
            l1TxOrigin: '0x' + '00'.repeat(20),
            l1QueueOrigin: 0,
            data: this.toHexString(txData),
          },
          transactionChainElement: {
            isSequenced: true,
            queueIndex: 0,
            timestamp: context.ctxTimestamp.toNumber(),
            blockNumber: context.ctxBlockNumber.toNumber(),
            txData: this.toHexString(txData),
          },
        })

        nextTxPointer += 3 + txDataLength.toNumber()
      }
    }
    return transactions
  }

  getTransactionBatchHeader (event) {
    if (!event) {
      return
    }

    return {
      batchIndex: event.args._batchIndex.toNumber(),
      batchRoot: event.args._batchRoot,
      batchSize: event.args._batchSize.toNumber(),
      prevTotalElements: event.args._prevTotalElements.toNumber(),
      extraData: event.args._extraData,
    }
  }

  async getTransactionBatchProof() {
    const event = await this.getBatchEvent()

    const batchHeader = this.getTransactionBatchHeader(event)
    const transactions = await this.getTransactions(event)

    const elements = []
    for (
      let i = 0;
      i < Math.pow(2, Math.ceil(Math.log2(transactions.length)));
      i++
    ) {
      if (i < transactions.length) {
        const tx = transactions[i]
        elements.push(
          `0x01${BigNumber.from(tx.transaction.timestamp)
            .toHexString()
            .slice(2)
            .padStart(64, '0')}${BigNumber.from(tx.transaction.blockNumber)
            .toHexString()
            .slice(2)
            .padStart(64, '0')}${tx.transaction.data.slice(2)}`
        )
      } else {
        elements.push('0x' + '00'.repeat(32))
      }
    }

    const hash = (el) => {
      return Buffer.from(ethers.utils.keccak256(el).slice(2), 'hex')
    }

    const leaves = elements.map((element) => {
      return hash(element)
    })

    const tree = new MerkleTree(leaves, hash)
    const batchIndex = this.index - batchHeader.prevTotalElements
    const treeProof = tree.getHexProof(leaves[batchIndex], batchIndex)

    return {
      transaction: transactions[batchIndex].transaction,
      transactionChainElement: transactions[batchIndex].transactionChainElement,
      transactionBatchHeader: batchHeader,
      transactionProof: {
        index: batchIndex,
        siblings: treeProof,
      },
    }
  }
}

// const generator = new Generator(
//   l1Provider,
//   CanonicalTransactionChain,
//   ExecutionManager
// )

// const index = 3596843
// generator.setIndex(index)
// generator.run()
