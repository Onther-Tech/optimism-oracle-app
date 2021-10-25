<template>
  <div class="form-l2-fast-withdrawal">
    <h3>claim</h3>
    <el-input placeholder="tokenId" v-model="tokenId"></el-input>
    <el-button :loading="loading" type="primary" :disabled="!tokenId || !$store.state.signer" @click="claim">Make Transaction</el-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tokenId: '',
      loading: false,
    }
  },
  methods: {
    async claim() {
      this.loading = true
      const batchHeader = {
        batchIndex: '0x01c15d',
        batchRoot: '0x8fb007bcaaf04b9c7df76e039994707112cdf64634cbf6b2ac835dd07ec7a34f',
        batchSize: '0x08',
        prevTotalElements: '0x1969d5',
        extraData: '0x000000000000000000000000000000000000000000000000000000006167c7a0000000000000000000000000d85ef8682f7a2ecc5930c8f4ed930d524037528c',
      }

      const L1Oracle = this.$store.state.l1Contracts.L1Oracle
      try {
        console.log(this.tokenId)
        const tx = await L1Oracle.claim(batchHeader, this.tokenId)
        await tx.wait()
        this.index = ''
        this.loading = false
      } catch (err) {
        this.index = ''
        this.loading = false
      }
    }
  },
}
</script>

<style scoped>
.form-l2-fast-withdrawal {
  width: 100%;
}

button {
  width: 100%;
  margin-top: 8px;
}
</style>
