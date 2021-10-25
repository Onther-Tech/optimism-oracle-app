<template>
  <div id="app">
    <ButtonConnect />
    <Balance />
    <el-tabs stretch type="border-card" class="tabs" @tab-click="switchChain">
      <el-tab-pane
        label="L1"
        clas="tab"
        stretch
      >
        <FormL1FastWithdrawal />
        <TableL1ClaimableToken />
        <FormClaim />
      </el-tab-pane>
      <el-tab-pane
        label="L2"
        class="tab"
        stretch
      >
        <FormL2FastWithdrawal />
        <TableL2FastWithdrawal />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import Balance from './components/Balance.vue'
import ButtonConnect from './components/ButtonConnect.vue'
import FormClaim from './components/FormClaim.vue'
import FormL1FastWithdrawal from './components/FormL1FastWithdrawal.vue'
import FormL2FastWithdrawal from './components/FormL2FastWithdrawal.vue'
import TableL2FastWithdrawal from './components/TableL2FastWithdrawal.vue'
import TableL1ClaimableToken from './components/TableL1ClaimableToken.vue'

export default {
  name: 'App',
  components: {
    Balance,
    ButtonConnect,
    FormClaim,
    FormL1FastWithdrawal,
    FormL2FastWithdrawal,
    TableL2FastWithdrawal,
    TableL1ClaimableToken,
  },
  created () {
    this.$store.dispatch('run')
  },
  methods: {
    switchChain(tab) {
      const label = tab._props.label

      label === 'L1' ?
      this.$store.dispatch('switchL1Chain') :
      this.$store.dispatch('switchL2Chain')
    }
  },
}
</script>

<style>
#app {
  margin-top: 100px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.tabs {
  margin-top: 40px;
  width: 532px;
}

.tab {
  width: 500px;
}
</style>
