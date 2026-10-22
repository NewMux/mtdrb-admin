import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { FiShield, FiFileText, FiRefreshCw, FiArrowLeft, FiHelpCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useRTL } from "../hooks/useRTL";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { PLATFORM_CURRENCY } from "../config/runtimeConfig";

interface LegalProps {
  initialTab?: "terms" | "privacy" | "refund";
}

const Legal: React.FC<LegalProps> = ({ initialTab = "terms" }) => {
  const { i18n } = useTranslation();
  const { isRTL } = useRTL();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "refund">(initialTab);

  // Sync tab if route changes (e.g. clicking a link for privacy from terms page)
  useEffect(() => {
    if (location.pathname.includes("privacy")) {
      setActiveTab("privacy");
    } else if (location.pathname.includes("refund")) {
      setActiveTab("refund");
    } else {
      setActiveTab("terms");
    }
  }, [location.pathname]);

  const isArabic = i18n.language === "ar";

  const tabs = [
    {
      id: "terms" as const,
      name: isArabic ? "شروط الخدمة" : "Terms of Service",
      icon: FiFileText,
    },
    {
      id: "privacy" as const,
      name: isArabic ? "سياسة الخصوصية" : "Privacy Policy",
      icon: FiShield,
    },
    {
      id: "refund" as const,
      name: isArabic ? "سياسة الاسترجاع والإلغاء" : "Refund & Cancellation",
      icon: FiRefreshCw,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-150 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link
              to="/"
              className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent"
            >
              <span>MTDRB / إدراة</span>
            </Link>
            <Link
              to="/signup"
              className={`text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-1`}
            >
              <FiArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              <span>{isArabic ? "العودة للتسجيل" : "Back to Sign Up"}</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Menu */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 border border-gray-150 dark:border-gray-700 shadow-sm space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center ${
                      isRTL ? "space-x-reverse text-right" : "text-left"
                    } space-x-3 px-4 py-3.5 rounded-2xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 dark:border-blue-900/30">
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
                <FiHelpCircle className="w-5 h-5 shrink-0" />
                <span className="font-semibold text-sm">{isArabic ? "هل تحتاج لمساعدة؟" : "Need help?"}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {isArabic
                  ? "إذا كان لديك أي أسئلة قانونية بخصوص شروطنا أو سياسة الخصوصية، يرجى التواصل مع فريق الدعم القانوني لدينا."
                  : "If you have any legal questions regarding our terms or privacy policy, please contact our legal support team."}
              </p>
              <a
                href="mailto:legal@mtdrb.net"
                className="mt-3 block text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                legal@mtdrb.net
              </a>
            </div>
          </aside>

          {/* Policy Right Content */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-10 border border-gray-150 dark:border-gray-700 shadow-sm">
            {activeTab === "terms" && (
              <article className="prose dark:prose-invert max-w-none space-y-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {isArabic ? "شروط الخدمة والأحكام" : "Terms of Service"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? "آخر تحديث: 24 أكتوبر 2026" : "Last updated: October 24, 2026"}
                </p>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  <p>
                    {isArabic
                      ? "مرحبًا بكم في منصة إدراة / MTDRB (المشار إليها بـ \"المنصة\" أو \"الخدمة\"). باستخدامك لخدماتنا أو تسجيل حساب جديد، فإنك توافق على الالتزام الكامل بهذه الشروط والأحكام. تُشغَّل المنصة بواسطة شركة MTDRB المؤسسة في مملكة البحرين (\"MTDRB\" أو \"نحن\")."
                      : "Welcome to MTDRB / Idara (the \"Platform\" or \"Service\"). By using our services or creating an account, you agree to comply with and be bound by these Terms of Service. The Platform is operated by MTDRB, a company established in the Kingdom of Bahrain (\"MTDRB\", \"we\", \"us\")."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "1. أهلية الاستخدام وتفويض الحساب" : "1. Account Registration & Eligibility"}
                  </h2>
                  <p>
                    {isArabic
                      ? "يجب أن تكون ممثلاً رسميًا ومخولاً بالكامل لكيان تجاري مسجل (نادي رياضي، استوديو لياقة بدنية، أو مدرب مستقل) لإنشاء حساب عمل. يجب تقديم معلومات دقيقة وحديثة أثناء عملية التسجيل."
                      : "You must be a legally registered business entity (gym, fitness studio, or independent trainer) in your jurisdiction to create an organization workspace. You represent that all information provided during signup is accurate and up to date."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "2. عزل البيانات وملكية الحساب المشترك" : "2. Tenant Isolation & Data Ownership"}
                  </h2>
                  <p>
                    {isArabic
                      ? "نحن نستخدم هياكل عزل صارمة وقواعد أمنية على مستوى قاعدة البيانات (Row Level Security) لضمان فصل بيانات المشتركين بشكل كامل. تظل صالتك الرياضية هي المالك الحصري لكافة بيانات عملائك وأعضائك ومدربيك."
                      : "We utilize strict database-level Row Level Security (RLS) to guarantee complete data isolation between workspaces. Your organization retains full and exclusive ownership of all member profile data, trainer schedules, and financial transactions."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "3. شروط الاشتراك والفوترة" : "3. Fees, Subscriptions & Billing"}
                  </h2>
                  <p>
                    {isArabic
                      ? `جميع أسعار الباقات تُحتسب بعملة ${PLATFORM_CURRENCY}. يتم تحصيل الرسوم شهريًا أو سنويًا وفقًا لاختيارك. تجدد الاشتراكات تلقائيًا ما لم تقم بإلغاء الاشتراك من لوحة إعدادات الفوترة قبل نهاية الفترة الحالية. تُحتسب الضرائب المطبقة وتُحصَّل عند الدفع عبر مزود الدفع لدينا Paddle.`
                      : `All subscription fees are billed in ${PLATFORM_CURRENCY}. Fees are payable in advance on a recurring monthly or annual basis. Subscriptions automatically renew unless cancelled through your dashboard billing settings prior to the renewal date. Applicable taxes are calculated and collected at checkout by our payment provider, Paddle.`}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "4. اتفاقية مستوى الخدمة (SLA)" : "4. Service Level Agreement (SLA)"}
                  </h2>
                  <p>
                    {isArabic
                      ? "نسعى جاهدين للحفاظ على توفر الخدمة بنسبة لا تقل عن 99.9%. لا نتحمل المسؤولية عن أي انقطاع ناجم عن ظروف خارجة عن إرادتنا أو عمليات الصيانة الدورية المجدولة والتي سنقوم بالتنويه عنها مسبقًا."
                      : "We endeavor to maintain a service availability uptime of 99.9%. We are not liable for service interruptions caused by factors outside our reasonable control or scheduled maintenance windows, which will be announced in advance."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "5. الضرائب على فواتيرك" : "5. Sales Tax on Your Own Invoices"}
                  </h2>
                  <p>
                    {isArabic
                      ? "تساعدك المنصة على تسجيل ضريبة المبيعات (ضريبة القيمة المضافة أو غيرها) واحتسابها وفق النسب التي تحددها أنت في إعدادات النادي. النسب المقترحة عند اختيار الدولة هي للاسترشاد فقط وليست استشارة ضريبية. أنت المسؤول عن صحة النسب وعن إقراراتك الضريبية والتزاماتك أمام الجهات المختصة."
                      : "The Platform helps you record and calculate sales tax (VAT, GST or similar) at the rates you set in your gym settings. Rates suggested when you choose a country are a starting point only and are not tax advice. You are responsible for the correctness of the rates you configure, for your tax filings, and for your obligations to the tax authorities where you operate."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "6. حذف الحساب" : "6. Deleting Your Account"}
                  </h2>
                  <p>
                    {isArabic
                      ? "يمكن لمسؤول النادي في أي وقت تنزيل بيانات ناديه وحذف النادي نهائياً من الإعدادات ← البيانات والخصوصية. يؤدي الحذف إلى إلغاء الاشتراك فوراً دون أي رسوم إضافية ودون استرداد عن الفترة الحالية، ويحذف بيانات النادي والملفات المرفوعة وحسابات الموظفين المرتبطة بهذا النادي وحده. لا يمكن التراجع عن ذلك."
                      : "A gym admin can at any time download the gym's data and permanently delete the gym from Settings → Data & privacy. Deleting cancels the subscription immediately with no further charges and no refund for the current period, and removes the gym's data, uploaded files and the accounts of staff who belong to no other gym. This cannot be undone."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "7. القانون المعمول به" : "7. Governing Law"}
                  </h2>
                  <p>
                    {isArabic
                      ? "تخضع هذه الشروط وتفسر وفقًا للقوانين المعمول بها في مملكة البحرين. وتختص محاكم مملكة البحرين بشكل حصري بأي نزاع ينشأ عنها."
                      : "These Terms shall be governed by and construed in accordance with the laws of the Kingdom of Bahrain. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of the Kingdom of Bahrain."}
                  </p>
                </div>
              </article>
            )}

            {activeTab === "privacy" && (
              <article className="prose dark:prose-invert max-w-none space-y-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {isArabic ? "سياسة الخصوصية وحماية البيانات" : "Privacy Policy"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? "آخر تحديث: 24 أكتوبر 2026" : "Last updated: October 24, 2026"}
                </p>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  <p>
                    {isArabic
                      ? "نحن نولي خصوصية بياناتكم وأمن معلومات أعضائكم أهمية قصوى. توضح هذه السياسة كيفية جمع البيانات، استخدامها، وحمايتها داخل منصة إدراة. تقدّم المنصة شركة MTDRB المؤسسة في مملكة البحرين."
                      : "We are committed to protecting the privacy of your business data and your members' information. This Privacy Policy details how we collect, process, and protect information within the MTDRB application. The Platform is provided by MTDRB, a company established in the Kingdom of Bahrain."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "1. البيانات التي نجمعها" : "1. Information We Collect"}
                  </h2>
                  <p>
                    {isArabic
                      ? "نحن نجمع البيانات اللازمة لإدارة حساب الصالة الرياضية الخاص بك، ويشمل ذلك: الاسم والبريد الإلكتروني للقرارات الفنية، معلومات الفواتير والمدفوعات، وسجلات حضور واشتراكات الأعضاء التي تدخلها في النظام."
                      : "We collect information necessary to manage your workspace and process transactions: administrator contact info, gym branch profiles, trainer schedules, and member records (including check-ins, subscription statuses, and basic profile info)."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "2. استخدام ومعالجة البيانات" : "2. How We Process Your Data"}
                  </h2>
                  <p>
                    {isArabic
                      ? "تُستخدم البيانات فقط لتقديم خدمات لوحة التحكم والتحليلات وإدارة الفروع والفواتير. لا نقوم إطلاقًا ببيع بيانات عملائك أو استخدامها لأغراض إعلانية خاصة بنا أو بأطراف ثالثة."
                      : "Your data is processed strictly to provide the core administrative features, automated billing pipelines, and analytics metrics of your dashboard. We do not sell, rent, or distribute your client databases to any advertising networks or third parties."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "3. أمن وحفظ البيانات" : "3. Security & Multi-Tenant Isolation"}
                  </h2>
                  <p>
                    {isArabic
                      ? "نحن نطبق إجراءات أمنية متكاملة تشمل التشفير عند النقل وعند الحفظ، إضافة لعزل البيانات التام على مستوى قاعدة البيانات (Row-Level Security) لمنع تسريب أي معلومات بين المشتركين في المنصة."
                      : "All information is encrypted in transit using SSL/TLS and at rest using database encryption. Our database configuration enforces strict row-level security (RLS) to ensure that no workspace can ever access or leak records belonging to another tenant."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "4. الامتثال للأنظمة الإقليمية" : "4. Regulatory Compliance"}
                  </h2>
                  <p>
                    {isArabic
                      ? "نبني المنصة لتدعم التزامات أصحاب الصالات بموجب قوانين حماية البيانات مثل قانون حماية البيانات الشخصية في مملكة البحرين (القانون رقم 30 لسنة 2018) واللائحة الأوروبية والبريطانية العامة لحماية البيانات وما يماثلها. يمكنك في أي وقت تصدير بياناتك أو حذف حسابك نهائياً من الإعدادات ← البيانات والخصوصية."
                      : "We build the Platform to support gym owners' obligations under data protection laws such as Bahrain's Personal Data Protection Law (Law No. 30 of 2018), the EU and UK GDPR and similar laws. You can export your data or permanently delete your account at any time from Settings → Data & privacy."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "5. مزودو الخدمة الذين نستعين بهم" : "5. Service Providers We Use"}
                  </h2>
                  <p>
                    {isArabic
                      ? "نستعين بالجهات التالية لتشغيل المنصة، وهي تعالج البيانات نيابةً عنا: Supabase (قاعدة البيانات والمصادقة وتخزين الملفات)، وVercel (استضافة التطبيق)، وPaddle (مدفوعات اشتراكك في المنصة وإصدار فواتيرها، وهي التاجر المسجّل ولا نطّلع على بيانات بطاقتك)، وCloudflare Turnstile (الحماية من البرمجيات الآلية في نماذج التسجيل والدخول)، وSentry (تقارير الأخطاء الفنية، إن كانت مفعّلة). لا تعالج المنصة مدفوعات بطاقات أعضاء ناديك؛ فأنت من تسجّل مدفوعاتهم فيها."
                      : "We use the following providers to run the Platform; they process data on our behalf: Supabase (database, authentication and file storage), Vercel (hosting of the application), Paddle (payments and invoicing for your MTDRB subscription - Paddle is the merchant of record and we never see your card details), Cloudflare Turnstile (bot protection on the sign-up and sign-in forms) and, if enabled, Sentry (technical error reports). The Platform does not process your members' card payments; you record their payments in it."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "6. أدوار الأطراف والمسؤوليات" : "6. Roles & Responsibilities"}
                  </h2>
                  <p>
                    {isArabic
                      ? "بالنسبة لبيانات أعضاء ناديك، يحدد ناديك سبب استخدامها وكيفه (المتحكم في البيانات)، ونعالجها نحن نيابةً عنك (المعالج) لتقديم الخدمة فقط. وأنت مسؤول عن وجود أساس نظامي لجمعها وعن إبلاغ أعضائك والرد على طلباتهم. وللمساعدة في ذلك، تتيح لك الإعدادات ← البيانات والخصوصية تنزيل كل ما يخص عضواً بعينه وكل بيانات ناديك."
                      : "For the information about your members, your gym decides why and how it is used (the \"controller\") and we process it on your behalf (the \"processor\") only to provide the service. You are responsible for having a lawful basis to collect it, for informing your members, and for answering their requests. To help, Settings → Data & privacy lets you download everything held about a specific member and all of your gym's data."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "7. الحذف والاحتفاظ بالبيانات" : "7. Deletion & Retention"}
                  </h2>
                  <p>
                    {isArabic
                      ? "عند حذف النادي نهائياً تُحذف بياناته والملفات المرفوعة وحسابات الموظفين المرتبطة به وحده من أنظمتنا، ويُلغى الاشتراك فوراً. نحتفظ فقط بسجل مجهول يفيد بحدوث الحذف (التاريخ وأعداد ما أُزيل)، وبسجلات الدفع لدى Paddle بالقدر الذي يوجبه القانون. قد تبقى نسخ من البيانات في النسخ الاحتياطية المشفّرة لدى مزود قاعدة البيانات لفترة محدودة إلى أن تنتهي صلاحيتها."
                      : "When a gym is permanently deleted, its data, uploaded files and the accounts of staff who belong to no other gym are removed from our systems, and the subscription is cancelled immediately. We keep only an anonymous record that a deletion took place (date and counts of what was removed), and payment records held by Paddle as the law requires. Copies may remain in our database provider's encrypted backups for a limited period until they expire."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "8. ملفات تعريف الارتباط والتخزين في المتصفح" : "8. Cookies & Browser Storage"}
                  </h2>
                  <p>
                    {isArabic
                      ? "تستخدم المنصة تخزيناً في المتصفح لازماً لتشغيل الخدمة: جلسة تسجيل الدخول وتفضيلات اللغة والمظهر، وسجلاً مؤقتاً لوسوم الحملة الإعلانية (UTM) للرابط الذي وصلت منه يُحفظ طوال جلسة المتصفح فقط. لا نستخدم ملفات تعريف ارتباط إعلانية. قد تضع Paddle وCloudflare ملفاتهما الخاصة بالقدر اللازم للدفع والأمان. وإذا تغيّر ذلك فسنحدّث هذه السياسة ونطلب الموافقة حيث يُشترط."
                      : "The Platform uses browser storage that is necessary to run the service: your sign-in session, your language and theme preferences, and a short-lived record of the campaign (UTM) tags on the link you arrived from, kept only for the browser session. We do not use advertising cookies. Paddle and Cloudflare may set their own cookies as needed for payment and security. If this changes we will update this policy and ask for consent where required."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "9. التواصل" : "9. Contact"}
                  </h2>
                  <p>
                    {isArabic
                      ? "لأي أسئلة تخص الخصوصية أو لممارسة حقوقك بما لا تتيحه أدوات الإعدادات، راسلنا على legal@mtdrb.net."
                      : "For privacy questions, or to exercise a right the Settings tools do not cover, write to legal@mtdrb.net."}
                  </p>
                </div>
              </article>
            )}

            {activeTab === "refund" && (
              <article className="prose dark:prose-invert max-w-none space-y-6">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {isArabic ? "سياسة الاسترجاع وإلغاء الاشتراكات" : "Refund & Cancellation Policy"}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isArabic ? "آخر تحديث: 24 أكتوبر 2026" : "Last updated: October 24, 2026"}
                </p>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  <p>
                    {isArabic
                      ? "تهدف سياسة الاسترجاع والإلغاء لدينا إلى توفير الوضوح الكامل لمالكي الصالات الرياضية المشتركين في منصتنا."
                      : "Our Refund and Cancellation Policy outlines the billing rules, proration adjustments, and cancellation terms for our business subscriptions."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "1. فوترة الاشتراك" : "1. Subscription Billing"}
                  </h2>
                  <p>
                    {isArabic
                      ? "يبدأ الاشتراك المدفوع فور إتمام عملية الدفع. يتم تحصيل كامل قيمة الباقة التي اخترتها عند الاشتراك، ويبدأ الوصول إلى مساحة العمل وميزاتها على الفور."
                      : "A paid subscription begins immediately when you complete checkout. Full payment for your selected plan is charged at signup, and access to your workspace and its features starts right away."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "2. الترقية وتناسب الرسوم (Proration)" : "2. Plan Upgrades & Downgrades (Proration)"}
                  </h2>
                  <p>
                    {isArabic
                      ? "عند الترقية من باقة Starter إلى باقة Pro، يتم احتساب الفارق النسبي وتعديل الفاتورة فورًا وفقًا للأيام المتبقية في دورة الفوترة الحالية. ويتم تطبيق الأسعار الجديدة كاملة بدءًا من الفاتورة التالية."
                      : "When upgrading your plan (e.g., from Starter to Pro), our payment provider (Paddle) will calculate the prorated amount for the remainder of your current billing cycle. You will be charged only the difference immediately, and the full new rate will apply at the next billing renewal."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "3. إلغاء الاشتراك وتوافر الخدمة" : "3. Subscription Cancellation"}
                  </h2>
                  <p>
                    {isArabic
                      ? "يمكنك إلغاء تجديد الاشتراك في أي وقت من خلال لوحة إعدادات الفوترة. بمجرد الإلغاء، سيظل حسابك نشطًا ولديك كامل الصلاحيات للوصول إلى لوحة التحكم والبيانات الخاصة بك حتى نهاية فترة الفوترة الحالية."
                      : "You may cancel your subscription renewal at any time via Settings -> Billing. Upon cancellation, your workspace access remains active with all premium features until the end of your current pre-paid billing cycle."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "4. سياسة عدم الاسترجاع" : "4. Refund Policy"}
                  </h2>
                  <p>
                    {isArabic
                      ? "نظرًا لأن الوصول إلى حسابك يبقى نشطًا حتى نهاية دورة الفوترة المدفوعة بعد الإلغاء، فإن جميع المبالغ المدفوعة للاشتراكات غير قابلة للاسترجاع. لا يتم رد مبالغ جزئية مقابل الإلغاء في منتصف الدورة."
                      : "Because your workspace access remains active through the end of the paid billing cycle upon cancellation, all subscription payments are non-refundable. No partial refunds are issued for mid-cycle cancellations."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "5. حذف الحساب" : "5. Deleting Your Account"}
                  </h2>
                  <p>
                    {isArabic
                      ? "إذا حذفت ناديك نهائياً من الإعدادات ← البيانات والخصوصية فإن الاشتراك يُلغى فوراً، ولا يُرد أي مبلغ عن الفترة الحالية، ولا تُحصَّل أي رسوم إضافية."
                      : "If you permanently delete your gym from Settings → Data & privacy, the subscription is cancelled immediately, no amount is refunded for the current period, and you are not charged again."}
                  </p>
                </div>
              </article>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Legal;
