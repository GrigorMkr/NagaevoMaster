(function bootSplashInit() {
  var root = document.documentElement;
  root.dataset.bootSplashStartedAt = String(Date.now());
  var ua = navigator.userAgent || '';
  var native = /NagaevoMasterApp/i.test(ua);
  var mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

  function tryHideCapacitorSplash() {
    try {
      var cap = window.Capacitor;
      if (cap && cap.Plugins && cap.Plugins.SplashScreen) {
        cap.Plugins.SplashScreen.hide();
        return true;
      }
    } catch (error) {
      // ignore
    }
    return false;
  }

  if (native) {
    root.classList.add('native-app', 'boot-splash-active');
    var attempts = 0;
    var splashTimer = window.setInterval(function () {
      if (tryHideCapacitorSplash() || attempts >= 60) {
        window.clearInterval(splashTimer);
      }
      attempts += 1;
    }, 50);
    return;
  }

  if (mobile || (window.matchMedia && window.matchMedia('(max-width: 899px)').matches)) {
    root.classList.add('low-power', 'boot-splash-active');
  }
})();
