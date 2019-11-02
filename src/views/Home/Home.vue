<template lang="pug">
  .content-home
    img.img-login(src="../../assets/LogoWolox-Original.png")
    <LoginInput/>
</template>

<script>
import LoginInput from '@/components/LoginInput.vue'

export default {
  name: 'home',
  components: {
    LoginInput
  }
}
</script>
<style scoped lang="scss">
@import '../../scss/variables/colors';

.content-home {
  background-color: $Wild-Sand;
  border-top: 8px solid $Cerulean;
  height: 634px;
  width: 300px;
}

.img-login{
  padding: 10px;
}
</style>
