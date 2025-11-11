import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Sparkles, GraduationCap, Building2, Users, Award, Phone, Mail, MapPin, Clock, CheckCircle2, Target, Eye, Heart, Languages } from "lucide-react";
import heroImage from "@/assets/fcg-hero.jpg";
import teamImage from "@/assets/fcg-team.jpg";
import securityImage from "@/assets/fcg-security.jpg";
import cleaningImage from "@/assets/fcg-cleaning.jpg";
import trainingImage from "@/assets/fcg-training.jpg";
import fcgLogo from "@/assets/fcg-logo.jpg";

const translations = {
  en: {
    nav: {
      about: "About",
      security: "Security",
      cleaning: "Cleaning",
      careers: "Careers",
      contact: "Contact Us"
    },
    hero: {
      title: "Protecting What Matters.",
      subtitle: "Security • Safety • Trust",
      description: "First Choice Group is a UAE-licensed provider of security and facility services, delivering dependable protection, impeccable standards, and peace of mind to both government and private sectors.",
      cta1: "Request a Quote",
      cta2: "Join Our Team"
    },
    stats: {
      years: "Years of Experience",
      guards: "Licensed Guards",
      operations: "Operations Center",
      projects: "Active Projects",
      approved: "Approved"
    },
    about: {
      title: "A Decade of Trust, Protection, and Performance",
      description: "Founded in 2014, First Choice Group (FCG) is a 100% Emirati-owned company and a proud member of the Mohammed Bin Rashid Establishment for SME Development. With a workforce exceeding 700 trained professionals, FCG provides security, safety, and cleaning solutions designed around trust, compliance, and service excellence.",
      vision: "Our Vision",
      visionText: "To lead the UAE's security and facility services industry through innovation, total quality, and unwavering commitment to client satisfaction.",
      mission: "Our Mission",
      missionText: "To protect lives, property, and reputation through comprehensive risk management, world-class training, and cutting-edge technology.",
      values: "Our Values",
      valuesText: "Integrity • Vigilance • Service • Safety • Excellence",
      licensing: "Licensing & Certification",
      cert1: "Approved by Dubai Police & SIRA",
      cert2: "Licensed by PSBD (Abu Dhabi)",
      cert3: "ISO-compliant safety systems"
    },
    security: {
      title: "Security Services",
      subtitle: "Reliable Protection. Certified Personnel. 24/7 Coverage.",
      description: "FCG provides licensed security officers, supervisors, and control-room operators across multiple sectors. Our clients trust us for reliability, discipline, and full compliance with UAE law enforcement standards.",
      service1: "Manned Guards",
      service1Desc: "Male & female licensed officers",
      service2: "Access Control",
      service2Desc: "Gate operations & patrols",
      service3: "Control Room",
      service3Desc: "CCTV & alarm monitoring",
      service4: "Event Security",
      service4Desc: "VIP & temporary coverage",
      service5: "Concierge",
      service5Desc: "Reception security services",
      service6: "Project Security",
      service6Desc: "Construction & industrial sites",
      industries: "Industries We Serve",
      industry1: "Government",
      industry2: "Education",
      industry3: "Healthcare",
      industry4: "Residential",
      industry5: "Retail",
      industry6: "Industrial"
    },
    cleaning: {
      title: "Cleaning & Facility Services",
      subtitle: "Beyond Safety, We Create Spotless Spaces.",
      description: "First Choice Group delivers professional cleaning and facility management solutions to both commercial and residential clients. Our services combine modern equipment, eco-friendly materials, and well-trained janitorial teams.",
      services: [
        "Office & Commercial Cleaning",
        "Shopping Mall & Retail Cleaning",
        "School & University Cleaning",
        "Hospital & Healthcare Cleaning",
        "Hotels & Resorts",
        "Villas & Private Residences",
        "Restaurants & Kitchens",
        "Government Buildings",
        "Pest Control & Sanitization"
      ]
    },
    training: {
      title: "Training & Quality Control",
      subtitle: "Excellence Starts with Preparation.",
      description: "At FCG, every staff member is trained to meet the highest operational and ethical standards. Our internal training programs are approved by SIRA and align with international safety practices.",
      modules: "Key Training Modules",
      moduleList: [
        "General Security & Site Protocols",
        "Fire Safety & Emergency Response",
        "First Aid & Evacuation",
        "Communication & Report Writing",
        "Conflict Management",
        "Search & Inspection Techniques",
        "Customer Service & Public Interaction",
        "Cleaning Standards & Equipment Handling"
      ]
    },
    clients: {
      title: "Trusted by the UAE's Most Respected Institutions",
      description: "With over a decade of continuous service, FCG proudly partners with government, semi-government, and corporate clients across the UAE.",
      achievement1: "10+ years of uninterrupted government contracts",
      achievement2: "Full security management for Safari Park Dubai, Dubai Courts HQ, and multiple cultural sites",
      achievementsTitle: "Major Achievements"
    },
    careers: {
      title: "Join the First Choice Family",
      description: "We're always looking for motivated, professional individuals to join our growing team. If you are licensed by SIRA or PSBD and ready to serve with integrity — we want you.",
      howToApply: "How to Apply",
      step1: "Email your CV to hr@fcguae.com",
      step2: "Mention nationality, license type, and current location",
      step3: "Only shortlisted candidates will be contacted",
      applyNow: "Apply Now"
    },
    contact: {
      title: "Contact Us",
      subtitle: "Get in touch with First Choice Group",
      getInTouch: "Get In Touch",
      address: "Address",
      addressText: "IT Plaza Building, Office 1011\nDubai Silicon Oasis, UAE\nP.O. Box 237486",
      phone: "Phone",
      email: "Email",
      workingHours: "Working Hours",
      workingHoursText: "Sunday - Friday\n9:00 AM - 7:00 PM",
      requestQuote: "Request a Quote",
      name: "Name",
      service: "Service",
      service1: "Security Services",
      service2: "Cleaning Services",
      service3: "Both Services",
      message: "Message",
      sendMessage: "Send Message"
    },
    footer: {
      rights: "© 2025 First Choice Group LLC - All Rights Reserved",
      member: "Member of Mohammed Bin Rashid Establishment for SME Development",
      licensed: "Licensed by SIRA & PSBD"
    }
  },
  ar: {
    nav: {
      about: "من نحن",
      security: "الأمن",
      cleaning: "التنظيف",
      careers: "الوظائف",
      contact: "اتصل بنا"
    },
    hero: {
      title: "حماية ما يهم",
      subtitle: "الأمن • السلامة • الثقة",
      description: "مجموعة الخيار الأول هي مزود مرخص في الإمارات لخدمات الأمن والمرافق، وتقدم حماية موثوقة ومعايير لا تشوبها شائبة وراحة البال لكل من القطاعين الحكومي والخاص.",
      cta1: "اطلب عرض أسعار",
      cta2: "انضم إلى فريقنا"
    },
    stats: {
      years: "سنوات من الخبرة",
      guards: "حارس مرخص",
      operations: "مركز العمليات",
      projects: "مشروع نشط",
      approved: "معتمد"
    },
    about: {
      title: "عقد من الثقة والحماية والأداء",
      description: "تأسست مجموعة الخيار الأول في عام 2014 كشركة إماراتية بنسبة 100٪ وعضو فخور في مؤسسة محمد بن راشد لدعم مشاريع الشباب. مع قوة عاملة تتجاوز 700 محترف مدرب، تقدم مجموعة الخيار الأول حلول الأمن والسلامة والتنظيف المصممة حول الثقة والامتثال وتميز الخدمة.",
      vision: "رؤيتنا",
      visionText: "قيادة صناعة خدمات الأمن والمرافق في الإمارات من خلال الابتكار والجودة الشاملة والالتزام الثابت برضا العملاء.",
      mission: "مهمتنا",
      missionText: "حماية الأرواح والممتلكات والسمعة من خلال إدارة المخاطر الشاملة والتدريب على مستوى عالمي والتكنولوجيا المتطورة.",
      values: "قيمنا",
      valuesText: "النزاهة • اليقظة • الخدمة • السلامة • التميز",
      licensing: "الترخيص والاعتماد",
      cert1: "معتمد من شرطة دبي وسيرا",
      cert2: "مرخص من قبل إدارة الأعمال الأمنية الخاصة (أبوظبي)",
      cert3: "أنظمة سلامة متوافقة مع ISO"
    },
    security: {
      title: "خدمات الأمن",
      subtitle: "حماية موثوقة. موظفون معتمدون. تغطية على مدار الساعة.",
      description: "تقدم مجموعة الخيار الأول ضباط أمن مرخصين ومشرفين ومشغلي غرف التحكم عبر قطاعات متعددة. يثق عملاؤنا بنا من أجل الموثوقية والانضباط والامتثال الكامل لمعايير إنفاذ القانون في الإمارات.",
      service1: "حراس أمن",
      service1Desc: "ضباط مرخصون من الذكور والإناث",
      service2: "التحكم في الدخول",
      service2Desc: "عمليات البوابة والدوريات",
      service3: "غرفة التحكم",
      service3Desc: "مراقبة كاميرات المراقبة والإنذار",
      service4: "أمن الفعاليات",
      service4Desc: "تغطية كبار الشخصيات والمؤقتة",
      service5: "الاستقبال",
      service5Desc: "خدمات أمن الاستقبال",
      service6: "أمن المشاريع",
      service6Desc: "مواقع البناء والصناعية",
      industries: "الصناعات التي نخدمها",
      industry1: "حكومي",
      industry2: "تعليم",
      industry3: "رعاية صحية",
      industry4: "سكني",
      industry5: "تجزئة",
      industry6: "صناعي"
    },
    cleaning: {
      title: "خدمات التنظيف والمرافق",
      subtitle: "بعيداً عن السلامة، نخلق مساحات نظيفة.",
      description: "تقدم مجموعة الخيار الأول حلول تنظيف وإدارة مرافق احترافية لكل من العملاء التجاريين والسكنيين. تجمع خدماتنا بين المعدات الحديثة والمواد الصديقة للبيئة وفرق النظافة المدربة جيداً.",
      services: [
        "تنظيف المكاتب والمباني التجارية",
        "تنظيف مراكز التسوق والمحلات",
        "تنظيف المدارس والجامعات",
        "تنظيف المستشفيات والمرافق الصحية",
        "الفنادق والمنتجعات",
        "الفلل والمساكن الخاصة",
        "المطاعم والمطابخ",
        "المباني الحكومية",
        "مكافحة الآفات والتعقيم"
      ]
    },
    training: {
      title: "التدريب ومراقبة الجودة",
      subtitle: "التميز يبدأ بالإعداد.",
      description: "في مجموعة الخيار الأول، يتم تدريب كل موظف لتلبية أعلى المعايير التشغيلية والأخلاقية. برامج التدريب الداخلية لدينا معتمدة من قبل سيرا وتتوافق مع ممارسات السلامة الدولية.",
      modules: "وحدات التدريب الرئيسية",
      moduleList: [
        "الأمن العام وبروتوكولات الموقع",
        "السلامة من الحرائق والاستجابة للطوارئ",
        "الإسعافات الأولية والإخلاء",
        "التواصل وكتابة التقارير",
        "إدارة النزاعات",
        "تقنيات التفتيش والبحث",
        "خدمة العملاء والتفاعل العام",
        "معايير التنظيف والتعامل مع المعدات"
      ]
    },
    clients: {
      title: "موثوق به من قبل أكثر المؤسسات احتراماً في الإمارات",
      description: "مع أكثر من عقد من الخدمة المستمرة، تفخر مجموعة الخيار الأول بالشراكة مع العملاء الحكوميين وشبه الحكوميين والشركات في جميع أنحاء الإمارات.",
      achievement1: "أكثر من 10 سنوات من العقود الحكومية المتواصلة",
      achievement2: "إدارة أمنية كاملة لسفاري بارك دبي ومقر محاكم دبي ومواقع ثقافية متعددة",
      achievementsTitle: "الإنجازات الرئيسية"
    },
    careers: {
      title: "انضم إلى عائلة الخيار الأول",
      description: "نبحث دائماً عن أفراد محترفين ومتحمسين للانضمام إلى فريقنا المتنامي. إذا كنت مرخصاً من قبل سيرا أو إدارة الأعمال الأمنية الخاصة ومستعد للخدمة بنزاهة - نريدك.",
      howToApply: "كيفية التقديم",
      step1: "أرسل سيرتك الذاتية إلى hr@fcguae.com",
      step2: "اذكر الجنسية ونوع الترخيص والموقع الحالي",
      step3: "سيتم الاتصال فقط بالمرشحين المختارين",
      applyNow: "قدم الآن"
    },
    contact: {
      title: "اتصل بنا",
      subtitle: "تواصل مع مجموعة الخيار الأول",
      getInTouch: "ابق على تواصل",
      address: "العنوان",
      addressText: "مبنى آي تي بلازا، مكتب 1011\nواحة دبي للسيليكون، الإمارات\nص.ب. 237486",
      phone: "الهاتف",
      email: "البريد الإلكتروني",
      workingHours: "ساعات العمل",
      workingHoursText: "الأحد - الجمعة\n9:00 صباحاً - 7:00 مساءً",
      requestQuote: "اطلب عرض أسعار",
      name: "الاسم",
      service: "الخدمة",
      service1: "خدمات الأمن",
      service2: "خدمات التنظيف",
      service3: "كلا الخدمتين",
      message: "الرسالة",
      sendMessage: "إرسال الرسالة"
    },
    footer: {
      rights: "© 2025 مجموعة الخيار الأول ذ.م.م - جميع الحقوق محفوظة",
      member: "عضو في مؤسسة محمد بن راشد لدعم مشاريع الشباب",
      licensed: "مرخص من قبل سيرا وإدارة الأعمال الأمنية الخاصة"
    }
  }
};

