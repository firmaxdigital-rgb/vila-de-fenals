const fs = require('fs');
let content = fs.readFileSync('app/viladefenals/acceso/[reservation_code]/tasa/TasaForm.tsx', 'utf-8');

const partialDicts = {
  es: "partial_payment: (g, t, p, r) => `Hemos detectado que sois ${g} huéspedes sujetos a tasa (${t}€). Ya has abonado ${p}€ previamente. El importe pendiente de pago es ${r}€.`",
  en: "partial_payment: (g, t, p, r) => `We detected ${g} guests subject to the tax (${t}€). You have already paid ${p}€. The pending amount to pay is ${r}€.`",
  fr: "partial_payment: (g, t, p, r) => `Nous avons détecté ${g} clients assujettis à la taxe (${t}€). Vous avez déjà payé ${p}€. Le montant restant à payer est de ${r}€.`",
  de: "partial_payment: (g, t, p, r) => `Wir haben ${g} steuerpflichtige Gäste festgestellt (${t}€). Sie haben bereits ${p}€ bezahlt. Der ausstehende Betrag beträgt ${r}€.`",
  nl: "partial_payment: (g, t, p, r) => `We hebben ${g} belastingplichtige gasten gedetecteerd (${t}€). U heeft al ${p}€ betaald. Het openstaande bedrag is ${r}€.`",
  pl: "partial_payment: (g, t, p, r) => `Wykryliśmy ${g} gości podlegających opłacie (${t}€). Zapłaciłeś już ${p}€. Pozostała kwota do zapłaty to ${r}€.`",
  zh: "partial_payment: (g, t, p, r) => `我们检测到 ${g} 位需缴纳税费的客人 (${t}€)。您已经支付了 ${p}€。剩余待支付金额为 ${r}€。`",
  uk: "partial_payment: (g, t, p, r) => `Ми виявили ${g} гостей, які підлягають оподаткуванню (${t}€). Ви вже сплатили ${p}€. Сума, що залишилася до сплати, становить ${r}€.`",
  ru: "partial_payment: (g, t, p, r) => `Мы обнаружили ${g} гостей, подлежащих налогообложению (${t}€). Вы уже заплатили ${p}€. Оставшаяся сумма к оплате составляет ${r}€.`",
  ja: "partial_payment: (g, t, p, r) => `税の対象となる宿泊客が${g}名検出されました（${t}€）。すでに${p}€お支払い済みです。残りの支払い金額は${r}€です。`"
};

for (const lang of Object.keys(partialDicts)) {
  const langRegex = new RegExp('(' + lang + ':\\s*\\{[^}]*)', 'g');
  content = content.replace(langRegex, '$1,\n      ' + partialDicts[lang]);
}

fs.writeFileSync('app/viladefenals/acceso/[reservation_code]/tasa/TasaForm.tsx', content);
