/* 進站密碼閘。
   注意：這是純前端檢查，只擋隨手點進來的人。看原始碼、停用 JS、或用 curl 直接抓
   HTML 都能繞過——靜態站沒有伺服器端可以驗證。真要保密就別放公開 repo。
   因此這裡只存密碼的 SHA-256，不存明文：至少翻原始碼撿不到密碼本身。 */
(function () {
  var HASH = '86820c564f53562a063d12b83737a6816d95c0367d57d3a580f2914807db521c';
  var KEY = 'report-gate';

  // 已解鎖過就完全不介入，連隱藏都不做，避免閃爍
  try { if (sessionStorage.getItem(KEY) === HASH) return; } catch (e) {}

  // 在 head 就先擋住內容，否則使用者會先瞄到一眼報告再跳出密碼框。
  // 用 visibility 而非 display，遮罩本身再設回 visible 就能單獨顯示。
  var hide = document.createElement('style');
  hide.textContent =
    'body{visibility:hidden}' +
    '#gate{visibility:visible;position:fixed;inset:0;z-index:9999;display:flex;' +
    'align-items:center;justify-content:center;padding:24px;background:#f9f9f7;' +
    'font:400 16px/1.6 system-ui,-apple-system,"PingFang TC","Noto Sans TC",sans-serif;' +
    'color:#0b0b0b}' +
    '#gate form{width:100%;max-width:320px;text-align:center}' +
    '#gate h2{font-size:19px;font-weight:650;margin:0 0 6px}' +
    '#gate p{font-size:13px;color:#898781;margin:0 0 20px}' +
    '#gate input{width:100%;padding:11px 14px;font:inherit;font-size:16px;' +
    'border:1px solid rgba(11,11,11,.18);border-radius:10px;background:#fcfcfb;' +
    'color:inherit;text-align:center}' +
    '#gate input:focus{outline:2px solid #2a78d6;outline-offset:-1px}' +
    '#gate button{width:100%;margin-top:10px;padding:11px 14px;font:inherit;' +
    'font-size:15px;font-weight:600;border:0;border-radius:10px;background:#0b0b0b;' +
    'color:#fff;cursor:pointer}' +
    '#gate .err{min-height:20px;margin:12px 0 0;font-size:13px;color:#d03b3b}' +
    '@media (prefers-color-scheme:dark){' +
    '#gate{background:#0d0d0d;color:#fff}' +
    '#gate input{background:#1a1a19;border-color:rgba(255,255,255,.16)}' +
    '#gate button{background:#fff;color:#0b0b0b}' +
    '#gate .err{color:#e66767}}';
  document.head.appendChild(hide);

  function sha256(text) {
    var bytes = new TextEncoder().encode(text);
    return crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) {
        return ('0' + b.toString(16)).slice(-2);
      }).join('');
    });
  }

  function build() {
    var gate = document.createElement('div');
    gate.id = 'gate';
    gate.innerHTML =
      '<form autocomplete="off">' +
      '<h2>投資組合日報</h2>' +
      '<p>請輸入密碼以檢視</p>' +
      '<input type="password" id="gate-pw" autocomplete="current-password" ' +
      'autofocus aria-label="密碼">' +
      '<button type="submit">進入</button>' +
      '<p class="err" id="gate-err" role="alert"></p>' +
      '</form>';
    document.body.appendChild(gate);

    var input = gate.querySelector('#gate-pw');
    var err = gate.querySelector('#gate-err');
    input.focus();

    // crypto.subtle 只在 https / localhost 這類安全來源存在，file:// 開會是 undefined
    if (!(window.crypto && crypto.subtle)) {
      err.textContent = '請以 https 或 localhost 開啟本頁。';
      return;
    }

    gate.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      err.textContent = '';
      sha256(input.value).then(function (digest) {
        if (digest !== HASH) {
          err.textContent = '密碼錯誤';
          input.value = '';
          input.focus();
          return;
        }
        try { sessionStorage.setItem(KEY, HASH); } catch (e2) {}
        hide.remove();
        gate.remove();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
