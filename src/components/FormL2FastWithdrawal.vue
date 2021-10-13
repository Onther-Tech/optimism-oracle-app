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
      const l1Token = '0x65e467Cbe170B0fF8f707F4B8105daCd4A3517c0'
      const l2Token = '0x0e2F71F8DCd29D41AB3EED826B467e48c3D7519b'
      const l1Oracle = '0xb33f704f2C43F36Cb3cE10f111887acafDf4D3Bc'

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
