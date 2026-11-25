/* محرك تحليل الروابط.
   يجمع بين: قائمة الجهات الرسمية + فحص بنية الرابط + فحص مباشر عبر الإنترنت
   (قوائم المواقع الضارة من Cloudflare، ووجود النطاق، وتاريخ تسجيله عبر RDAP).
   لا يُفتح الموقع المفحوص نفسه، ولا يُرسل للخدمات إلا اسم النطاق. */
(function (root) {
  var data = typeof module !== 'undefined' && module.exports ? require('./official-domains.js') : root.TabayyanData;
  var ENTITIES = data.ENTITIES;

  var HIGH = 60, MEDIUM = 30, TIMEOUT = 5000;

  var SECOND_LEVEL = /^(com|net|org|gov|edu|med|sch|pub|co|ac|mil|gob|govt|or|ne|go|ltd|plc|nom)$/;
  var HOSTING = ['github.io', 'gitlab.io', 'web.app', 'firebaseapp.com', 'vercel.app', 'netlify.app', 'pages.dev', 'workers.dev', 'r2.dev', 'blogspot.com', 'wordpress.com', 'weebly.com', 'weeblysite.com', 'wixsite.com', 'wixstudio.com', 'godaddysites.com', 'webflow.io', 'framer.app', 'framer.website', 'glitch.me', 'herokuapp.com', 'onrender.com', 'surge.sh', 'repl.co', 'replit.app', 'ngrok.io', 'ngrok-free.app', 'trycloudflare.com', '000webhostapp.com', 'altervista.org', 'duckdns.org', 'square.site', 'mystrikingly.com', 'carrd.co', 'lovable.app', 'azurewebsites.net', 'blob.core.windows.net', 'amazonaws.com', 'appspot.com', 'run.app', 'myshopify.com'];
  var USER_CONTENT = ['sites.google.com', 'docs.google.com', 'forms.gle', 'drive.google.com', 'script.google.com', 'storage.googleapis.com', 'forms.office.com', '1drv.ms', 'sharepoint.com', 'sway.office.com', 'raw.githubusercontent.com', 'gist.github.com', 'linktr.ee', 'telegra.ph', 'jotform.com', 'typeform.com'];
  var SHORT = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'v.gd', 'ow.ly', 'buff.ly', 'cutt.ly', 'rebrand.ly', 'rb.gy', 'shorturl.at', 't.ly', 'bl.ink', 'tiny.cc', 's.id', 'shorte.st', 'adf.ly', 'lnkd.in', 'qrco.de', 'urlz.fr', 'surl.li', 'tiny.one', 'dub.sh', 'short.io', 'smarturl.it', 'clck.ru', 'u.to'];
  var BAD_TLD = ['xyz', 'top', 'click', 'shop', 'icu', 'buzz', 'online', 'site', 'live', 'tk', 'ml', 'ga', 'cf', 'gq', 'vip', 'cyou', 'cfd', 'sbs', 'rest', 'bond', 'quest', 'lol', 'monster', 'link', 'work', 'fun', 'space', 'website', 'club', 'store', 'support', 'help', 'zip', 'mov', 'win', 'loan', 'men', 'date', 'stream', 'pw', 'cc', 'ws', 'su', 'best', 'today', 'life', 'world', 'finance', 'fit', 'autos', 'beauty', 'hair', 'skin', 'lat', 'pics', 'mom', 'cam', 'rip', 'kim', 'gdn'];
  var LURE = /^(log-?in|logon|sign-?in|signin|verify|verification|verif|secure|security|update|confirm|account|accounts|unlock|suspended|otp|password|wallet|payment|pay|billing|invoice|refund|prize|gift|gifts|winner|reward|rewards|bonus|free|offer|offers|promo|claim|support|help|service|services|customer|token|card|tracking|track|parcel|delivery|customs|fine|fines|activate|activation|renew|recover|auth|authentication|id|sso|portal|online)$/;
  var STRONG_LURE = /(login|signin|verify|verif|secure|confirm|account|password|unlock|suspend|refund|prize|winner|reward|activat|renew|wallet)/;
  var BANKY = /^(bank|banks|banking|ebank|masraf|banque|mybank|onlinebank|sabank|saudibank|bankonline)$/;
  var GOVY = /^(gov|govsa|govt|government|ministry|moj|mofa|moc|mci|saudigov|ksagov|hukuma|wizara)$/;
  var EXE = /\.(apk|exe|msi|scr|bat|cmd|js|jar|vbs|ps1|dmg|iso|zip|rar|7z|mobileconfig|ipa)$/i;
  var CYR = { 'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ɡ': 'g', 'һ': 'h', 'ӏ': 'l', 'к': 'k', 'м': 'm', 'т': 't', 'в': 'b', 'н': 'h', 'α': 'a', 'ο': 'o', 'ν': 'v', 'ρ': 'p', 'τ': 't', 'ι': 'i', 'κ': 'k', 'ь': 'b', 'ԛ': 'q', 'ԝ': 'w' };

  // ---------- أدوات ----------
  function under(host, dom) { return host === dom || host.slice(-dom.length - 1) === '.' + dom; }
  function anyUnder(host, list) { for (var i = 0; i < list.length; i++) if (under(host, list[i])) return list[i]; return null; }
  function ltr(s) { return '⁦' + s + '⁩'; }

  function registrable(host) {
    var hosted = anyUnder(host, HOSTING), p = host.split('.');
    if (hosted && host !== hosted) return p.slice(-(hosted.split('.').length + 1)).join('.');
    if (p.length <= 2) return host;
    var n = p[p.length - 1].length === 2 && SECOND_LEVEL.test(p[p.length - 2]) ? 3 : 2;
    return p.slice(-n).join('.');
  }

  function fold(s) {
    return s.replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/0/g, 'o').replace(/[1!|]/g, 'l').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/8/g, 'b');
  }

  // مسافة التعديل مع احتساب تبديل حرفين متجاورين كخطأ واحد
  function dist(a, b) {
    var i, j, m = [];
    if (Math.abs(a.length - b.length) > 2) return 9;
    for (i = 0; i <= a.length; i++) { m[i] = [i]; }
    for (j = 0; j <= b.length; j++) m[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) m[i][j] = Math.min(m[i][j], m[i - 2][j - 2] + 1);
    }
    return m[a.length][b.length];
  }

  function punyLabel(label) {
    if (label.slice(0, 4) !== 'xn--') return label;
    try {
      var input = label.slice(4), n = 128, i = 0, bias = 72, out = [], b = input.lastIndexOf('-'), j, k;
      if (b > 0) out = input.slice(0, b).split('').map(function (c) { return c.charCodeAt(0); });
      for (j = b > 0 ? b + 1 : 0; j < input.length;) {
        var old = i, w = 1;
        for (k = 36; ; k += 36) {
          var c = input.charCodeAt(j++), digit = c - 48 < 10 ? c - 22 : c - 97;
          if (!(digit >= 0 && digit < 36)) return label;
          i += digit * w;
          var t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
          if (digit < t) break;
          w *= 36 - t;
        }
        var len = out.length + 1, delta = old === 0 ? Math.floor((i - old) / 700) : (i - old) >> 1;
        delta += Math.floor(delta / len);
        for (k = 0; delta > 455; k += 36) delta = Math.floor(delta / 35);
        bias = Math.floor(k + 36 * delta / (delta + 38));
        n += Math.floor(i / len); i %= len;
        out.splice(i++, 0, n);
      }
      return String.fromCodePoint.apply(null, out);
    } catch (e) { return label; }
  }

  function isIPv4(h) { return /^\d{1,3}(\.\d{1,3}){3}$/.test(h); }
  function isPrivate(h) { return /^(10\.|127\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h === 'localhost' || /\.(local|internal|localhost|test|invalid)$/.test(h); }

  // ---------- قراءة المدخل ----------
  function parse(raw) {
    var s = String(raw || '').replace(/[​-‏‪-‮⁠-⁩﻿]/g, '').trim();
    if (!s) return { error: 'أدخل الرابط الذي تريد تحليله.' };
    var m = s.match(/https?:\/\/[^\s<>"'،]+/i);
    if (m) s = m[0];
    else if (/\s/.test(s)) {
      s = s.split(/\s+/).filter(function (w) { return /^[^\s@]+\.[^\s.]{2,}/.test(w); })[0] || '';
      if (!s) return { error: 'لم نجد رابطاً في النص. مثال: https://example.com' };
    }
    s = s.replace(/[).,،؛!؟]+$/, '');
    if (/^(javascript|data|vbscript|file|blob):/i.test(s)) return { error: 'هذا ليس رابط موقع. أدخل رابطاً يبدأ بـ https://' };
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) && !/^https?:/i.test(s)) return { error: 'أدخل رابط موقع يبدأ بـ https:// أو http://' };
    var explicit = /^https?:\/\//i.test(s), u;
    try { u = new URL(explicit ? s : 'https://' + s); } catch (e) { return { error: 'الرابط غير صحيح. مثال: https://example.com' }; }
    var host = u.hostname.replace(/\.$/, '').toLowerCase();
    var ip = isIPv4(host) || host[0] === '[';
    if (!ip && (host.indexOf('.') < 1 || !/\.([a-z]{2,}|xn--[a-z0-9-]+)$/.test(host))) return { error: 'الرابط غير مكتمل. مثال: https://example.com' };
    if (isPrivate(host)) return { error: 'هذا عنوان داخلي وليس موقعاً على الإنترنت.' };
    return { url: u, host: host, ip: ip, explicit: explicit, shown: explicit ? s : 'https://' + s };
  }

  // ---------- الجهات ----------
  function officialOf(host) {
    for (var i = 0; i < ENTITIES.length; i++) {
      var e = ENTITIES[i], hit = anyUnder(host, e.d);
      if (hit) return { entity: e, domain: hit, gov: /\.gov\.sa$/.test(hit) };
    }
    if (/\.gov\.sa$/.test(host)) return { entity: { name: 'جهة حكومية سعودية', generic: true }, domain: registrable(host), gov: true };
    if (/\.edu\.sa$/.test(host)) return { entity: { name: 'جهة تعليمية سعودية', generic: true }, domain: registrable(host), edu: true };
    return null;
  }

  // جهة عامة (مثل أي نطاق gov.sa غير مدرج) نعرف نوعها دون اسمها
  function targetOf(e) { return { type: e.t || 'gov', entity: e.generic ? null : e }; }

  // اسم الجهة نفسه مع حرف زائد: aabsher. الأسماء القصيرة يُقبل لها تكرار حرف فقط: najizz
  function extraLetter(tok, k, type) {
    if (tok.length !== k.length + 1) return false;
    if (k.length >= 6) return tok.indexOf(k) >= 0;
    if (k.length < 5 && !(k.length === 4 && type === 'gov')) return false;
    for (var i = 1; i < tok.length; i++) if (tok[i] === tok[i - 1] && tok.slice(0, i) + tok.slice(i + 1) === k) return true;
    return false;
  }

  function impersonates(tokens, sldTokens) {
    var i, j, t, e, k, f;
    for (i = 0; i < ENTITIES.length; i++) {
      e = ENTITIES[i];
      for (j = 0; j < e.k.length; j++) {
        k = e.k[j];
        for (t = 0; t < tokens.length; t++) {
          if (k[0] !== '=' && extraLetter(tokens[t], k, e.t)) return { entity: e, how: 'extra', key: k };
          if (k[0] === '=' ? tokens[t] === k.slice(1) : tokens[t] === k || (k.length >= 6 && tokens[t].indexOf(k) >= 0)) return { entity: e, how: 'name', key: k };
        }
      }
    }
    for (i = 0; i < ENTITIES.length; i++) {
      e = ENTITIES[i];
      for (j = 0; j < e.k.length; j++) {
        k = e.k[j];
        if (k.length < 6 || k[0] === '=') continue;
        for (t = 0; t < sldTokens.length; t++) {
          f = fold(sldTokens[t]);
          if (f === k || f.indexOf(k) >= 0 || dist(f, k) === 1 || (k.length >= 9 && dist(f, k) === 2)) return { entity: e, how: 'typo', key: k };
        }
      }
    }
    return null;
  }

  // ---------- الفحص المباشر ----------
  function getJSON(url, accept) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, TIMEOUT);
    return fetch(url, { headers: { accept: accept }, signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { status: r.status, url: r.url, body: j }; }); })
      .catch(function () { return null; })
      .then(function (r) { clearTimeout(t); return r; });
  }

  function live(p, reg) {
    if (p.ip) return Promise.resolve({ ok: true, ip: true });
    var h = encodeURIComponent(p.host), d = 'application/dns-json';
    var tld = reg.split('.').pop();
    var rdap = tld === 'com' || tld === 'net' ? 'https://rdap.verisign.com/' + tld + '/v1/domain/' + reg
      : tld === 'sa' ? null : 'https://rdap.org/domain/' + reg;
    if (anyUnder(p.host, HOSTING) || SHORT.indexOf(reg) >= 0) rdap = null; // عمر المنصة لا يدل على عمر الصفحة
    return Promise.all([
      getJSON('https://cloudflare-dns.com/dns-query?name=' + h + '&type=A', d),
      getJSON('https://security.cloudflare-dns.com/dns-query?name=' + h + '&type=A', d),
      rdap ? getJSON(rdap, 'application/rdap+json') : null,
      getJSON('https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(reg) + '&type=NS', d)
    ]).then(function (r) {
      var dns = r[0] && r[0].body, sec = r[1] && r[1].body, rd = r[2], ns = r[3] && r[3].body, out = { ok: !!dns };
      if (dns) {
        out.hasAddr = (dns.Answer || []).some(function (a) { return a.type === 1 || a.type === 5; });
        out.missing = dns.Status === 3;
        out.regMissing = !!ns && ns.Status === 3;
      }
      if (sec) {
        out.secOk = true;
        out.blocked = (sec.Answer || []).some(function (a) { return a.data === '0.0.0.0'; }) && /Censored|Blocked|Filtered/i.test(JSON.stringify(sec.Comment || ''));
      }
      if (rd && rd.status === 200 && rd.body && rd.body.events) {
        var ev = rd.body.events.filter(function (e) { return e.eventAction === 'registration'; })[0];
        var ts = ev && Date.parse(ev.eventDate);
        if (ts) out.ageDays = Math.max(0, Math.floor((Date.now() - ts) / 864e5));
      }
      return out;
    });
  }

  // ---------- صياغة ----------
  function ar(n, one, two, few, many) { return n === 1 ? one : n === 2 ? two : n <= 10 ? n + ' ' + few : n + ' ' + many; }
  function ageText(d) {
    if (d < 1) return 'اليوم';
    if (d < 60) return 'قبل ' + ar(d, 'يوم', 'يومين', 'أيام', 'يوماً');
    if (d < 365) return 'قبل ' + ar(Math.floor(d / 30), 'شهر', 'شهرين', 'أشهر', 'شهراً');
    return 'قبل ' + ar(Math.floor(d / 365), 'سنة', 'سنتين', 'سنوات', 'سنة');
  }

  // ---------- التقييم ----------
  function score(p, net) {
    var host = p.host, u = p.url, reg = p.ip ? host : registrable(host);
    var rows = [], good = [], total = 5;
    function bad(w, icon, title, desc) { total += w; rows.push({ w: w, kind: 'bad', icon: icon, title: title, desc: desc }); }

    var labels = host.split('.'), tld = labels[labels.length - 1];
    var uni = p.ip ? [host] : labels.map(punyLabel);
    var deconf = uni.map(function (l) { return l.replace(/[^\x00-\x7f]/g, function (c) { return CYR[c] || c; }); });
    var sufLen = p.ip ? 0 : Math.max(1, registrable(host).split('.').length - 1);
    var nameLabels = p.ip ? [] : deconf.slice(0, deconf.length - sufLen);
    var tokens = nameLabels.join('-').split(/[-_]+/).filter(Boolean);
    var sld = nameLabels.length ? nameLabels[nameLabels.length - 1] : '';
    var sldTokens = [sld, sld.replace(/-/g, '')].concat(sld.split('-')).filter(function (v, i, a) { return v && a.indexOf(v) === i; });
    var homograph = uni.some(function (l, i) { return l !== deconf[i]; });

    var off = p.ip ? null : officialOf(host);
    var userContent = anyUnder(host, USER_CONTENT) || (off && off.entity.host && host !== off.domain && host !== 'www.' + off.domain ? host : null);
    var gone = !!(net.missing || (net.ok && !net.ip && net.hasAddr === false));
    var official = off && !userContent && !net.blocked && !(gone && net.missing);

    // --- قائمة التهديدات ---
    if (net.blocked) bad(90, 'i-ban', 'مدرج في قوائم المواقع الضارة', 'النطاق مصنّف كموقع ضار أو تصيّد في قوائم الحماية العالمية.');

    // --- تحويل إلى موقع آخر ---
    var redirectTo = null;
    u.searchParams.forEach(function (v) {
      var m = /^(https?:)?\/\/([^\/?#]+)/i.exec(v);
      if (m && !redirectTo && !under(m[2].toLowerCase(), reg)) redirectTo = m[2].toLowerCase();
    });
    if (redirectTo) bad(official ? 32 : 14, 'i-link', 'تحويل إلى موقع آخر', 'الرابط يحوّلك إلى ' + ltr(redirectTo.slice(0, 50)) + ' بعد فتحه.');

    // الجهة المعنية بالبلاغ: صاحبة الموقع الرسمي، أو الجهة المنتحلة
    var target = official ? targetOf(off.entity) : null;

    if (!official) {
      var genericName = null, claim = null, officialInside = null;

      // --- انتحال جهة ---
      ENTITIES.forEach(function (e) {
        e.d.forEach(function (d) { if (!officialInside && !under(host, d) && ('.' + host + '.').indexOf('.' + d + '.') >= 0) officialInside = e; });
      });
      if (!officialInside && /(^|[.-])gov[.-]sa[.-]/.test(host + '.') && !/\.gov\.sa$/.test(host)) officialInside = { name: 'الجهات الحكومية', generic: true };

      if (!p.ip && !off) claim = impersonates(tokens, sldTokens);
      if (!claim && !off && homograph) claim = impersonates(deconf, sldTokens);
      var isSaTld = tld === 'sa';
      // اسم قصير قد يخص جهة أخرى، أو نطاق قديم مستقر: نكتفي بالتنبيه بدل الجزم
      var lureHit = tokens.concat(sldTokens).some(function (t) { return STRONG_LURE.test(t); });
      var soft = claim && claim.how !== 'typo' && !lureHit && BAD_TLD.indexOf(tld) < 0 &&
        (net.ageDays > 365 * 5 || (claim.how === 'name' && (isSaTld || (claim.key.length < 6 && tokens.length === 1))));

      if (officialInside) {
        bad(50, 'i-id', 'تشابه في اسم الجهة', 'يضع عنوان ' + officialInside.name + ' داخل الرابط لإيهامك، بينما النطاق الفعلي هو ' + ltr(reg) + '.');
      } else if (claim) {
        bad(soft ? 28 : 46, 'i-id', 'تشابه في اسم الجهة', claim.how !== 'name'
          ? 'كتابة النطاق قريبة جداً من اسم جهة معروفة (' + claim.entity.name + ') مع تغيير في الأحرف.'
          : 'يستخدم اسماً مشابهاً لجهة معروفة (' + claim.entity.name + ').');
      } else if (tokens.some(function (t) { return BANKY.test(t); }) && (tokens.some(function (t) { return STRONG_LURE.test(t); }) || tokens.some(function (t) { return /^(sa|ksa|saudi|arab)$/.test(t); }))) {
        genericName = 'bank';
      } else if (!/\.(gov|gob|gouv)\.[a-z]{2}$|\.gov$/.test(host) && tokens.some(function (t) { return GOVY.test(t); })) {
        genericName = 'gov';
      }
      target = officialInside && !(officialInside.generic && claim) ? targetOf(officialInside) : claim ? targetOf(claim.entity) : genericName ? { type: genericName, entity: null } : null;
      if (genericName) bad(28, 'i-id', 'تشابه في اسم الجهة', 'يستخدم اسماً مشابهاً لجهة معروفة (مثل بنك أو جهة حكومية).');
      if ((officialInside || claim || genericName) && !userContent)
        bad(isSaTld || soft ? 10 : 22, 'i-globe', 'النطاق غير رسمي', 'لا يتبع النطاق الموقع الرسمي للجهة (مثل: ' + ltr('.com.sa') + ' أو ' + ltr('.gov.sa') + ').');

      // --- عمر النطاق ووجوده ---
      if (net.ageDays != null && !userContent) {
        var a = net.ageDays, w = a < 14 ? 40 : a < 45 ? 34 : a < 120 ? 26 : a < 240 ? 16 : a < 365 ? 10 : 0;
        if (w) bad(w, 'i-cal', 'تاريخ إنشاء حديث', 'تم إنشاء النطاق مؤخرًا (' + ageText(a) + ')، وهو نمط شائع في مواقع الاحتيال.');
        else {
          if (a > 365 * 3) total -= a > 365 * 8 ? 12 : 6;
          good.push({ kind: 'good', icon: 'i-cal', title: 'نطاق قديم', desc: 'تم تسجيل النطاق ' + ageText(a) + '، وليس نطاقاً حديث الإنشاء.' });
        }
      }
      if (gone && !net.blocked) {
        var suspicious = officialInside || claim || genericName;
        bad(suspicious ? 10 : 30, 'i-off', 'النطاق غير نشط', net.regMissing
          ? 'النطاق غير مسجّل حالياً، وهو نمط شائع في مواقع الاحتيال بعد إيقافها.'
          : 'لا يوجد موقع يعمل على هذا العنوان حالياً، وقد يكون أُوقف أو كُتب بشكل خاطئ.');
      }

      // --- بنية الرابط ---
      if (p.ip) bad(45, 'i-server', 'عنوان رقمي بدل اسم الموقع', 'الرابط يستخدم رقم خادم (IP) بدلاً من نطاق معروف، ولا تفعل الجهات الرسمية ذلك.');
      if (u.username || u.password) {
        var fake = u.username.toLowerCase(), fakeOff = officialOf(fake);
        if (fakeOff && (!target || !target.entity)) target = targetOf(fakeOff.entity);
        bad(fakeOff || /\./.test(fake) ? 52 : 36, 'i-eyeoff', 'إخفاء العنوان الحقيقي', 'يستخدم علامة @ لإخفاء وجهة الرابط الفعلية: ' + ltr(host) + '.');
      }
      if (homograph) bad(34, 'i-text', 'أحرف متشابهة مزيفة', 'يستخدم أحرفاً من لغة أخرى تشبه الحروف الإنجليزية لخداع المستخدم.');
      if (SHORT.indexOf(reg) >= 0) bad(32, 'i-eyeoff', 'رابط مختصر', 'الرابط مختصر ويخفي الوجهة الحقيقية، ولا يمكن معرفة الموقع قبل فتحه.');
      if (BAD_TLD.indexOf(tld) >= 0) bad(16, 'i-globe', 'امتداد نطاق غير معتاد', 'ينتهي بـ ' + ltr('.' + tld) + '، وهو امتداد يكثر استخدامه في المواقع الاحتيالية.');
      var hosted = anyUnder(host, HOSTING);
      if (userContent || hosted) bad(anyUnder(host, USER_CONTENT) ? 30 : 18, 'i-server', 'منصة استضافة عامة', 'الصفحة منشأة على منصة عامة (' + ltr(hosted || reg) + ') يستطيع أي شخص النشر عليها.');

      var lures = tokens.filter(function (t) { return LURE.test(t) || STRONG_LURE.test(t); }).filter(function (v, i, x) { return x.indexOf(v) === i; });
      var strong = lures.filter(function (t) { return STRONG_LURE.test(t); }).length;
      if (lures.length) {
        var lw = Math.min(13, strong * 6.5 + (lures.length - strong) * 4);
        bad(lw, 'i-text', 'كلمات استدراج في الرابط', 'يحتوي النطاق على كلمات شائعة في التصيّد مثل: ' + ltr(lures.slice(0, 3).join(', ')) + '.');
      }
      var hy = (sld.match(/-/g) || []).length;
      if (hy >= 2) bad(hy >= 3 ? 12 : 8, 'i-text', 'اسم نطاق مركّب', 'يتكون النطاق من عدة كلمات مفصولة بشرطات، وهو أسلوب شائع للتمويه.');
      if (!p.ip && nameLabels.length >= 4) bad(10, 'i-server', 'نطاقات فرعية كثيرة', 'يحتوي الرابط على نطاقات فرعية متعددة لإخفاء النطاق الفعلي ' + ltr(reg) + '.');
      if (/\d{4,}/.test(sld) || (/[a-z]\d+[a-z]+\d/.test(sld) && sld.length > 6)) bad(8, 'i-text', 'اسم نطاق عشوائي', 'يحتوي اسم النطاق على أرقام وأحرف غير مفهومة.');
      if (u.port) bad(14, 'i-server', 'منفذ غير معتاد', 'الرابط يتصل بمنفذ غير قياسي (' + u.port + ').');
      var path = ''; try { path = decodeURIComponent(u.pathname).toLowerCase(); } catch (e) { path = u.pathname.toLowerCase(); }
      var pTok = path.split(/[^a-z0-9]+/).filter(Boolean);
      if (!claim && !officialInside && net.ageDays == null) {
        var pc = impersonates(pTok, []);
        if (pc && (hosted || userContent || BAD_TLD.indexOf(tld) >= 0 || pTok.some(function (t) { return STRONG_LURE.test(t); }))) {
          bad(18, 'i-id', 'اسم جهة داخل الرابط', 'يذكر اسم جهة معروفة (' + pc.entity.name + ') داخل الرابط وهو لا يتبعها.');
          if (!target || !target.entity) target = targetOf(pc.entity);
        }
      }
      if (EXE.test(u.pathname)) bad(26, 'i-down', 'تحميل ملف مباشر', 'الرابط يحمّل ملفاً على جهازك مباشرة، وقد يكون ضاراً.');
      if (p.shown.length > 140) bad(5, 'i-text', 'رابط طويل جداً', 'طول الرابط غير معتاد وقد يُستخدم لإخفاء تفاصيله.');
    }
    if (u.protocol === 'http:') {
      if (official) rows.push({ w: 1, kind: 'warn', icon: 'i-unlock', title: 'اتصال غير مشفّر', desc: 'الرابط يبدأ بـ ' + ltr('http') + '. اكتب العنوان بـ ' + ltr('https') + ' قبل إدخال أي بيانات.' });
      else bad(12, 'i-unlock', 'اتصال غير مشفّر', 'الرابط لا يستخدم التشفير (' + ltr('HTTPS') + ')، وقد تُكشف بياناتك.');
    }

    // --- المؤشرات الإيجابية ---
    if (official) {
      if (off.gov || /\.gov\.sa$/.test(host)) good.unshift({ kind: 'good', icon: 'i-globe', title: 'نطاق حكومي رسمي', desc: 'ينتهي بـ ' + ltr('.gov.sa') + '، وهو امتداد مخصص للجهات الحكومية السعودية فقط.' });
      else if (off.edu) good.unshift({ kind: 'good', icon: 'i-globe', title: 'نطاق تعليمي رسمي', desc: 'ينتهي بـ ' + ltr('.edu.sa') + '، وهو امتداد مخصص للجهات التعليمية السعودية.' });
      else good.unshift({ kind: 'good', icon: 'i-globe', title: 'النطاق رسمي', desc: 'النطاق ' + ltr(off.domain) + ' مدرج ضمن المواقع الرسمية.' });
      if (!off.entity.generic) good.splice(1, 0, { kind: 'good', icon: 'i-id', title: 'اسم الجهة مطابق', desc: 'يعود النطاق إلى: ' + off.entity.name + '.' });
    }
    if (net.secOk && !net.blocked) good.push({ kind: 'good', icon: 'i-shield-check', title: 'غير مدرج في قوائم التهديدات', desc: 'لم يظهر النطاق في قوائم المواقع الضارة المعروفة.' });
    if (u.protocol === 'https:' && p.explicit) good.push({ kind: 'good', icon: 'i-lock', title: 'اتصال مشفّر', desc: 'يستخدم الرابط بروتوكول ' + ltr('HTTPS') + ' المشفّر.' });

    var checked = net.ok || net.ip;
    if (!official && !checked) { total += 10; rows.push({ w: 1, kind: 'warn', icon: 'i-info', title: 'تعذّر الفحص المباشر', desc: 'لم نتمكن من الاتصال بخدمات الفحص، والنتيجة مبنية على شكل الرابط فقط.' }); }

    // --- المستوى ---
    total = Math.round(total);
    var level;
    if (official) {
      total = total <= 5 ? (u.protocol === 'http:' ? 8 : 3) : total;
      level = total >= MEDIUM ? 'medium' : 'official';
      if (level === 'official') total = Math.min(total, 12);
    } else {
      if (net.blocked) total = Math.max(total, 95);
      total = Math.max(8, Math.min(98, total));
      level = total >= HIGH ? 'high' : total >= MEDIUM ? 'medium' : 'low';
      if (level === 'low' && (!checked || gone)) { level = 'medium'; total = Math.max(total, MEDIUM); }
    }

    rows.sort(function (a, b) { return b.w - a.w; });
    if (level === 'low') good.unshift({ kind: 'warn', icon: 'i-info', title: 'غير مدرج كموقع رسمي', desc: 'الموقع ليس ضمن قائمة الجهات الرسمية المسجّلة لدينا.' });
    var show;
    if (level === 'official') show = good.slice(0, rows.length ? 2 : 3).concat(rows.slice(0, 1));
    else if (level === 'low') show = good.slice(0, 1).concat(rows.slice(0, 1), good.slice(1)).slice(0, 3);
    else show = rows.concat(level === 'medium' ? good : []).slice(0, 3);

    // ترتيب العرض كما في التصميم: النطاق، ثم اسم الجهة، ثم التاريخ
    var order = ['النطاق غير رسمي', 'تشابه في اسم الجهة', 'تاريخ إنشاء حديث'];
    if (level === 'high') show.sort(function (a, b) { return ((order.indexOf(a.title) + 1) || 9) - ((order.indexOf(b.title) + 1) || 9); });

    return { level: level, score: total, rows: show, all: rows, entity: official ? off.entity.name : null, target: target, host: host, reg: reg, shown: p.shown, checked: !!checked };
  }

  function analyze(raw) {
    var p = parse(raw);
    if (p.error) return Promise.resolve({ error: p.error });
    return live(p, p.ip ? p.host : registrable(p.host)).then(function (net) { return score(p, net); });
  }

  var api = { analyze: analyze, parse: parse, score: score, registrable: registrable };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Tabayyan = api;
})(this);
