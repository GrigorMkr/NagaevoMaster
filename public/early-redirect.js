(function () {
  var host = location.hostname;
  if (host === 'www.nagaevomaster.ru') {
    location.replace('https://nagaevomaster.ru' + location.pathname + location.search + location.hash);
    return;
  }
  if (
    location.protocol === 'http:'
    && host !== 'localhost'
    && host !== '127.0.0.1'
  ) {
    location.replace('https://nagaevomaster.ru' + location.pathname + location.search + location.hash);
    return;
  }

  // OAuth return in system browser / Chrome Custom Tab: open the app before React loads.
  if (location.pathname === '/auth/app-return') {
    var search = location.search;
    if (
      search
      && (search.indexOf('handoff=') !== -1 || search.indexOf('oauth_error=') !== -1)
      && navigator.userAgent.indexOf('NagaevoMasterApp') === -1
    ) {
      var scheme = 'ru.nagaevomaster.app://auth' + search;
      location.replace(scheme);
      if (/Android/i.test(navigator.userAgent)) {
        setTimeout(function () {
          var intent =
            'intent://auth' + search
            + '#Intent;scheme=ru.nagaevomaster.app;package=ru.nagaevomaster.app;'
            + 'S.browser_fallback_url=' + encodeURIComponent('https://nagaevomaster.ru/auth/app-return' + search)
            + ';end';
          location.replace(intent);
        }, 300);
      }
    }
  }
})();
