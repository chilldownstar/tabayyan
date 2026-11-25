(function () {
  var $ = function (id) { return document.getElementById(id); };
  var MIN_WAIT = 1100, seq = 0, currentUrl = '';

  // نصوص كل مستوى — مستوى "high" مطابق للتصميم حرفياً
  // الرابط السليم (official و low) نتيجته مختصرة: بدون خطوات ولا توصيات ولا إبلاغ
  var COPY = {
    high: {
      icon: 'i-shield-excl', badge: 'اشتباه مرتفع', lead: 'تحذير:', title: 'الرابط على الأرجح احتيالي',
      sub: 'تم اكتشاف عدة مؤشرات تدل على أن الرابط قد يكون موقعاً للتصيد أو انتحال الهوية.',
      ind: 'أبرز مؤشرات الاشتباه', gauge: 'مرتفع',
      mean: ['هناك مؤشرات قوية على أن هذا الرابط', 'قد يكون مزيفاً ويهدف إلى سرقة', 'بياناتك الشخصية أو البنكية.'].join(String.fromCharCode(10)),
      recs: [['i-ban', 'لا تفتح الرابط مرة أخرى.'], ['i-card', 'لا تُدخل أي بيانات شخصية أو بنكية.'], ['i-down', 'لا تُحمّل أي ملفات من الموقع.'], ['i-trash', 'احذف الرسالة المشبوهة.'], ['i-horn', 'أبلغ الجهة المختصة عند الحاجة.']]
    },
    medium: {
      icon: 'i-shield-excl', badge: 'اشتباه متوسط', lead: 'تنبيه:', title: 'الرابط مشبوه ويحتاج إلى تحقق',
      sub: 'تم اكتشاف مؤشرات تستدعي الحذر قبل فتح الرابط أو إدخال بياناتك.',
      ind: 'أبرز مؤشرات الاشتباه', gauge: 'متوسط',
      mean: 'لا يمكن الجزم بأن الرابط احتيالي، لكن فيه ما يستدعي الحذر. تحقق من الجهة قبل إدخال بياناتك.',
      recs: [['i-globe', 'تأكد من الموقع عبر الجهة الرسمية.'], ['i-card', 'لا تُدخل أي بيانات شخصية أو بنكية.'], ['i-down', 'لا تُحمّل أي ملفات من الموقع.'], ['i-lock', 'لا تشارك رمز التحقق مع أحد.'], ['i-horn', 'أبلغ الجهة المختصة عند الحاجة.']]
    },
    low: {
      icon: 'i-shield-check', badge: 'اشتباه منخفض', lead: 'نتيجة الفحص:', title: 'لم تظهر مؤشرات احتيال',
      sub: 'لا توجد مؤشرات على وجود تهديدات حالياً، لكن الموقع غير مدرج ضمن المواقع الرسمية.',
      ind: 'أبرز مؤشرات الفحص', gauge: 'منخفض',
      mean: 'لم نجد ما يدل على الاحتيال، لكن هذا لا يعني أن الموقع رسمي. تأكد من الجهة قبل إدخال بياناتك.',
      compact: true
    },
    official: {
      icon: 'i-shield-check', badge: 'موقع رسمي', lead: 'تم التحقق:', title: 'الرابط سليم',
      sub: 'لا توجد مؤشرات على وجود تهديدات حالياً.',
      ind: 'أبرز مؤشرات الأمان', gauge: 'منخفض',
      mean: 'النطاق مطابق للموقع الرسمي للجهة، ولم تظهر مؤشرات على التصيد أو انتحال الهوية.',
      compact: true
    }
  };

  function icon(name, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '#' + name); s.appendChild(u); s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    return s;
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function fill(node, kids) { node.textContent = ''; kids.forEach(function (k) { node.appendChild(k); }); }

  // ---------- الإبلاغ والتواصل ----------
  // img أو icon: الشعار، وبدون جهة معروفة يظهر الصف كما في التصميم الأصلي
  var ANY_BANK = { name: 'البنك المعني', sub: 'خدمة العملاء', val: 'حسب البنك', icon: 'i-bank' };
  var ANY_GOV = { name: 'الجهة الحكومية', sub: 'المعنية بالخدمة', val: 'حسب الجهة', icon: 'i-gov' };
  var SAMA = { name: 'البنك المركزي السعودي', sub: 'SAMA', val: '8001256666', img: 'assets/sama.png' };
  var AMER = { name: 'المنصة الوطنية', sub: 'مركز آمر', val: '199099', icon: 'i-globe' };
  var CST = { name: 'هيئة الاتصالات', sub: 'CST', val: '19966', icon: 'i-globe' };
  var POLICE = { name: 'الجهات الامنية', sub: 'الجرائم المعلوماتية', val: '911', img: 'assets/emblem-ksa.png' };
  var ICON = { gov: 'i-gov', bank: 'i-bank', co: 'i-id' };
  var LABEL = { gov: 'مركز الاتصال', bank: 'خدمة العملاء', co: 'خدمة العملاء' };

  function contactsFor(t) {
    if (!t) return [ANY_BANK, SAMA, POLICE];
    var e = t.entity, first;
    if (!e) first = t.type === 'gov' ? ANY_GOV : ANY_BANK;
    else if (e.anyBank) first = ANY_BANK;
    else first = { name: e.s || e.name, sub: e.c ? e.l || LABEL[t.type] : 'الموقع الرسمي', val: e.c || e.d[0], icon: ICON[t.type] };
    var second = t.type === 'bank' ? SAMA : t.type === 'co' || first.val === AMER.val ? CST : AMER;
    return [first, second, POLICE];
  }
  function phone(v) { return v.replace(/^(800)(\d{3})(\d{4})$/, '$1 $2 $3'); }
  function ltr(v) { return String.fromCharCode(0x2066) + v + String.fromCharCode(0x2069); }

  // ---------- ماذا تفعل إذا أدخلت بياناتك بالفعل؟ ----------
  // خطوات البنك المعني مطابقة للتصميم، وغيرها حسب نوع الجهة المنتحلة (الحقل a في official-domains.js)
  var CALL_BANK = ['i-bank', 'تواصل فورًا مع البنك', 'عبر قنواته الرسمية.'];
  var STOP_CARD = ['i-card', 'اطلب إيقاف البطاقة', 'أو اتخاذ الاجراء المناسب.'];
  var NEW_PASS = ['i-lock', 'غير كلمات المرور', 'من جهاز موثوق.'];
  var NO_NAFATH = ['i-ban', 'ارفض أي طلب نفاذ', 'لم تطلبه بنفسك.'];
  var NAFATH_PASS = ['i-lock', 'غير كلمة مرور النفاذ', 'من موقع ' + ltr('iam.gov.sa') + ' الرسمي.'];
  var NO_OTP = ['i-eyeoff', 'لا تشارك رمز التحقق', 'مع أي شخص.'];
  var TWO_STEP = ['i-shield-check', 'فعّل التحقق بخطوتين', 'من إعدادات الحساب.'];

  function stepsFor(t) {
    if (!t) return [['i-bank', 'تواصل فورًا مع البنك', 'إذا أدخلت بيانات بطاقتك.'], STOP_CARD, NEW_PASS];
    var e = t.entity;
    if (!e || e.anyBank) return t.type === 'gov' ? [NO_NAFATH, NAFATH_PASS, ['i-gov', 'بلّغ الجهة الحكومية', 'عبر قنواتها الرسمية.']] : [CALL_BANK, STOP_CARD, NEW_PASS];
    var name = e.s || e.name, site = ltr(e.d[0]);
    var via = e.c ? 'على الرقم ' + ltr(phone(e.c)) + '.' : 'عبر موقع ' + site + '.';
    var report = [ICON[t.type], 'بلّغ ' + name, via];
    var pass = ['i-lock', 'غير كلمة المرور فورًا', 'من موقع ' + site + ' الرسمي.'];
    var card = ['i-card', 'أوقف بطاقتك عبر بنكك', 'إذا أدخلت بياناتها.'];
    switch (e.a || { gov: 'nafath', bank: 'bank' }[t.type]) {
      case 'own': return [pass, NO_NAFATH, report];
      case 'nafath': return [NO_NAFATH, NAFATH_PASS, report];
      case 'acct': return [pass, NO_OTP, report];
      case 'bank': return [['i-bank', e.c ? 'تواصل فورًا مع البنك' : 'تواصل فورًا مع ' + name, via], STOP_CARD, NEW_PASS];
      case 'tel': return [pass, ['i-id', 'راجع أرقامك المسجلة', 'عبر خدمة أرقامي.'], report];
      case 'app': return [pass, ['i-off', 'سجّل الخروج', 'من جميع الأجهزة.'], TWO_STEP];
      case 'chat': return [['i-off', 'أنهِ الجلسات الأخرى', 'من إعدادات التطبيق.'], TWO_STEP, ['i-horn', 'نبّه جهات اتصالك', 'من أي رسائل باسمك.']];
      default: return [card, NEW_PASS, report];
    }
  }

  function contactBox(c) {
    var box = el('div', 'c-box'), tx = el('div'), val = el('strong', /[a-z]/.test(c.val) ? 'c-url' : '', phone(c.val)), pic;
    if (/^[\d a-z.-]+$/i.test(c.val)) val.dir = 'ltr';
    tx.appendChild(el('b', '', c.name)); tx.appendChild(el('span', '', '(' + c.sub + ')')); tx.appendChild(val);
    if (c.img) { pic = el('img'); pic.src = c.img; pic.alt = ''; } else pic = icon(c.icon);
    box.appendChild(tx); box.appendChild(pic);
    return box;
  }

  function render(r) {
    var c = COPY[r.level];
    currentUrl = r.shown;
    $('result').dataset.level = r.level;
    $('result').classList.toggle('compact', !!c.compact);
    $('bIcon').setAttribute('href', '#' + c.icon);
    $('bBadge').textContent = c.badge;
    $('bLead').textContent = c.lead;
    $('bTitle').textContent = c.title;
    $('bSub').textContent = r.level === 'official' ? 'يعود النطاق إلى: ' + r.entity + '، و' + c.sub : c.sub;
    $('uVal').textContent = r.shown;
    $('indTitle').textContent = c.ind;
    fill($('indList'), r.rows.map(function (x) {
      var li = el('li', 'k-' + x.kind), ic = el('div', 'i-ic'), tx = el('div', 'i-tx');
      ic.appendChild(icon(x.icon)); tx.appendChild(el('b', '', x.title)); tx.appendChild(el('span', '', x.desc));
      li.appendChild(ic); li.appendChild(tx); return li;
    }));
    fill($('todoList'), stepsFor(r.target).map(function (s, i) {
      var li = el('li'); li.appendChild(icon(s[0], 't-ic')); li.appendChild(el('span', '', s[1])); li.appendChild(el('span', '', s[2]));
      if (i < 2) li.appendChild(icon('i-chev', 'chev'));
      return li;
    }));
    fill($('contacts'), contactsFor(r.target).map(contactBox));
    $('mean').textContent = c.mean;
    fill($('recs'), (c.recs || []).map(function (s) { var li = el('li'); li.appendChild(icon(s[0])); li.appendChild(el('span', '', s[1])); return li; }));
    $('gVal').textContent = r.score;
    $('gBadge').textContent = c.gauge;
    var arc = $('gArcPath');
    arc.style.strokeDasharray = '0 200';
    requestAnimationFrame(function () { requestAnimationFrame(function () { arc.style.strokeDasharray = r.score + ' 200'; }); });
    document.title = c.badge + ' | تبيّن';
  }

  function view(name) {
    document.body.dataset.view = name;
    window.scrollTo(0, 0);
    if (name === 'home') document.title = 'تبيّن .. قبل أن تثق';
  }
  function busy(on) {
    $('go').setAttribute('aria-busy', on ? 'true' : 'false');
    $('goTx').textContent = on ? 'جارٍ تحليل الرابط...' : 'تحليل الرابط';
  }
  function showError(msg) { $('urlErr').textContent = msg || ''; $('url').setAttribute('aria-invalid', msg ? 'true' : 'false'); }

  function run(raw) {
    var my = ++seq;
    busy(true); showError('');
    var wait = new Promise(function (ok) { setTimeout(ok, MIN_WAIT); });
    return Promise.all([Tabayyan.analyze(raw), wait]).then(function (x) {
      if (my !== seq) return;
      busy(false);
      if (x[0].error) { view('home'); showError(x[0].error); return; }
      render(x[0]); view('result'); $('result').focus({ preventScroll: true });
    }).catch(function () {
      if (my !== seq) return;
      busy(false); view('home'); showError('حدث خطأ أثناء التحليل. حاول مرة أخرى.');
    });
  }

  // العنوان يحفظ الرابط المفحوص: يعمل زر الرجوع وتحديث الصفحة
  function route() {
    var m = /^#\/result\/(.+)$/.exec(location.hash);
    if (!m) { seq++; busy(false); view('home'); return; }
    var raw; try { raw = decodeURIComponent(m[1]); } catch (e) { raw = m[1]; }
    $('url').value = raw;
    run(raw);
  }

  $('scanForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('go').getAttribute('aria-busy') === 'true') return;
    var raw = $('url').value, p = Tabayyan.parse(raw);
    if (p.error) { showError(p.error); $('url').focus(); return; }
    var h = '#/result/' + encodeURIComponent(p.shown);
    if (location.hash === h) run(raw); else location.hash = h;
  });
  $('url').addEventListener('input', function () { showError(''); });
  $('cta').addEventListener('click', function () { $('url').focus(); });

  $('copy').addEventListener('click', function () {
    var b = $('copy');
    function done() { b.classList.add('done'); setTimeout(function () { b.classList.remove('done'); }, 1200); }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(currentUrl).then(done, function () {}); return; }
    var t = el('textarea'); t.value = currentUrl; t.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(t); t.select();
    try { if (document.execCommand('copy')) done(); } catch (e) {}
    t.remove();
  });

  window.addEventListener('hashchange', route);
  route();
})();
