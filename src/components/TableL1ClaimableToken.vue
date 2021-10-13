<template>
  <div class="table-l1-claimable-token">
    <h3>newly minted claimable tokens</h3>
    {{ $store.state.tokenInfos }}
    <div v-for="tokenInfo in $store.state.tokenInfos" :key="String(tokenInfo.transactionIndex)">
      <div>
        <!-- <h4>tokenId: {{ tokenInfo.tokenId }}</h4> -->
        <el-link type="primary"
                :href="`https://kovan-optimistic.etherscan.io/tx/${parseInt(tokenInfo.transactionIndex)+1}`"
                target="_blank"
        >
          transactionIndex: {{ parseInt(tokenInfo.transactionIndex)+1 }}
        </el-link>
        <div>
          origin: {{ tokenInfo.origin }}
        </div>
        <div>
          l1Token: {{ tokenInfo.l1Token }}
        </div>
        <div>
          l2Token: {{ tokenInfo.l2Token }}
        </div>
        <div>
          amount: {{ tokenInfo.amount }}
        </div>
        <div>
          fee: {{ tokenInfo.fee }}
        </div>
      </div>
      <el-button :loading="loading" type="primary" :disabled="!$store.state.signer" @click="buy">Buy</el-button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
    }
  },
  methods: {
    async buy () {
      const L1Auction = this.$store.state.l1Contracts.L1Auction
      const tx = await L1Auction.buy(0)

      await tx.wait();
    }
  },
}
</script>

<style scoped>
.table-l1-claimable-token {
  margin-top: 60px;
  margin-bottom: 40px;
}
</style>
