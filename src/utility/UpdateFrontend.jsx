const updateFrontend = (itemFunction, view, onChangeView, ...args) => {
  let storedView = JSON.parse(sessionStorage.getItem(view));
  itemFunction(...args, storedView);
  sessionStorage.setItem(view, JSON.stringify(storedView));
  if (onChangeView != null) {
    onChangeView();
  }
};

export { updateFrontend };
