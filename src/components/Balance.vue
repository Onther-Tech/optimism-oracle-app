<template>
  <div style="margin-top: 16px;">
    <div>L1 ETH: {{ $store.state.l1ETHBalance }}</div>
    <div>L1 TON: {{ $store.state.l1TONBalance }}</div>
    <div style="margin-top: 8px;">L2 ETH: {{ $store.state.l2ETHBalance }}</div>
    <div>L2 TON: {{ $store.state.l2TONBalance }}</div>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>

</style>