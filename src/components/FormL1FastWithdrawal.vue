<template>
  <div class="form-l2-fast-withdrawal">
    <h3>process fast withdraw</h3>
    <el-input placeholder="index" v-model="index"></el-input>
    <el-button :loading="loading" type="primary" :disabled="!index || !$store.state.signer" @click="processFastWithdrawal">Make Transaction</el-button>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      index: '',
      loading: false,
    }
  },
  methods: {
    async processFastWithdrawal() {
      this.loading = true

      const L1Oracle = this.$store.state.l1Contracts.L1Oracle
      const instance = axios.create({
        baseURL: 'http://127.0.0.1:3000'
      })

      const index = this.index - 1
      const l2ChainId = 69

      let transactionProof
      try {
        transactionProof = (await instance.get(`/proofs/${index}`)).data
      } catch (_) {
        this.index = ''
        this.loading = false
        return alert('batch has not yet submitted.')
      }
      try {
        const tx = await L1Oracle.processFastWithdrawal(
          parseInt(index),
          parseInt(l2ChainId),
          transactionProof.transaction,
          transactionProof.transactionChainElement,
          transactionProof.transactionBatchHeader,
          transactionProof.transactionProof,
        )
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
