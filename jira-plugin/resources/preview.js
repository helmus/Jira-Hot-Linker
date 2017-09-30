// eslint-disable-next-line
window.onload = function () {
  const searchParams = new URL(document.location).searchParams;
  const title = searchParams.get('title');
  if (title) {
    document.title = title;
  }
  document.getElementById('preview').src = searchParams.get('url');
};
