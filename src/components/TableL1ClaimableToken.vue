<template>
  <div class="table-l1-claimable-token">
    <h3>newly minted claimable tokens</h3>
    <div v-for="tokenInfo in $store.state.tokenInfos" :key="String(tokenInfo.tokenId)">
      <el-descriptions class="margin-top" title="" :column="1" border style="margin-top: 32px;">
        <el-descriptions-item label="Token ID">{{ tokenInfo.tokenId }}</el-descriptions-item>
        <el-descriptions-item label="Tx Index">{{ parseInt(tokenInfo.transactionIndex)+1 }}</el-descriptions-item>
        <el-descriptions-item label="L1 Token">{{ tokenInfo.l1Token }}</el-descriptions-item>
        <el-descriptions-item label="L2 Token">{{ tokenInfo.l2Token }}</el-descriptions-item>
        <el-descriptions-item label="Amount">{{ tokenInfo.amount }}</el-descriptions-item>
        <el-descriptions-item label="Fee">{{ tokenInfo.fee }}</el-descriptions-item>
        <el-descriptions-item label="Origin">{{ tokenInfo.origin }}</el-descriptions-item>
      </el-descriptions>
      <el-button :loading="loading" type="primary" :disabled="!$store.state.signer" @click="buy" style="width: 100%; margin-top: 8px;">Buy</el-button>
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
