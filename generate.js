const { JsonRpcProvider } = require("@ethersproject/providers")
const { Contract, BigNumber } = require("ethers")
const OVM_CanonicalTransactionChain = require("./OVM_CanonicalTransactionChain.json")
const OVM_ExecutionManager = require("./OVM_ExecutionManager.json")

const l1Provider = new JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/q-eMBfmSkK7ln-wFNaokuXOhF4GTGH9w")
// const l2Provider = new JsonRpcProvider(L2_NODE_WEB3_URL)
const CanonicalTransactionChain = new Contract(
  "0x4bf681894abec828b212c906082b444ceb2f6cf6",
  OVM_CanonicalTransactionChain.abi,
  l1Provider
)
const ExecutionManager = new Contract(
  "0x2745C24822f542BbfFB41c6cB20EdF766b5619f5",
  OVM_ExecutionManager.abi,
  l1Provider
)

class Generator {
  constructor(provider, ctc, em) {
    this.provider = provider
    this.ctc = ctc
    this.em = em
  }

  async getBatchEvent () {
    const index = 3596843 // user input

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

  async run() {
    const event = await this.getBatchEvent()
    const transaction = await this.provider.getTransaction(
      event.transactionHash
    )
    const emGasLimit = await this.em.getMaxTransactionGasLimit()

    const transactions = []
    const txdata = this.fromHexString(transaction.data)
    const shouldStartAtBatch = BigNumber.from(txdata.slice(4, 9))
    const totalElementsToAppend = BigNumber.from(txdata.slice(9, 12))
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
            gasLimit: emGasLimit, // TODO: ovm 2.0 remove ExecutionManager contract.
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
}

const generator = new Generator(
  l1Provider,
  CanonicalTransactionChain,
  ExecutionManager
)

generator.run();
