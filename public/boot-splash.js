(function bootSplashInit() {
  var root = document.documentElement;
  root.dataset.bootSplashStartedAt = String(Date.now());
  var ua = navigator.userAgent || '';
  var native = /NagaevoMasterApp/i.test(ua);
  var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  if (native) {
    root.classList.add('native-app', 'boot-splash-active');
    return;
  }

  if (mobile || (window.matchMedia && window.matchMedia('(max-width: 899px)').matches)) {
    root.classList.add('low-power', 'boot-splash-active');
  }
})();
