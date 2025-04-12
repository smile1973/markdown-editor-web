<template>
  <div class="home">
    <h1>Markdown Editor</h1>
    <MarkdownEditor />
  </div>
</template>

<script>
import MarkdownEditor from '@/components/MarkdownEditor.vue';

export default {
  name: 'HomeView',
  components: {
    MarkdownEditor
  }
};
</script>

<style>
.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #333;
  color: white;
}

.home h1 {
  text-align: center;
  margin: 20px 0;
}
</style>