!function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(root);
  else
    root.qrgen = factory(root);
}(typeof window !== 'undefined' ? window : this, function (window) {

  <%=contents%>

  return {
    canvas: QRCanvas,
  };
});
