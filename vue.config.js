const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    port: 8080,
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      },
      '/public': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
