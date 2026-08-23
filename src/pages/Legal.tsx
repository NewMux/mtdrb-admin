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
                  {isArabic ? "آخر تحديث: 30 يونيو 2026" : "Last updated: June 30, 2026"}
                </p>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  <p>
                    {isArabic
                      ? "مرحبًا بكم في منصة إدراة / MTDRB (المشار إليها بـ \"المنصة\" أو \"الخدمة\"). باستخدامك لخدماتنا أو تسجيل حساب جديد، فإنك توافق على الالتزام الكامل بهذه الشروط والأحكام."
                      : "Welcome to MTDRB / Idara (the \"Platform\" or \"Service\"). By using our services or creating an account, you agree to comply with and be bound by these Terms of Service."}
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
                      ? `جميع أسعار الباقات تُحتسب بعملة ${PLATFORM_CURRENCY}. يتم تحصيل الرسوم شهريًا أو سنويًا وفقًا لاختيارك. تجدد الاشتراكات تلقائيًا ما لم تقم بإلغاء الاشتراك من لوحة إعدادات الفوترة قبل نهاية الفترة الحالية.`
                      : `All subscription fees are billed in ${PLATFORM_CURRENCY}. Fees are payable in advance on a recurring monthly or annual basis. Subscriptions automatically renew unless cancelled through your dashboard billing settings prior to the renewal date.`}
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
                    {isArabic ? "5. القانون المعمول به" : "5. Governing Law"}
                  </h2>
                  <p>
                    {isArabic
                      ? "تخضع هذه الشروط وتفسر وفقًا للقوانين المعمول بها في دولة الإمارات العربية المتحدة. وتختص محاكم دبي بشكل حصري بأي نزاع قد ينشأ عن استخدام الخدمة."
                      : "These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Dubai."}
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
                  {isArabic ? "آخر تحديث: 30 يونيو 2026" : "Last updated: June 30, 2026"}
                </p>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  <p>
                    {isArabic
                      ? "نحن نولي خصوصية بياناتكم وأمن معلومات أعضائكم أهمية قصوى. توضح هذه السياسة كيفية جمع البيانات، استخدامها، وحمايتها داخل منصة إدراة."
                      : "We are committed to protecting the privacy of your business data and your members' information. This Privacy Policy details how we collect, process, and protect information within the MTDRB application."}
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
                      ? "تتوافق سياساتنا مع قانون حماية البيانات لدولة الإمارات العربية المتحدة واللوائح المعمول بها في مركز دبي المالي العالمي (DIFC) وسوق أبوظبي العالمي (ADGM). يمكنك طلب تصدير بياناتك أو حذفها بالكامل في أي وقت."
                      : "Our data privacy frameworks comply with the UAE Personal Data Protection Law (PDPL), DIFC, and ADGM data regulations. You reserve the right to export your datasets or request permanent deletion of your account history at any time."}
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
                  {isArabic ? "آخر تحديث: 30 يونيو 2026" : "Last updated: June 30, 2026"}
                </p>

                <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                  <p>
                    {isArabic
                      ? "تهدف سياسة الاسترجاع والإلغاء لدينا إلى توفير الوضوح الكامل لمالكي الصالات الرياضية المشتركين في منصتنا."
                      : "Our Refund and Cancellation Policy outlines the billing rules, proration adjustments, and cancellation terms for our business subscriptions."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "1. الفترة التجريبية المجانية" : "1. 14-Day Free Trial"}
                  </h2>
                  <p>
                    {isArabic
                      ? "نحن نوفر فترة تجريبية مجانية لمدة 14 يومًا بدون الحاجة لإدخال تفاصيل بطاقة الائتمان. يمكنك تجربة كافة ميزات باقة Pro بشكل كامل وإلغاء الاشتراك في أي وقت خلال هذه الفترة دون أي التزامات مالية."
                      : "We provide a 14-day free trial period for all new gym workspaces. No credit card details are required during this trial. You may explore all premium features and cancel anytime before the 14 days expire without incurring any charges."}
                  </p>

                  <h2 className="text-lg font-bold text-gray-900 dark:text-white pt-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                    {isArabic ? "2. الترقية وتناسب الرسوم (Proration)" : "2. Plan Upgrades & Downgrades (Proration)"}
                  </h2>
                  <p>
                    {isArabic
                      ? "عند الترقية من باقة Starter إلى باقة Pro، يتم احتساب الفارق النسبي وتعديل الفاتورة فورًا وفقًا للأيام المتبقية في دورة الفوترة الحالية. ويتم تطبيق الأسعار الجديدة كاملة بدءًا من الفاتورة التالية."
                      : "When upgrading your plan (e.g., from Starter to Pro), Tap Payments will calculate the prorated amount for the remainder of your current billing cycle. You will be charged only the difference immediately, and the full new rate will apply at the next billing renewal."}
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
                      ? "نظرًا لتوافر فترة تجريبية مجانية كاملة وإبقاء الوصول نشطًا حتى نهاية الدورة بعد الإلغاء، فإن جميع المبالغ المدفوعة للاشتراكات غير قابلة للاسترجاع. لا يتم رد مبالغ جزئية مقابل الأيام غير المستخدمة في منتصف الشهر."
                      : "Because we offer a fully functional 14-day free trial and keep your account active through the end of the paid cycle upon cancellation, all subscription payments are non-refundable. No partial refunds are issued for mid-month cancellations."}
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
