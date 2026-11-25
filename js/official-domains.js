/* قائمة الجهات الرسمية.
   name : اسم الجهة كما يظهر في النتيجة
   d    : النطاقات الرسمية (تشمل كل النطاقات الفرعية تلقائياً)
   k    : كلمات يستخدمها المحتالون لانتحال الجهة
          (كلمة من 6 أحرف فأكثر تُطابق ولو كانت ضمن كلمة أطول، والأقصر، أو المسبوقة بعلامة =، تُطابق كلمة كاملة فقط)

   أي نطاق ينتهي بـ .gov.sa أو .edu.sa يُعتبر رسمياً تلقائياً ولا يحتاج إضافة هنا.
   c    : رقم التواصل الذي يظهر في قسم الإبلاغ بعد الفحص (إن لم يوجد يظهر الموقع الرسمي بدلاً منه)
   l    : الوصف تحت اسم الجهة (الافتراضي: مركز الاتصال للجهات الحكومية، وخدمة العملاء لغيرها)
   s    : اسم مختصر لقسم الإبلاغ إن كان الاسم طويلاً
   a    : نوع خطوات «ماذا تفعل إذا أدخلت بياناتك بالفعل؟» (الافتراضي: الحكومية nafath، البنوك bank، غيرها pay)
          own حساب بكلمة مرور ونفاذ · nafath دخول عبر النفاذ · acct حساب بكلمة مرور · pay دفع بالبطاقة
          bank بنك · tel شركة اتصالات · app حساب إلكتروني · chat تطبيق محادثة

   الأرقام مأخوذة من المواقع الرسمية للجهات بتاريخ 2026-11-25، ما عدا 19993 (هيئة الزكاة)
   فصفحتها الرسمية لم تُظهره وقت المراجعة وأُخذ من عدة مصادر عامة متطابقة.

   لإضافة جهة: انسخ سطراً داخل القسم المناسب وعدّله، وتأكد من النطاق والرقم من مصدر رسمي. */
