import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      landing: {
        hero_headline: 'The Modern Business Platform for Gyms & Trainers',
        subheadline: 'All-in-one management, automation, and growth for fitness businesses — in English & Arabic.',
        get_started: 'Get Started',
        feature1_title: 'Smart Automation',
        feature1_desc: 'Automate member management, billing, and more.',
        feature2_title: 'Bilingual Support',
        feature2_desc: 'Full English & Arabic, with RTL layout.',
        feature3_title: 'All-in-One Dashboard',
        feature3_desc: 'Manage members, trainers, classes, and revenue.',
        feature4_title: 'Secure & Global',
        feature4_desc: 'Enterprise-grade security, global payments.',
        how_it_works: 'How it works',
        step1_title: 'Subscribe',
        step1_desc: 'Choose your plan and sign up.',
        step2_title: 'Register',
        step2_desc: 'Set up your business profile.',
        step3_title: 'Launch',
        step3_desc: 'Start managing your gym or studio!',
        dashboard_mockup: 'Dashboard Preview Coming Soon',
        final_cta: 'Start your free trial',
        pricing_title: 'Simple, Transparent Pricing',
        additional_branch: 'Additional branch',
        per_month: '/month',
        perfect_for: 'Perfect for gyms and fitness studios of any size',
        branch_calculator: 'Branch Calculator',
        total_monthly_cost: 'Total Monthly Cost',
        branch: 'Branch',
        branches: 'Branches',
        monthly: 'Monthly',
        yearly: 'Yearly',
        save_20: 'Save 20%',
        most_popular: 'Most Popular',
        testimonials_title: 'Trusted by Fitness Leaders',
        chat_title: 'Chat with us',
        chat_placeholder: 'Type your message...',
        chat_send: 'Send',
        chat_greeting: '👋 Hi! How can we help you today?',
        how_step1_title: 'Create Your Account',
        how_step1_desc: 'Sign up in seconds and set up your gym or studio profile.',
        how_step2_title: 'Add Your Team & Branches',
        how_step2_desc: 'Invite staff, add locations, and configure your business in one place.',
        how_step3_title: 'Start Managing Effortlessly',
        how_step3_desc: 'Automate operations, track growth, and delight your members.'
      }
    }
  },
  ar: {
    translation: {
      landing: {
        hero_headline: 'منصة إدارة الأعمال الحديثة للصالات الرياضية والمدربين',
        subheadline: 'إدارة شاملة، أتمتة، ونمو للأعمال الرياضية — بالإنجليزية والعربية.',
        get_started: 'ابدأ الآن',
        feature1_title: 'أتمتة ذكية',
        feature1_desc: 'أتمتة إدارة الأعضاء والفواتير والمزيد.',
        feature2_title: 'دعم ثنائي اللغة',
        feature2_desc: 'دعم كامل للإنجليزية والعربية مع تخطيط RTL.',
        feature3_title: 'لوحة تحكم شاملة',
        feature3_desc: 'إدارة الأعضاء والمدربين والحصص والإيرادات.',
        feature4_title: 'آمن وعالمي',
        feature4_desc: 'أمان على مستوى المؤسسات ومدفوعات عالمية.',
        how_it_works: 'كيف يعمل',
        step1_title: 'اشترك',
        step1_desc: 'اختر خطتك وسجل.',
        step2_title: 'سجّل',
        step2_desc: 'أنشئ ملف عملك.',
        step3_title: 'انطلق',
        step3_desc: 'ابدأ إدارة صالتك أو استوديوك!',
        dashboard_mockup: 'معاينة لوحة التحكم قريباً',
        final_cta: 'ابدأ تجربتك المجانية',
        pricing_title: 'أسعار بسيطة وشفافة',
        additional_branch: 'فرع إضافي',
        per_month: '/شهرياً',
        perfect_for: 'مثالي للصالات الرياضية ومراكز اللياقة من جميع الأحجام',
        branch_calculator: 'حاسبة الفروع',
        total_monthly_cost: 'التكلفة الشهرية الإجمالية',
        branch: 'فرع',
        branches: 'فروع',
        monthly: 'شهري',
        yearly: 'سنوي',
        save_20: 'وفر 20%',
        most_popular: 'الأكثر شعبية',
        testimonials_title: 'موثوق به من قبل قادة اللياقة البدنية',
        chat_title: 'دردشة معنا',
        chat_placeholder: 'اكتب رسالتك...',
        chat_send: 'إرسال',
        chat_greeting: '👋 مرحباً! كيف يمكننا مساعدتك اليوم؟',
        how_step1_title: 'أنشئ حسابك',
        how_step1_desc: 'سجّل خلال ثوانٍ وأضف بيانات ناديك أو مركزك الرياضي.',
        how_step2_title: 'أضف فريقك والفروع',
        how_step2_desc: 'ادعُ الموظفين، أضف الفروع، واضبط إعدادات عملك بسهولة.',
        how_step3_title: 'ابدأ الإدارة بسلاسة',
        how_step3_desc: 'أتمت العمليات، راقب النمو، وأسعد أعضائك.'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

export default i18n; 