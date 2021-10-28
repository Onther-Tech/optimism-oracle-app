<template>
  <div class="form-l1-proof">
    <h3>generate proof</h3>
    <el-input placeholder="index" v-model="index"></el-input>
    <el-button :loading="loading" type="primary" :disabled="!index || !$store.state.signer" @click="generate">Generate Proof</el-button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      index: '',
      loading: false,
    }
  },
  methods: {
    async generate() {
      this.loading = true
      const generator = this.$store.state.proofGenerator

      generator.setIndex(this.index)
      const proof = await generator.getTransactionBatchProof()

      this.loading = false
      console.log(proof)
    }
  },
}
</script>

<style scoped>
.form-l1-generate {
  width: 100%;
}

button {
  width: 100%;
  margin-top: 8px;
}
</style>
