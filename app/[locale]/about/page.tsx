import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Star, Globe, Shield } from "lucide-react";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    en: "About Mystic Lab",
    ko: "Mystic Lab 소개",
    ja: "Mystic Lab について",
    "zh-CN": "关于 Mystic Lab",
    es: "Acerca de Mystic Lab",
    fr: "À propos de Mystic Lab",
    de: "Über Mystic Lab",
  };
  const descriptions: Record<string, string> = {
    en: "Where precision engineering meets the art of illusion.",
    ko: "정밀 공학과 마술의 예술이 만나는 곳.",
    ja: "精密工学とイリュージョンの芸術が出会う場所。",
    "zh-CN": "精密工程与幻术艺术的交汇之处。",
    es: "Donde la ingeniería de precisión se encuentra con el arte de la ilusión.",
    fr: "Là où l'ingénierie de précision rencontre l'art de l'illusion.",
    de: "Wo Präzisionstechnik auf die Kunst der Illusion trifft.",
  };
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mystic-lab.vercel.app";
  const LOCALES = ["en", "ko", "ja", "zh-CN", "es", "fr", "de"] as const;
  return {
    title: titles[locale] ?? titles.en,
    description: descriptions[locale] ?? descriptions.en,
    alternates: {
      canonical: `${SITE_URL}/${locale}/about`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/about`])),
    },
  };
}

const backLabel: Record<string, string> = {
  ko: "홈으로",
  ja: "ホームへ",
  "zh-CN": "返回首页",
  de: "Zurück",
  fr: "Retour",
  es: "Volver",
  en: "Back",
};

type AboutContent = {
  title: string;
  subtitle: string;
  story: { heading: string; body: string };
  philosophy: { heading: string; body: string };
  values: { icon: "star" | "globe" | "shield" | "sparkles"; heading: string; body: string }[];
};

const content: Record<string, AboutContent> = {
  en: {
    title: "About Mystic Lab",
    subtitle: "Where precision engineering meets the art of illusion.",
    story: {
      heading: "Our Story",
      body: "Mystic Lab was born from a simple conviction: professional magicians deserve tools worthy of their artistry. Founded by working magicians who grew tired of props that looked great on paper but failed on stage, we set out to build a different kind of magic company — one obsessed with performance under pressure.\n\nEvery Mystic Lab product is tested in real performance conditions. We don't ship until we'd stake our own reputation on it.",
    },
    philosophy: {
      heading: "Our Philosophy",
      body: "Magic lives in the space between what audiences know is possible and what they see with their own eyes. Our job is to protect that space — to engineer props so reliable that the performer never has to think about the tool, only the performance.\n\nWe believe the best magic equipment is invisible. When our devices work perfectly, nobody talks about the device.",
    },
    values: [
      {
        icon: "star",
        heading: "Uncompromising Quality",
        body: "Every component is chosen for durability and precision. We'd rather delay a launch than ship something that fails mid-performance.",
      },
      {
        icon: "shield",
        heading: "Discretion",
        body: "We understand that your methods are your livelihood. We ship discreetly, store your data securely, and never disclose customer identities.",
      },
      {
        icon: "globe",
        heading: "Global Community",
        body: "Our customers perform on six continents. We build for that — multilingual support, worldwide shipping, and a community that transcends language.",
      },
      {
        icon: "sparkles",
        heading: "Custom Craft",
        body: "When off-the-shelf isn't enough, our engineering team builds bespoke electronic devices tailored to your exact performance needs.",
      },
    ],
  },
  ko: {
    title: "Mystic Lab 소개",
    subtitle: "정밀 공학과 마술의 예술이 만나는 곳.",
    story: {
      heading: "우리의 이야기",
      body: "Mystic Lab은 단순한 확신에서 탄생했습니다. 전문 마술사들은 자신의 예술에 걸맞은 도구를 가질 자격이 있다는 것입니다. 지면상으로는 훌륭해 보이지만 무대에서 실패하는 소품에 지친 현역 마술사들이 설립한 저희는 다른 종류의 마술 회사를 만들고자 했습니다. 압박 속에서의 퍼포먼스에 집착하는 회사.\n\n모든 Mystic Lab 제품은 실제 공연 환경에서 테스트됩니다. 저희 자신의 명성을 걸 수 있을 때까지 출시하지 않습니다.",
    },
    philosophy: {
      heading: "우리의 철학",
      body: "마술은 관객이 알고 있는 것과 자신의 눈으로 보는 것 사이의 공간에서 살아 숨쉽니다. 저희의 역할은 그 공간을 지키는 것입니다. 퍼포머가 절대 도구를 생각할 필요 없이 오직 퍼포먼스에만 집중할 수 있도록 소품을 설계하는 것.\n\n저희는 최고의 마술 장비는 보이지 않아야 한다고 믿습니다. 저희의 장치가 완벽하게 작동할 때, 아무도 그 장치에 대해 이야기하지 않습니다.",
    },
    values: [
      {
        icon: "star",
        heading: "타협 없는 품질",
        body: "모든 부품은 내구성과 정밀도를 기준으로 선택됩니다. 공연 중 실패할 것을 출시하느니 차라리 출시를 미루겠습니다.",
      },
      {
        icon: "shield",
        heading: "철저한 비밀 보장",
        body: "여러분의 기법이 곧 생계라는 것을 잘 알고 있습니다. 소박하게 배송하고, 데이터를 안전하게 보관하며, 고객 신원을 절대 공개하지 않습니다.",
      },
      {
        icon: "globe",
        heading: "글로벌 커뮤니티",
        body: "저희 고객들은 6개 대륙에서 공연합니다. 그것을 위해 만들었습니다. 다국어 지원, 전세계 배송, 언어를 초월한 커뮤니티.",
      },
      {
        icon: "sparkles",
        heading: "커스텀 제작",
        body: "기성 제품으로 충분하지 않을 때, 저희 엔지니어링 팀이 여러분의 정확한 공연 요구에 맞춘 맞춤형 전자 장치를 제작합니다.",
      },
    ],
  },
  ja: {
    title: "Mystic Labについて",
    subtitle: "精密工学と幻想の芸術が出会う場所。",
    story: {
      heading: "私たちのストーリー",
      body: "Mystic Labはシンプルな信念から生まれました。プロのマジシャンは、自分の芸術にふさわしい道具を持つべきだということです。紙の上では素晴らしく見えるが、ステージでは失敗するプロップに嫌気がさした現役マジシャンたちが設立した私たちは、違う種類のマジック会社を作ろうとしました。プレッシャーの下でのパフォーマンスに執着する会社を。\n\nすべてのMystic Lab製品は実際のパフォーマンス条件でテストされます。自分たちの評判を賭けられると確信できるまで出荷しません。",
    },
    philosophy: {
      heading: "私たちの哲学",
      body: "マジックは、観客が知っていることと自分の目で見るものの間の空間に宿ります。私たちの仕事はその空間を守ること — パフォーマーが道具について考える必要がなく、パフォーマンスだけに集中できるようなプロップを設計することです。\n\n最高のマジック道具は見えないものだと私たちは信じています。私たちのデバイスが完璧に機能するとき、誰もそのデバイスについて話しません。",
    },
    values: [
      {
        icon: "star",
        heading: "妥協なき品質",
        body: "すべてのコンポーネントは耐久性と精度を基準に選ばれています。パフォーマンス中に失敗するものを出荷するくらいなら、リリースを延期します。",
      },
      {
        icon: "shield",
        heading: "徹底した秘密保持",
        body: "あなたの手法があなたの生計であることを理解しています。目立たない形で発送し、データを安全に保管し、お客様の身元を決して開示しません。",
      },
      {
        icon: "globe",
        heading: "グローバルコミュニティ",
        body: "私たちのお客様は6大陸でパフォーマンスしています。多言語サポート、世界中への配送、言語を超えたコミュニティ。",
      },
      {
        icon: "sparkles",
        heading: "カスタム制作",
        body: "既製品では不十分な場合、私たちのエンジニアリングチームがあなたの正確なパフォーマンスニーズに合わせたオーダーメイドの電子デバイスを製作します。",
      },
    ],
  },
  "zh-CN": {
    title: "关于 Mystic Lab",
    subtitle: "精密工程与幻术艺术相遇之处。",
    story: {
      heading: "我们的故事",
      body: "Mystic Lab 诞生于一个简单的信念：专业魔术师应该拥有与其艺术相称的工具。我们由一群在职魔术师创立，他们厌倦了那些纸面上看起来不错、却在舞台上失败的道具。我们致力于打造一种不同的魔术公司——一家痴迷于压力下表现的公司。\n\n每一件 Mystic Lab 产品都在真实演出环境中经过测试。只有当我们愿意以自己的声誉担保时，才会发货。",
    },
    philosophy: {
      heading: "我们的理念",
      body: "魔术存在于观众所知与亲眼所见之间的空间。我们的工作就是守护那个空间——设计出如此可靠的道具，让表演者永远不必考虑工具，只需专注于表演。\n\n我们相信最好的魔术设备是隐形的。当我们的装置完美运作时，没有人会谈论那个装置。",
    },
    values: [
      {
        icon: "star",
        heading: "绝不妥协的品质",
        body: "每个零部件都以耐用性和精密度为标准选择。与其发货一件演出中会失败的产品，我们宁愿推迟发布。",
      },
      {
        icon: "shield",
        heading: "绝对保密",
        body: "我们明白您的方法就是您的生计。我们低调发货，安全存储您的数据，绝不透露客户身份。",
      },
      {
        icon: "globe",
        heading: "全球社区",
        body: "我们的客户在六大洲演出。我们为此而生——多语言支持、全球配送，以及超越语言的社区。",
      },
      {
        icon: "sparkles",
        heading: "定制制作",
        body: "当现成产品不够用时，我们的工程团队会根据您的确切演出需求定制电子设备。",
      },
    ],
  },
  es: {
    title: "Sobre Mystic Lab",
    subtitle: "Donde la ingeniería de precisión se une al arte de la ilusión.",
    story: {
      heading: "Nuestra Historia",
      body: "Mystic Lab nació de una convicción simple: los magos profesionales merecen herramientas dignas de su arte. Fundada por magos en activo que se cansaron de accesorios que lucían bien en papel pero fallaban en el escenario, nos propusimos construir un tipo diferente de empresa de magia — una obsesionada con el rendimiento bajo presión.\n\nCada producto de Mystic Lab se prueba en condiciones reales de actuación. No enviamos hasta que apostaríamos nuestra propia reputación en ello.",
    },
    philosophy: {
      heading: "Nuestra Filosofía",
      body: "La magia vive en el espacio entre lo que el público sabe que es posible y lo que ve con sus propios ojos. Nuestro trabajo es proteger ese espacio — diseñar accesorios tan fiables que el intérprete nunca tenga que pensar en la herramienta, solo en la actuación.\n\nCreemos que el mejor equipo de magia es invisible. Cuando nuestros dispositivos funcionan perfectamente, nadie habla del dispositivo.",
    },
    values: [
      {
        icon: "star",
        heading: "Calidad sin Compromisos",
        body: "Cada componente se elige por su durabilidad y precisión. Preferimos retrasar un lanzamiento antes que enviar algo que falle a mitad de una actuación.",
      },
      {
        icon: "shield",
        heading: "Discreción",
        body: "Entendemos que tus métodos son tu medio de vida. Enviamos de forma discreta, almacenamos tus datos de forma segura y nunca revelamos la identidad de los clientes.",
      },
      {
        icon: "globe",
        heading: "Comunidad Global",
        body: "Nuestros clientes actúan en seis continentes. Construimos para eso: soporte multilingüe, envíos mundiales y una comunidad que trasciende el idioma.",
      },
      {
        icon: "sparkles",
        heading: "Fabricación Personalizada",
        body: "Cuando lo estándar no es suficiente, nuestro equipo de ingeniería construye dispositivos electrónicos a medida adaptados a tus necesidades exactas de actuación.",
      },
    ],
  },
  fr: {
    title: "À propos de Mystic Lab",
    subtitle: "Là où l'ingénierie de précision rencontre l'art de l'illusion.",
    story: {
      heading: "Notre Histoire",
      body: "Mystic Lab est né d'une conviction simple : les magiciens professionnels méritent des outils à la hauteur de leur art. Fondée par des magiciens en activité qui en avaient assez d'accessoires séduisants sur le papier mais défaillants sur scène, nous avons voulu créer un autre type de société de magie — obsédée par la performance sous pression.\n\nChaque produit Mystic Lab est testé dans des conditions réelles de spectacle. Nous n'expédions pas tant que nous ne serions pas prêts à y engager notre propre réputation.",
    },
    philosophy: {
      heading: "Notre Philosophie",
      body: "La magie vit dans l'espace entre ce que le public sait être possible et ce qu'il voit de ses propres yeux. Notre rôle est de protéger cet espace — concevoir des accessoires si fiables que l'artiste n'a jamais à penser à l'outil, seulement à la performance.\n\nNous croyons que le meilleur matériel de magie est invisible. Quand nos dispositifs fonctionnent parfaitement, personne ne parle du dispositif.",
    },
    values: [
      {
        icon: "star",
        heading: "Qualité sans Compromis",
        body: "Chaque composant est choisi pour sa durabilité et sa précision. Nous préférons retarder un lancement plutôt qu'expédier quelque chose qui tombe en panne en pleine représentation.",
      },
      {
        icon: "shield",
        heading: "Discrétion",
        body: "Nous comprenons que vos méthodes sont votre gagne-pain. Nous expédions discrètement, stockons vos données en toute sécurité et ne divulguons jamais l'identité de nos clients.",
      },
      {
        icon: "globe",
        heading: "Communauté Mondiale",
        body: "Nos clients se produisent sur six continents. Nous construisons pour cela — support multilingue, livraison mondiale et une communauté qui transcende la langue.",
      },
      {
        icon: "sparkles",
        heading: "Fabrication Sur Mesure",
        body: "Quand le prêt-à-l'emploi ne suffit pas, notre équipe d'ingénierie conçoit des dispositifs électroniques sur mesure adaptés à vos besoins exacts de performance.",
      },
    ],
  },
  de: {
    title: "Über Mystic Lab",
    subtitle: "Wo Präzisionstechnik auf die Kunst der Illusion trifft.",
    story: {
      heading: "Unsere Geschichte",
      body: "Mystic Lab entstand aus einer einfachen Überzeugung: Professionelle Zauberer verdienen Werkzeuge, die ihrer Kunst würdig sind. Gegründet von aktiven Zauberern, die genug von Requisiten hatten, die auf dem Papier gut aussahen, aber auf der Bühne versagten, wollten wir eine andere Art von Zauberunternehmen aufbauen — eines, das von Leistung unter Druck besessen ist.\n\nJedes Mystic Lab Produkt wird unter realen Auftrittsbedinungen getestet. Wir versenden erst, wenn wir unseren eigenen Ruf darauf setzen würden.",
    },
    philosophy: {
      heading: "Unsere Philosophie",
      body: "Magie lebt im Raum zwischen dem, was das Publikum für möglich hält, und dem, was es mit eigenen Augen sieht. Unsere Aufgabe ist es, diesen Raum zu schützen — Requisiten so zuverlässig zu gestalten, dass der Performer nie über das Werkzeug nachdenken muss, nur über die Performance.\n\nWir glauben, dass das beste Zaubereizubehör unsichtbar ist. Wenn unsere Geräte perfekt funktionieren, redet niemand über das Gerät.",
    },
    values: [
      {
        icon: "star",
        heading: "Kompromisslose Qualität",
        body: "Jedes Bauteil wird nach Langlebigkeit und Präzision ausgewählt. Wir verschieben lieber einen Launch, als etwas zu versenden, das mitten in der Vorstellung versagt.",
      },
      {
        icon: "shield",
        heading: "Diskretion",
        body: "Wir verstehen, dass deine Methoden dein Lebensunterhalt sind. Wir versenden diskret, speichern deine Daten sicher und geben Kundenidentitäten nie preis.",
      },
      {
        icon: "globe",
        heading: "Globale Gemeinschaft",
        body: "Unsere Kunden treten auf sechs Kontinenten auf. Dafür bauen wir: mehrsprachiger Support, weltweiter Versand und eine Gemeinschaft, die Sprachgrenzen überwindet.",
      },
      {
        icon: "sparkles",
        heading: "Maßanfertigung",
        body: "Wenn Standardprodukte nicht ausreichen, baut unser Ingenieurteam maßgeschneiderte elektronische Geräte, die auf deine genauen Auftrittsanforderungen zugeschnitten sind.",
      },
    ],
  },
};

const iconMap = {
  star: Star,
  globe: Globe,
  shield: Shield,
  sparkles: Sparkles,
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  const page = content[locale] ?? content.en;
  const back = backLabel[locale] ?? backLabel.en;

  return (
    <div className="min-h-screen bg-[#0D0D1A] px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#A855F7] transition-colors mb-8"
        >
          ← {back}
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-[#A855F7]" />
            <h1
              className="text-3xl font-bold text-[#F0E6FF]"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              {page.title}
            </h1>
          </div>
          <div className="w-20 h-px bg-gradient-to-r from-[#7C3AED] to-transparent mb-4" />
          <p className="text-lg text-[#9CA3AF]">{page.subtitle}</p>
        </div>

        {/* Story */}
        <section className="mb-10 border-t border-[#2D2D4E] pt-8">
          <h2 className="text-xl font-semibold text-[#C084FC] mb-4">{page.story.heading}</h2>
          {page.story.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-[#9CA3AF] leading-relaxed mb-4 last:mb-0">
              {para}
            </p>
          ))}
        </section>

        {/* Philosophy */}
        <section className="mb-12 border-t border-[#2D2D4E] pt-8">
          <h2 className="text-xl font-semibold text-[#C084FC] mb-4">{page.philosophy.heading}</h2>
          {page.philosophy.body.split("\n\n").map((para, i) => (
            <p key={i} className="text-[#9CA3AF] leading-relaxed mb-4 last:mb-0">
              {para}
            </p>
          ))}
        </section>

        {/* Values */}
        <section className="border-t border-[#2D2D4E] pt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {page.values.map((val) => {
              const Icon = iconMap[val.icon];
              return (
                <div
                  key={val.heading}
                  className="bg-[#1A1A2E] border border-[#2D2D4E] rounded-xl p-5"
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <Icon className="w-4 h-4 text-[#A855F7]" />
                    <h3 className="text-sm font-semibold text-[#F0E6FF]">{val.heading}</h3>
                  </div>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{val.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 text-center border-t border-[#2D2D4E] pt-10">
          <p className="text-[#9CA3AF] mb-5 text-sm">
            {locale === "ko"
              ? "직접 경험해보세요."
              : locale === "ja"
              ? "実際に体験してみてください。"
              : locale === "zh-CN"
              ? "亲自体验一下。"
              : locale === "de"
              ? "Erlebe es selbst."
              : locale === "fr"
              ? "Vivez l'expérience."
              : locale === "es"
              ? "Vívelo tú mismo."
              : "Experience it for yourself."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/${locale}/products`}
              className="px-5 py-2.5 bg-[#7C3AED] text-white text-sm font-medium rounded-lg hover:bg-[#6D28D9] transition-colors"
            >
              {locale === "ko"
                ? "컬렉션 보기"
                : locale === "ja"
                ? "コレクションを見る"
                : locale === "zh-CN"
                ? "浏览产品"
                : locale === "de"
                ? "Kollektion ansehen"
                : locale === "fr"
                ? "Voir la collection"
                : locale === "es"
                ? "Ver colección"
                : "View Collection"}
            </Link>
            <Link
              href={`/${locale}/contact`}
              className="px-5 py-2.5 bg-transparent border border-[#2D2D4E] text-[#9CA3AF] text-sm font-medium rounded-lg hover:border-[#7C3AED] hover:text-[#C084FC] transition-colors"
            >
              {locale === "ko"
                ? "문의하기"
                : locale === "ja"
                ? "お問い合わせ"
                : locale === "zh-CN"
                ? "联系我们"
                : locale === "de"
                ? "Kontakt"
                : locale === "fr"
                ? "Nous contacter"
                : locale === "es"
                ? "Contactar"
                : "Get in Touch"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
