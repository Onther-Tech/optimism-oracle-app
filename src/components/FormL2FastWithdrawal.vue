<template>
  <div class="form-l2-fast-withdrawal">
    <h3>fast withdraw</h3>
    <el-input placeholder="amount" v-model="amount"></el-input>
    <el-input placeholder="fee" v-model="fee"></el-input>
    <el-button type="primary" :disabled="!amount || !fee || !$store.state.signer" @click="fastWithdraw">Make Transaction</el-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      amount: '',
      fee: '',
    }
  },
  methods: {
    async fastWithdraw() {
      const L2BridgeWrapper = this.$store.state.l2Contracts.L2BridgeWrapper

      const origin = this.$store.state.userAddress
      const l1Token = this.$store.state.l1Contracts.L1Token.address
      const l2Token = this.$store.state.l2Contracts.L2Token.address
      const l1Oracle = this.$store.state.l1Contracts.L1Oracle.address

      const tx = await L2BridgeWrapper.fastWithdraw(
        origin,
        l1Token,
        l2Token,
        l1Oracle,
        this.amount,
        this.fee,
        0,
        '0x'
      )
      await tx.wait()
      this.$store.dispatch('getBalance')

      this.amount = ''
      this.fee = ''
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