const FCG = () => {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const t = translations[language];
  const isRTL = language === 'ar';
  
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sticky Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-fcg-navy/95 backdrop-blur-sm border-b border-fcg-gold/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <img 
              src={fcgLogo} 
              alt="First Choice Group" 
              className="h-10 object-contain cursor-pointer" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => scrollToSection('about')}
                className="text-white hover:text-fcg-gold transition-colors font-medium"
              >
                {t.nav.about}
              </button>
              <button 
                onClick={() => scrollToSection('security')}
                className="text-white hover:text-fcg-gold transition-colors font-medium"
              >
                {t.nav.security}
              </button>
              <button 
                onClick={() => scrollToSection('cleaning')}
                className="text-white hover:text-fcg-gold transition-colors font-medium"
              >
                {t.nav.cleaning}
              </button>
              <button 
                onClick={() => scrollToSection('careers')}
                className="text-white hover:text-fcg-gold transition-colors font-medium"
              >
                {t.nav.careers}
              </button>
              <Button 
                onClick={() => scrollToSection('contact')}
                className="bg-fcg-gold hover:bg-fcg-gold-light text-fcg-navy"
              >
                {t.nav.contact}
              </Button>
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="text-white hover:text-fcg-gold transition-colors p-2"
                title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              >
                <Languages className="w-5 h-5" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center text-white overflow-hidden pt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            {t.hero.title}
          </h1>
          <p className="text-2xl md:text-3xl mb-4">{t.hero.subtitle}</p>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            {t.hero.description}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" onClick={() => scrollToSection('contact')}>{t.hero.cta1}</Button>
            <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-sm text-white border-white hover:bg-white hover:text-primary" onClick={() => scrollToSection('careers')}>{t.hero.cta2}</Button>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-12 bg-fcg-navy text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-sm">{t.stats.years}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">700+</div>
              <div className="text-sm">{t.stats.guards}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-sm">{t.stats.operations}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">30+</div>
              <div className="text-sm">{t.stats.projects}</div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="text-2xl font-bold mb-2">SIRA & PSBD</div>
              <div className="text-sm">{t.stats.approved}</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img src={teamImage} alt="First Choice Group Team" className="rounded-lg shadow-xl" />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">{t.about.title}</h2>
              <p className="text-lg mb-4 text-muted-foreground">
                {t.about.description}
              </p>
              
              <div className="space-y-6 mt-8">
                <div className="flex items-start gap-4">
                  <Eye className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">{t.about.vision}</h3>
                    <p className="text-muted-foreground">{t.about.visionText}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Target className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">{t.about.mission}</h3>
                    <p className="text-muted-foreground">{t.about.missionText}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Heart className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold text-xl mb-2">{t.about.values}</h3>
                    <p className="text-muted-foreground">{t.about.valuesText}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-muted rounded-lg">
                <h4 className="font-bold mb-3">{t.about.licensing}</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold" />
                    {t.about.cert1}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold" />
                    {t.about.cert2}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold" />
                    {t.about.cert3}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Services */}
      <section id="security" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Shield className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">{t.security.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t.security.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <img src={securityImage} alt="Security Operations" className="rounded-lg shadow-xl" />
            </div>
            <div>
              <p className="text-lg mb-6 text-muted-foreground">
                {t.security.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">{t.security.service1}</h4>
                    <p className="text-sm text-muted-foreground">{t.security.service1Desc}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">{t.security.service2}</h4>
                    <p className="text-sm text-muted-foreground">{t.security.service2Desc}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">{t.security.service3}</h4>
                    <p className="text-sm text-muted-foreground">{t.security.service3Desc}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">{t.security.service4}</h4>
                    <p className="text-sm text-muted-foreground">{t.security.service4Desc}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">{t.security.service5}</h4>
                    <p className="text-sm text-muted-foreground">{t.security.service5Desc}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-bold mb-2">{t.security.service6}</h4>
                    <p className="text-sm text-muted-foreground">{t.security.service6Desc}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <Card className="bg-background">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6">{t.security.industries}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[t.security.industry1, t.security.industry2, t.security.industry3, t.security.industry4, t.security.industry5, t.security.industry6].map(industry => (
                  <div key={industry} className="text-center p-4 bg-muted rounded-lg">
                    <Building2 className="w-8 h-8 mx-auto mb-2 text-fcg-gold" />
                    <p className="font-semibold">{industry}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cleaning Services */}
      <section id="cleaning" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">{t.cleaning.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t.cleaning.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <p className="text-lg mb-6 text-muted-foreground">
                {t.cleaning.description}
              </p>
              <div className="space-y-3">
                {t.cleaning.services.map(service => (
                  <div key={service} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 md:order-2">
              <img src={cleaningImage} alt="Cleaning Services" className="rounded-lg shadow-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Training */}
      <section id="training" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">{t.training.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t.training.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img src={trainingImage} alt="Training Programs" className="rounded-lg shadow-xl" />
            </div>
            <div>
              <p className="text-lg mb-6 text-muted-foreground">
                {t.training.description}
              </p>
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-4">{t.training.modules}</h3>
                  <ul className="space-y-2">
                    {t.training.moduleList.map(module => (
                      <li key={module} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{module}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Clients */}
      <section id="clients" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Award className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">{t.clients.title}</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {t.clients.description}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              'Dubai Municipality',
              'Dubai Courts',
              'Dubai Ambulance Services',
              'Islamic Affairs & Charitable Activities Dept.',
              'Dubai Culture & Arts Authority',
              'Bukhatir Group',
              'Al Naboodah Group',
              'Kharafi National',
              'Al Banai Real Estate'
            ].map(client => (
              <Card key={client}>
                <CardContent className="p-6 text-center">
                  <Building2 className="w-12 h-12 mx-auto mb-3 text-fcg-gold" />
                  <p className="font-semibold">{client}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-fcg-navy text-white">
            <CardContent className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">{t.clients.achievementsTitle}</h3>
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div>
                  <Users className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-lg">{t.clients.achievement1}</p>
                </div>
                <div>
                  <Shield className="w-12 h-12 mx-auto mb-3" />
                  <p className="text-lg">{t.clients.achievement2}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Careers */}
      <section id="careers" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-fcg-gold" />
            <h2 className="text-4xl font-bold mb-4">{t.careers.title}</h2>
            <p className="text-lg mb-8 text-muted-foreground">
              {t.careers.description}
            </p>
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">{t.careers.howToApply}</h3>
                <ul className="space-y-3 text-left">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0 mt-1" />
                    <span>{t.careers.step1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0 mt-1" />
                    <span>{t.careers.step2}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-fcg-gold flex-shrink-0 mt-1" />
                    <span>{t.careers.step3}</span>
                  </li>
                </ul>
                <Button size="lg" className="mt-6">
                  <Mail className="mr-2" />
                  {t.careers.applyNow}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t.contact.title}</h2>
            <p className="text-xl text-muted-foreground">{t.contact.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">{t.contact.getInTouch}</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">{t.contact.address}</p>
                      <p className="text-muted-foreground whitespace-pre-line">{t.contact.addressText}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">{t.contact.phone}</p>
                      <a href="tel:+97142667219" className="text-fcg-navy hover:underline">+971 4 266 7219</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Mail className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">{t.contact.email}</p>
                      <a href="mailto:info@fcguae.com" className="text-fcg-navy hover:underline">info@fcguae.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="w-6 h-6 text-fcg-gold flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold mb-1">{t.contact.workingHours}</p>
                      <p className="text-muted-foreground whitespace-pre-line">{t.contact.workingHoursText}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-6">{t.contact.requestQuote}</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.contact.name}</label>
                    <input type="text" className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.contact.email}</label>
                    <input type="email" className="w-full px-4 py-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.contact.service}</label>
                    <select className="w-full px-4 py-2 border rounded-md">
                      <option>{t.contact.service1}</option>
                      <option>{t.contact.service2}</option>
                      <option>{t.contact.service3}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">{t.contact.message}</label>
                    <textarea rows={4} className="w-full px-4 py-2 border rounded-md"></textarea>
                  </div>
                  <Button type="submit" size="lg" className="w-full">{t.contact.sendMessage}</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-fcg-navy text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">{t.footer.rights}</p>
          <p className="text-sm opacity-90">{t.footer.member}</p>
          <p className="text-sm opacity-90">{t.footer.licensed}</p>
        </div>
      </footer>
    </div>
  );
};

export default FCG;