(function (root) {
  // ---- منصات حكومية ----
  var GOV = [
    { name: 'منصة أبشر', d: ['absher.sa'], k: ['absher', 'abshir'], c: '920020405', a: 'own' },
    { name: 'النفاذ الوطني الموحد', d: ['iam.gov.sa', 'nafath.sa'], k: ['nafath', 'nafaz', 'nafad', 'nafaath'], c: '8001221111', a: 'own' },
    { name: 'توكلنا', d: ['ta.sdaia.gov.sa'], k: ['tawakkalna', 'tawakalna'], c: '8001289999', s: 'تطبيق توكلنا' },
    { name: 'منصة ناجز', d: ['najiz.sa'], k: ['najiz', 'najez', 'najeez'], c: '1950', l: 'وزارة العدل' },
    { name: 'منصة إيجار', d: ['ejar.sa'], k: ['ejar'] },
    { name: 'منصة مساند', d: ['musaned.com.sa', 'musaned.gov.sa'], k: ['musaned'], c: '920002866' },
    { name: 'منصة قوى', d: ['qiwa.sa'], k: ['qiwa'], c: '19911', l: 'وزارة الموارد البشرية' },
    { name: 'منصة مدد', d: ['mudad.com.sa'], k: ['mudad'], c: '19911', l: 'وزارة الموارد البشرية', a: 'acct' },
    { name: 'تطبيق صحتي', d: ['sehhaty.sa'], k: ['sehhaty', 'sehaty'], c: '937', l: 'وزارة الصحة' },
    { name: 'منصة صحة', d: ['seha.sa'], k: ['seha'], c: '920002005' },
    { name: 'منصة نسك', d: ['nusuk.sa'], k: ['nusuk'], c: '1966', a: 'pay' },
    { name: 'روح السعودية', d: ['visitsaudi.com'], k: ['visitsaudi'], a: 'pay' },
    { name: 'بوابة مقيم', d: ['muqeem.sa'], k: ['muqeem'], c: '920000356', a: 'acct' },
    { name: 'منصة اعتماد', d: ['etimad.sa'], k: ['etimad'], c: '19990', l: 'وزارة المالية' },
    { name: 'منصة فسح', d: ['fasah.sa'], k: ['fasah'], c: '19993', l: 'هيئة الزكاة والجمارك', a: 'acct' },
    { name: 'منصة جدارات', d: ['jadarat.sa'], k: ['jadarat'], c: '8001222030', l: 'صندوق هدف' },
    { name: 'منصة مدرستي', d: ['madrasati.sa'], k: ['madrasati'], c: '19996', a: 'acct' },
    { name: 'منصة إحسان', d: ['ehsan.sa'], k: ['ehsan'], c: '8001247000', a: 'pay' },
    { name: 'منصة سكني', d: ['sakani.sa'], k: ['sakani'], c: '199090' },
    { name: 'منصة بلدي', d: ['balady.gov.sa'], k: ['balady'], c: '199040' },
    { name: 'وزارة الداخلية', d: ['moi.gov.sa'], k: ['moi'] },
    { name: 'البنك المركزي السعودي', d: ['sama.gov.sa'], k: ['sama'], t: 'bank', anyBank: true },
    { name: 'هيئة الزكاة والضريبة والجمارك', d: ['zatca.gov.sa'], k: ['zatca'], c: '19993', s: 'هيئة الزكاة والجمارك' },
    { name: 'التأمينات الاجتماعية', d: ['gosi.gov.sa'], k: ['=gosi'], c: '8001243344' },
    { name: 'وزارة العدل', d: ['moj.gov.sa'], k: [], c: '1950' },
    { name: 'وزارة المالية', d: ['mof.gov.sa'], k: [], c: '19990' },
    { name: 'هيئة الاتصالات والفضاء والتقنية', d: ['cst.gov.sa'], k: [], c: '19966', s: 'هيئة الاتصالات' },
    { name: 'صندوق تنمية الموارد البشرية', d: ['hrdf.org.sa'], k: ['hrdf'], c: '8001222030', s: 'صندوق هدف' },
    { name: 'وزارة الصحة', d: ['moh.gov.sa'], k: ['moh'], c: '937' },
    { name: 'وزارة الموارد البشرية والتنمية الاجتماعية', d: ['hrsd.gov.sa'], k: ['hrsd'], c: '19911', s: 'وزارة الموارد البشرية' },
    { name: 'الهيئة الوطنية للأمن السيبراني', d: ['nca.gov.sa'], k: [], s: 'هيئة الأمن السيبراني' },
    { name: 'المنصة الوطنية الموحدة', d: ['my.gov.sa'], k: ['mygov'], c: '199099', l: 'مركز آمر', s: 'المنصة الوطنية' },
    { name: 'حساب المواطن', d: ['ca.gov.sa'], k: ['citizenaccount'] }
  ];

  // ---- البنوك والمحافظ ----
  var BANKS = [
    { name: 'مصرف الراجحي', d: ['alrajhibank.com.sa'], k: ['alrajhi', 'alrajhibank', 'rajhi'], c: '8001244455', l: 'البلاغات والشكاوى' },
    { name: 'البنك الأهلي السعودي', d: ['alahli.com', 'snb.com'], k: ['snb', '=alahli', 'alahlibank', 'alahlionline'], c: '8001160131', l: 'بلاغات الاحتيال' },
    { name: 'بنك الرياض', d: ['riyadbank.com'], k: ['riyadbank', 'riyadhbank'], c: '8001242225' },
    { name: 'البنك السعودي الأول', d: ['sab.com', 'sabb.com'], k: ['sab', 'sabb', 'sabbank'], c: '8001248888', l: 'حالات الطوارئ' },
    { name: 'مصرف الإنماء', d: ['alinma.com'], k: ['alinma', 'alinmabank'], c: '920028000' },
    { name: 'بنك البلاد', d: ['bankalbilad.com', 'bankalbilad.com.sa'], k: ['bankalbilad', 'albilad'], c: '8001230000' },
    { name: 'بنك الجزيرة', d: ['aljazirabank.com.sa', 'bankaljazira.com', 'baj.com.sa'], k: ['bankaljazira', 'aljazirabank'], c: '8002440404' },
    { name: 'البنك العربي الوطني', d: ['anb.com.sa'], k: ['anb', 'anbbank'], c: '8001160060', l: 'بلاغات الاحتيال' },
    { name: 'البنك السعودي الفرنسي', d: ['bsf.sa', 'alfransi.com.sa'], k: ['bsf', 'alfransi'], c: '8001188880', l: 'البلاغات والشكاوى' },
    { name: 'البنك السعودي للاستثمار', d: ['saib.com.sa'], k: ['saib'], c: '8001248000' },
    { name: 'بنك الخليج الدولي', d: ['gib.com'], k: [], c: '8001166336', l: 'ميم - خدمة العملاء' },
    { name: 'بنك الإمارات دبي الوطني', d: ['emiratesnbd.com.sa', 'emiratesnbd.com'], k: ['emiratesnbd'], c: '8007547777', s: 'الإمارات دبي الوطني' },
    { name: 'بنك D360', d: ['d360.com'], k: ['d360'], c: '8001244410' },
    { name: 'STC Bank', d: ['stcbank.com.sa', 'stcpay.com.sa'], k: ['stcbank', 'stcpay'], c: '8001180008' },
    { name: 'urpay', d: ['urpay.com.sa'], k: ['urpay'], c: '8001000081' },
    { name: 'المدفوعات السعودية', d: ['saudipayments.com'], k: ['mada', 'sadad', 'saudipayments'], t: 'bank', anyBank: true },
    { name: 'تمارا', d: ['tamara.co'], k: [] },
    { name: 'تابي', d: ['tabby.ai'], k: ['tabby'] }
  ];

  // ---- شحن واتصالات ومتاجر وتطبيقات ----
  var COMPANIES = [
    { name: 'سبل | البريد السعودي', d: ['splonline.com.sa'], k: ['spl', 'splonline', 'saudipost'], c: '19992', s: 'سبل' },
    { name: 'سمسا إكسبرس', d: ['smsaexpress.com'], k: ['smsa', 'smsaexpress'], c: '920009999' },
    { name: 'أرامكس', d: ['aramex.com'], k: ['aramex'] },
    { name: 'ناقل إكسبرس', d: ['naqelexpress.com', 'naqel.com.sa'], k: ['naqel'], c: '8002464444' },
    { name: 'DHL', d: ['dhl.com'], k: ['dhl'] },
    { name: 'FedEx', d: ['fedex.com'], k: ['fedex'] },
    { name: 'stc', d: ['stc.com.sa'], k: ['stc', 'mystc'], c: '900', a: 'tel' },
    { name: 'موبايلي', d: ['mobily.com.sa'], k: ['mobily'], c: '1100', a: 'tel' },
    { name: 'زين', d: ['zain.com'], k: [], a: 'tel' },
    { name: 'سلام', d: ['salam.sa'], k: [], a: 'tel' },
    { name: 'السعودية للطاقة', d: ['se.com.sa'], k: ['saudielectricity'], c: '933' },
    { name: 'شركة المياه الوطنية', d: ['nwc.com.sa'], k: ['nwc'], c: '8004411110' },
    { name: 'أرامكو السعودية', d: ['aramco.com'], k: ['aramco'] },
    { name: 'سابك', d: ['sabic.com'], k: ['sabic'] },
    { name: 'الخطوط السعودية', d: ['saudia.com'], k: [] },
    { name: 'طيران ناس', d: ['flynas.com'], k: ['flynas'] },
    { name: 'طيران أديل', d: ['flyadeal.com'], k: ['flyadeal'] },
    { name: 'نجم', d: ['najm.sa'], k: [] },
    { name: 'تأميني', d: ['tameeni.com'], k: ['tameeni'], c: '8002444455' },
    { name: 'التعاونية', d: ['tawuniya.com', 'tawuniya.com.sa'], k: ['tawuniya'] },

    // ---- متاجر وتطبيقات ----
    { name: 'مكتبة جرير', d: ['jarir.com'], k: ['jarir'] },
    { name: 'نون', d: ['noon.com'], k: [] },
    { name: 'أمازون', d: ['amazon.sa', 'amazon.com', 'amazon.ae'], k: ['amazon'] },
    { name: 'إكسترا', d: ['extra.com'], k: [] },
    { name: 'حراج', d: ['haraj.com.sa'], k: ['haraj'] },
    { name: 'هنقرستيشن', d: ['hungerstation.com'], k: ['hungerstation'] },
    { name: 'جاهز', d: ['jahez.net'], k: ['jahez'] },
    { name: 'سلة', d: ['salla.sa', 'salla.com'], k: [], host: true },
    { name: 'زد', d: ['zid.sa'], k: [], host: true },

    // ---- عالمية ----
    { name: 'Google', d: ['google.com', 'google.com.sa', 'youtube.com', 'youtu.be', 'gmail.com'], k: ['google', 'gmail', 'youtube'], a: 'app' },
    { name: 'Microsoft', d: ['microsoft.com', 'live.com', 'office.com', 'outlook.com', 'microsoftonline.com', 'bing.com'], k: ['microsoft', 'office365', 'outlook', 'onedrive'], a: 'app' },
    { name: 'Apple', d: ['apple.com', 'icloud.com'], k: ['apple', 'icloud', 'appleid'], a: 'app' },
    { name: 'WhatsApp', d: ['whatsapp.com', 'wa.me'], k: ['whatsapp', 'whatsap'], a: 'chat' },
    { name: 'Facebook', d: ['facebook.com', 'fb.com', 'meta.com'], k: ['facebook'], a: 'app' },
    { name: 'Instagram', d: ['instagram.com'], k: ['instagram'], a: 'app' },
    { name: 'X', d: ['x.com', 'twitter.com'], k: ['twitter'], a: 'app' },
    { name: 'TikTok', d: ['tiktok.com'], k: ['tiktok'], a: 'app' },
    { name: 'Snapchat', d: ['snapchat.com'], k: ['snapchat'], a: 'app' },
    { name: 'LinkedIn', d: ['linkedin.com'], k: ['linkedin'], a: 'app' },
    { name: 'Telegram', d: ['telegram.org'], k: ['telegram'], a: 'chat' },
    { name: 'PayPal', d: ['paypal.com'], k: ['paypal'] },
    { name: 'Netflix', d: ['netflix.com'], k: ['netflix'], a: 'app' },
    { name: 'Canva', d: ['canva.com'], k: [], a: 'app' },
    { name: 'GitHub', d: ['github.com'], k: [], a: 'app' },
    { name: 'ويكيبيديا', d: ['wikipedia.org'], k: ['wikipedia'], a: 'app' }
  ];

  function tag(list, type) { list.forEach(function (e) { e.t = e.t || type; }); return list; }
  var ENTITIES = tag(GOV, 'gov').concat(tag(BANKS, 'bank'), tag(COMPANIES, 'co'));

  var api = { ENTITIES: ENTITIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TabayyanData = api;
})(this);
