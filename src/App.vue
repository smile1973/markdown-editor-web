<template>
  <div id="app">
    <keep-alive>
      <router-view/>
    </keep-alive>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: 'Segoe UI', sans-serif;
  background-color: #333;
  color: white;
  height: 100vh;
  overflow: hidden;
}

#app {
  height: 100vh;
  width: 100vw;
}
</style>