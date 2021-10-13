<template>
  <div style="margin-top: 16px; display: flex;">
    <el-descriptions title="L1" :column="1" border style="margin-top: 16px; margin-right: 8px;">
      <el-descriptions-item label="L1 ETH">{{ $store.state.l1ETHBalance }}</el-descriptions-item>
      <el-descriptions-item label="L1 TON">{{ $store.state.l1TONBalance }}</el-descriptions-item>
    </el-descriptions>
    <el-descriptions title="L2" :column="1" border style="margin-top: 16px; margin-left: 8px;">
      <el-descriptions-item label="L2 ETH">{{ $store.state.l2ETHBalance }}</el-descriptions-item>
      <el-descriptions-item label="L2 TON">{{ $store.state.l2TONBalance }}</el-descriptions-item>
    </el-descriptions>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>

</style>