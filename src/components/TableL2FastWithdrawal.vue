<template>
  <div class="table-l2-fast-withdrawal">
    <h3>fast withdrawal transactions</h3>
    <div v-for="event in $store.state.fwEvents" :key="event.blockNumber">
      <el-link type="primary"
               :href="`https://kovan-optimistic.etherscan.io/tx/${event.blockNumber}`"
               target="_blank"
      >
        #{{ event.blockNumber }}
      </el-link>
    </div>
  </div>
</template>

<script>
export default {
}
</script>

<style scoped>
.table-l2-fast-withdrawal {
  margin-top: 60px;
  margin-bottom: 40px;
}
</style>
