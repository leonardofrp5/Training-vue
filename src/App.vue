<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style lang="scss">
#app {
  align-items: center;
  color: #2c3e50;
  display: flex;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  height: 100vh;
  justify-content: center;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  -webkit-font-smoothing: antialiased;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
