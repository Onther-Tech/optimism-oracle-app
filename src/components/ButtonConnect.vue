<template>
  <div>
    <el-button
      type="primary"
      round
      @click="connect"
    >
      {{ this.$store.state.signer ? this.$store.state.userAddress : 'Connect' }}
    </el-button>
  </div>
</template>

<script>
export default {
  methods: {
    connect () {
      this.$store.dispatch('connect')
    }
  },
}
</script>

<style scoped>
</style>