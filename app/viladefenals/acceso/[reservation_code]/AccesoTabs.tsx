'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Lock, Unlock, Key, Car, Map as MapIcon, Wifi, Copy, ExternalLink, 
  CheckCircle2, Users, CreditCard, ShieldAlert, AlertCircle, HelpCircle
} from 'lucide-react';
import OpenDoorButton from './OpenDoorButton';
import ShareButton from './ShareButton';
import TasaForm from './tasa/TasaForm';
import { translations, Lang } from './i18n';

const recyclingTranslations: Record<Lang, { title: string; desc: string; room: string; instructions: string }> = {
  es: {
    title: "Reciclaje y Basura",
    desc: "Por favor, clasifique sus residuos correctamente y deposítelos en los contenedores comunitarios. A continuación puede ver la ubicación del cuarto de basuras y las instrucciones de reciclaje:",
    room: "Cuarto de Basuras",
    instructions: "Instrucciones de Reciclaje"
  },
  en: {
    title: "Recycling & Garbage",
    desc: "Please separate your waste properly and deposit it in the community containers. You can view the garbage room location and recycling instructions below:",
    room: "Garbage Room",
    instructions: "Recycling Instructions"
  },
  fr: {
    title: "Recyclage et Ordures",
    desc: "Veuillez trier vos déchets correctement et les déposer dans les conteneurs communautaires. Vous pouvez voir l'emplacement du local à poubelles et les instructions de recyclage ci-dessous :",
    room: "Local à Poubelles",
    instructions: "Instructions de Recyclage"
  },
  de: {
    title: "Recycling & Müll",
    desc: "Bitte trennen Sie Ihren Abfall ordnungsgemäß und entsorgen Sie ihn in den Gemeinschaftscontainern. Unten finden Sie den Standort des Müllraums und die Recyclinganweisungen:",
    room: "Müllraum",
    instructions: "Recycling-Anweisungen"
  },
  pl: {
    title: "Recykling i Śmieci",
    desc: "Prosimy o prawidłową segregację odpadów i wrzucanie ich do wspólnych kontenerów. Poniżej znajduje się lokalizacja altany śmietnikowej oraz instrukcja recyklingu:",
    room: "Altana Śmietnikowa",
    instructions: "Instrukcja Recyklingu"
  },
  zh: {
    title: "垃圾分类与回收",
    desc: "请正确分类您的垃圾并放入社区垃圾箱中。您可以在下方查看垃圾房位置和垃圾分类指南：",
    room: "垃圾房",
    instructions: "垃圾分类指南"
  },
  uk: {
    title: "Сортування та Сміття",
    desc: "Будь ласка, правильно сортуйте відходи та викидайте їх у громадські контейнери. Нижче ви можете переглянути розташування сміттєвої кімнати та інструкції з утилізації:",
    room: "Сміттєва Кімната",
    instructions: "Інструкція з Сортування"
  },
  ru: {
    title: "Сортировка и Мусор",
    desc: "Пожалуйста, правильно сортируйте отходы и выбрасывайте их в общественные контейнеры. Ниже вы можете ознакомиться с расположением мусорной комнаты и инструкциями по сортировке:",
    room: "Мусорная Комната",
    instructions: "Инструкция по Сортировке"
  },
  nl: {
    title: "Recycling & Afval",
    desc: "Gelieve uw afval correct te sorteren en in de gemeenschappelijke containers te deponeren. U kunt de locatie van de afvalruimte en de recyclinginstructies hieronder bekijken:",
    room: "Afvalruimte",
    instructions: "Recycling Instructies"
  },
  ja: {
    title: "リサイクルとゴミ",
    desc: "ゴミを正しく分別し、共同のゴミ箱に入れてください。ゴミ置き場の場所とリサイクル方法の詳細は以下からご確認いただけます：",
    room: "ゴミ置き場",
    instructions: "リサイクル説明書"
  }
};

const accesoTranslations: Record<Lang, {
  fianza_title: string;
  fianza_desc: string;
  fianza_success_title: string;
  fianza_success_desc: string;
  fianza_split_label: string;
  fianza_split_hint: string;
  fianza_limit_label: string;
  fianza_parts_label: string;
  fianza_part: string;
  fianza_paid: string;
  fianza_pay: string;
  fianza_pay_remaining: string;
  fianza_remaining_label: string;
  fianza_pay_full: string;
  fianza_link_generating: string;
  check_in_label: string;
  check_out_label: string;
  whatsapp_btn: string;
  whatsapp_message: string;
  fianza_partial: string;
  payment_received_success: string;
  payment_received_success_desc: string;
  tax_paid_success: string;
  tax_paid_success_desc: string;
  syncing_lock: string;
  check_in_completed_success: string;
  check_in_completed_success_desc: string;
}> = {
  es: {
    fianza_title: "3. Fianza de Seguridad",
    fianza_desc: "Por motivos de seguridad, se requiere un depósito temporal que será devuelto manualmente tras comprobar el estado del apartamento al final de la estancia.",
    fianza_success_title: "Fianza depositada correctamente.",
    fianza_success_desc: "Importe total garantizado de forma segura.",
    fianza_split_label: "¿Tu tarjeta tiene un límite por pago inferior a este importe?",
    fianza_split_hint: "Si lo marcas, podrás definir el límite por transacción y dividiremos el pago total en varios enlaces de menor importe.",
    fianza_limit_label: "Límite de pago por tarjeta (€)",
    fianza_parts_label: "Tramos de pago requeridos:",
    fianza_part: "Tramo",
    fianza_paid: "Pagado",
    fianza_pay: "Pagar",
    fianza_pay_remaining: "Pagar Resto",
    fianza_remaining_label: "Total Restante de Fianza:",
    fianza_pay_full: "Pagar Fianza Completa",
    fianza_link_generating: "Generando Enlace de Pago...",
    check_in_label: "Entrada:",
    check_out_label: "Salida:",
    whatsapp_btn: "Contactar con el Anfitrión",
    whatsapp_message: "¡Hola! Tengo una consulta sobre mi reserva [code] en Vila de Fenals.",
    fianza_partial: "Parcial",
    payment_received_success: "¡PAGO RECIBIDO CORRECTAMENTE!",
    payment_received_success_desc: "Hemos procesado su pago de la Tasa Turística de forma segura. En unos momentos se sincronizará la Fase 3 con su código de acceso de Nuki.",
    tax_paid_success: "¡PAGO DE TASA REGISTRADO CON ÉXITO!",
    tax_paid_success_desc: "Hemos registrado el pago de su Tasa Turística correctamente. Sin embargo, para desbloquear las llaves virtuales y acceder al apartamento, aún debe completar el registro obligatorio de todos los viajeros de la reserva (Fase 1).",
    syncing_lock: "Sincronizando cerradura...",
    check_in_completed_success: "¡Check-in Completado con Éxito!",
    check_in_completed_success_desc: "Su check-in se ha completado correctamente. Sin embargo, sus llaves virtuales y códigos de acceso se activarán automáticamente a partir de la hora prevista para su check in del día de llegada [date]."
  },
  en: {
    fianza_title: "3. Security Deposit",
    fianza_desc: "For security reasons, a temporary deposit is required. It will be refunded manually after checking the apartment's condition at the end of your stay.",
    fianza_success_title: "Deposit paid successfully.",
    fianza_success_desc: "Total amount secured.",
    fianza_split_label: "Does your card have a single payment limit lower than this amount?",
    fianza_split_hint: "If checked, you can enter your card transaction limit and we will split the total fianza into multiple smaller payment links.",
    fianza_limit_label: "Single Payment Limit (€)",
    fianza_parts_label: "Payment Parts Required:",
    fianza_part: "Part",
    fianza_paid: "Paid",
    fianza_pay: "Pay",
    fianza_pay_remaining: "Pay Remaining",
    fianza_remaining_label: "Total Remaining:",
    fianza_pay_full: "Pay Security Deposit",
    fianza_link_generating: "Generating Payment Link...",
    check_in_label: "Check-in:",
    check_out_label: "Check-out:",
    whatsapp_btn: "Contact Host",
    whatsapp_message: "Hello! I have a question regarding my reservation [code] at Vila de Fenals.",
    fianza_partial: "Partial",
    payment_received_success: "Payment Received Successfully!",
    payment_received_success_desc: "We have processed your Tourist Tax payment securely. In a few moments, Phase 3 will synchronize with your Nuki access code.",
    tax_paid_success: "Tourist Tax Paid Successfully!",
    tax_paid_success_desc: "We have processed your Tourist Tax payment securely. However, to unlock your virtual keys and access the apartment, you must still complete the mandatory registration form for all travelers (Phase 1).",
    syncing_lock: "Syncing lock...",
    check_in_completed_success: "Check-in Completed Successfully!",
    check_in_completed_success_desc: "Your check-in has been completed correctly. However, your virtual keys and access codes will be automatically activated starting from the scheduled check-in time on your day of arrival [date]."
  },
  fr: {
    fianza_title: "3. Dépôt de Garantie",
    fianza_desc: "Pour des raisons de sécurité, un dépôt temporaire est requis. Il sera remboursé manuellement après vérification de l'état de l'appartement à la fin de votre séjour.",
    fianza_success_title: "Dépôt effectué avec succès.",
    fianza_success_desc: "Montant total sécurisé de manière fiable.",
    fianza_split_label: "Votre carte a-t-elle une limite de paiement unique inférieure à ce montant ?",
    fianza_split_hint: "Si coché, vous pouvez saisir la limite de transaction de votre carte et nous diviserons le montant total en plusieurs liens de paiement plus petits.",
    fianza_limit_label: "Limite de paiement par carte (€)",
    fianza_parts_label: "Tranches de paiement requises :",
    fianza_part: "Partie",
    fianza_paid: "Payé",
    fianza_pay: "Payer",
    fianza_pay_remaining: "Payer le solde",
    fianza_remaining_label: "Solde restant du dépôt :",
    fianza_pay_full: "Payer le dépôt de garantie complet",
    fianza_link_generating: "Génération du lien de paiement...",
    check_in_label: "Arrivée :",
    check_out_label: "Départ :",
    whatsapp_btn: "Contacter l'Hôte",
    whatsapp_message: "Bonjour ! J'ai une question concernant ma réservation [code] à Vila de Fenals.",
    fianza_partial: "Partiel",
    payment_received_success: "Paiement reçu avec succès !",
    payment_received_success_desc: "Nous avons traité votre paiement de taxe de séjour en toute sécurité. Dans quelques instants, la phase 3 se synchronisera avec votre code d'accès Nuki.",
    tax_paid_success: "Taxe de séjour payée avec succès !",
    tax_paid_success_desc: "Nous avons traité votre paiement de taxe de séjour en toute sécurité. Cependant, pour déverrouiller vos clés virtuelles et accéder à l'appartement, vous devez encore remplir le formulaire d'enregistrement obligatoire pour tous les voyageurs (Phase 1).",
    syncing_lock: "Synchronisation de la serrure...",
    check_in_completed_success: "Enregistrement réussi !",
    check_in_completed_success_desc: "Votre enregistrement a été effectué correctement. Cependant, vos clés virtuelles et codes d'accès seront activés automatiquement à partir de l'heure d'enregistrement prévue le jour de votre arrivée [date]."
  },
  de: {
    fianza_title: "3. Kaution",
    fianza_desc: "Aus Sicherheitsgründen ist eine vorübergehende Kaution erforderlich. Sie wird am Ende Ihres Aufenthalts nach Überprüfung des Zustands der Wohnung manuell zurückerstattet.",
    fianza_success_title: "Kaution erfolgreich hinterlegt.",
    fianza_success_desc: "Gesamtbetrag sicher hinterlegt.",
    fianza_split_label: "Hat Ihre Karte ein Zahlungslimit, das unter diesem Betrag liegt?",
    fianza_split_hint: "Wenn diese Option aktiviert ist, können Sie Ihr Kartenlimit eingeben, und wir teilen die Kaution in mehrere kleinere Zahlungslinks auf.",
    fianza_limit_label: "Zahlunglimit pro Karte (€)",
    fianza_parts_label: "Erforderliche Zahlungsschritte:",
    fianza_part: "Teil",
    fianza_paid: "Bezahlt",
    fianza_pay: "Bezahlen",
    fianza_pay_remaining: "Restbetrag bezahlen",
    fianza_remaining_label: "Verbleibende Kaution:",
    fianza_pay_full: "Vollständige Kaution bezahlen",
    fianza_link_generating: "Zahlungslink wird generiert...",
    check_in_label: "Anreise:",
    check_out_label: "Abreise:",
    whatsapp_btn: "Gastgeber kontaktieren",
    whatsapp_message: "Hallo! Ich habe eine Frage zu meiner Reservierung [code] in Vila de Fenals.",
    fianza_partial: "Teilweise",
    payment_received_success: "Zahlung erfolgreich erhalten!",
    payment_received_success_desc: "Wir haben Ihre Kurtaxenzahlung sicher verarbeitet. In wenigen Momenten wird Phase 3 mit Ihrem Nuki-Zugangscode synchronisiert.",
    tax_paid_success: "Kurtaxe erfolgreich bezahlt!",
    tax_paid_success_desc: "Wir haben Ihre Kurtaxenzahlung sicher verarbeitet. Um Ihre virtuellen Schlüssel freizuschalten und auf die Wohnung zuzugreifen, müssen Sie jedoch noch das obligatorische Anmeldeformular für alle Reisenden ausfüllen (Phase 1).",
    syncing_lock: "Schloss wird synchronisiert...",
    check_in_completed_success: "Check-in erfolgreich abgeschlossen!",
    check_in_completed_success_desc: "Ihr Check-in wurde korrekt durchgeführt. Ihre virtuellen Schlüssel und Zugangscodes werden jedoch ab der geplanten Check-in-Zeit an Ihrem Ankunftstag [date] automatisch aktiviert."
  },
  pl: {
    fianza_title: "3. Kaucja Zabezpieczająca",
    fianza_desc: "Ze względów bezpieczeństwa wymagana jest kaucja wpłacana tymczasowo. Zostanie ona zwrócona ręcznie po sprawdzeniu stanu apartamentu na koniec pobytu.",
    fianza_success_title: "Kaucja wpłacona pomyślnie.",
    fianza_success_desc: "Cała kwota została zabezpieczona.",
    fianza_split_label: "Czy Twoja karta ma limit pojedynczej płatności niższy niż ta kwota?",
    fianza_split_hint: "Po zaznaczeniu możesz podać limit transakcji swojej karty, a my podzielimy kaucję na kilka linków do płatności o niższej kwocie.",
    fianza_limit_label: "Limit płatności kartą (€)",
    fianza_parts_label: "Wymagane raty płatności:",
    fianza_part: "Część",
    fianza_paid: "Opłacone",
    fianza_pay: "Zapłać",
    fianza_pay_remaining: "Zapłać pozostałość",
    fianza_remaining_label: "Pozostała kwota kaucji:",
    fianza_pay_full: "Zapłać całą kaucję",
    fianza_link_generating: "Generowanie linku do płatności...",
    check_in_label: "Meldowanie:",
    check_out_label: "Wymeldowanie:",
    whatsapp_btn: "Skontaktuj się z Gospodarzem",
    whatsapp_message: "Dzień dobry! Mam pytanie dotyczące mojej rezerwacji [code] w Vila de Fenals.",
    fianza_partial: "Częściowo",
    payment_received_success: "Płatność otrzymana pomyślnie!",
    payment_received_success_desc: "Bezpiecznie przetworzyliśmy płatność opłaty klimatycznej. Za chwilę faza 3 zsynchronizuje się z kodem dostępu Nuki.",
    tax_paid_success: "Opłata klimatyczna opłacona pomyślnie!",
    tax_paid_success_desc: "Bezpiecznie przetworzyliśmy płatność opłaty klimatycznej. Jednak aby odblokować wirtualne klucze i uzyskać dostęp do apartamentu, musisz jeszcze wypełnić obowiązkowy formularz rejestracyjny dla wszystkich podróżnych (Faza 1).",
    syncing_lock: "Synchronizowanie zamka...",
    check_in_completed_success: "Zameldowanie ukończone pomyślnie!",
    check_in_completed_success_desc: "Zameldowanie przebiegło pomyślnie. Jednak Twoje wirtualne klucze i kody dostępu zostaną automatycznie aktywowane od planowanej godziny zameldowania w dniu przyjazdu [date]."
  },
  zh: {
    fianza_title: "3. 安全押金",
    fianza_desc: "出于安全考虑，需要收取临时押金。退房时确认公寓完好后将手动退还。",
    fianza_success_title: "押金支付成功。",
    fianza_success_desc: "总金额已安全担保。",
    fianza_split_label: "您的信用卡单笔支付限额是否低于此金额？",
    fianza_split_hint: "如果勾选，您可以输入信用卡单笔额度，我们将把押金总额拆分为多个小额支付链接。",
    fianza_limit_label: "单笔支付限额 (€)",
    fianza_parts_label: "所需拆分支付的部分：",
    fianza_part: "部分",
    fianza_paid: "已付",
    fianza_pay: "支付",
    fianza_pay_remaining: "支付剩余款项",
    fianza_remaining_label: "剩余押金总额：",
    fianza_pay_full: "支付全部安全押金",
    fianza_link_generating: "正在生成支付链接...",
    check_in_label: "入住时间：",
    check_out_label: "退房时间：",
    whatsapp_btn: "联系房东",
    whatsapp_message: "您好！我有关于我在 Vila de Fenals 的预订 [code] 的疑问。",
    fianza_partial: "部分已付",
    payment_received_success: "付款成功接收！",
    payment_received_success_desc: "我们已安全处理您的旅游税付款。稍后，第 3 阶段将与您的 Nuki 门禁密码同步。",
    tax_paid_success: "旅游税支付成功！",
    tax_paid_success_desc: "我们已安全处理您的旅游税付款。但是，要解锁虚拟钥匙并进入公寓，您仍需完成所有旅客的强制性登记表（第 1 阶段）。",
    syncing_lock: "正在同步锁...",
    check_in_completed_success: "入住登记成功完成！",
    check_in_completed_success_desc: "您的入住登记已正确完成。但是，您的虚拟钥匙和准入密码将在您到达日 [date] 的预定入住时间开始自动激活。"
  },
  uk: {
    fianza_title: "3. Страхова застава",
    fianza_desc: "З міркувань безпеки вимагається тимчасова застава, яка буде повернута вручну після перевірки стану апартаментів наприкінці вашого перебування.",
    fianza_success_title: "Заставу успішно внесено.",
    fianza_success_desc: "Загальну суму успішно забезпечено.",
    fianza_split_label: "Ваша картка має ліміт на одну транзакцію, нижчий за цю суму?",
    fianza_split_hint: "Якщо позначено, ви зможете ввести ліміт транзакції вашої картки, і ми розділимо загальну суму застави на кілька менших посилань для оплати.",
    fianza_limit_label: "Ліміт оплати карткою (€)",
    fianza_parts_label: "Необхідні частини оплати:",
    fianza_part: "Частина",
    fianza_paid: "Сплачено",
    fianza_pay: "Сплатити",
    fianza_pay_remaining: "Сплатити залишок",
    fianza_remaining_label: "Залишок застави:",
    fianza_pay_full: "Сплатити повну суму застави",
    fianza_link_generating: "Створення посилання для оплати...",
    check_in_label: "Заїзд:",
    check_out_label: "Виїзд:",
    whatsapp_btn: "Зв'язатися з господарем",
    whatsapp_message: "Привіт! У мене є питання щодо мого бронювання [code] у Vila de Fenals.",
    fianza_partial: "Частково",
    payment_received_success: "Платіж успішно отримано!",
    payment_received_success_desc: "Ми безпечно обробили ваш платіж туристичного збору. За кілька хвилин Фаза 3 синхронізується з вашим кодом доступу Nuki.",
    tax_paid_success: "Туристичний збір успішно сплачено!",
    tax_paid_success_desc: "Ми безпечно обробили ваш платіж туристичного збору. Однак, щоб розблокувати віртуальні ключі та отримати доступ до апартаментів, вам все одно потрібно заповнити обов'язкову реєстраційну форму для всіх мандрівників (Фаза 1).",
    syncing_lock: "Синхронізація замка...",
    check_in_completed_success: "Реєстрацію успішно завершено!",
    check_in_completed_success_desc: "Реєстрація пройшла успішно. Однак ваші віртуальні ключі та коди доступу будуть автоматично активовані, починаючи із запланованого часу заїзду в день вашого прибуття [date]."
  },
  ru: {
    fianza_title: "3. Страховой залог",
    fianza_desc: "Из соображений безопасности требуется временный залог, который будет возвращен вручную после проверки состояния апартаментов в конце вашего пребывания.",
    fianza_success_title: "Залог успешно внесен.",
    fianza_success_desc: "Вся сумма успешно обеспечена.",
    fianza_split_label: "У вашей карты лимит на одну транзакцию ниже этой суммы?",
    fianza_split_hint: "Если отмечено, вы сможете ввести лимит транзакции вашей карты, и мы разделим общую сумму залога на несколько меньших ссылок для оплаты.",
    fianza_limit_label: "Лимит оплаты картой (€)",
    fianza_parts_label: "Необходимые части оплаты:",
    fianza_part: "Часть",
    fianza_paid: "Оплачено",
    fianza_pay: "Оплатить",
    fianza_pay_remaining: "Оплатить остаток",
    fianza_remaining_label: "Остаток залога:",
    fianza_pay_full: "Оплатить полную сумму залога",
    fianza_link_generating: "Создание ссылки для оплаты...",
    check_in_label: "Заезд:",
    check_out_label: "Выезд:",
    whatsapp_btn: "Связаться с хозяином",
    whatsapp_message: "Здравствуйте! У меня есть вопрос относительно моего бронирования [code] в Vila de Fenals.",
    fianza_partial: "Частично",
    payment_received_success: "Платеж успешно получен!",
    payment_received_success_desc: "Мы безопасно обработали ваш платеж туристического сбора. Через несколько секунд Фаза 3 синхронизируется с вашим кодом доступа Nuki.",
    tax_paid_success: "Туристический сбор успешно уплачен!",
    tax_paid_success_desc: "Мы безопасно обработали ваш платеж туристического сбора. Однако, чтобы разблокировать виртуальные ключи и получить доступ к апартаментам, вам все равно необходимо заполнить обязательную регистрационную форму для всех путешественников (Фаза 1).",
    syncing_lock: "Синхронизация замка...",
    check_in_completed_success: "Регистрация успешно завершена!",
    check_in_completed_success_desc: "Регистрация прошла успешно. Однако ваши виртуальные ключи и коды доступа будут автоматически активированы, начиная с запланированного времени заезда в день вашего прибытия [date]."
  },
  nl: {
    fianza_title: "3. Borgsom",
    fianza_desc: "Om veiligheidsredenen is een tijdelijke borgsom vereist. Deze wordt handmatig teruggestort na controle van de staat van het appartement aan het einde van uw verblijf.",
    fianza_success_title: "Borgsom succesvol betaald.",
    fianza_success_desc: "Totaalbedrag veiliggesteld.",
    fianza_split_label: "Heeft uw kaart een betalingslimiet die lager is dan dit bedrag?",
    fianza_split_hint: "Indien aangevinkt, kunt u de transactielimiet van uw kaart invoeren en splitsen we de totale borgsom op in meerdere kleinere betalingslinks.",
    fianza_limit_label: "Betalingslimiet per kaart (€)",
    fianza_parts_label: "Vereiste betalingsdelen:",
    fianza_part: "Deel",
    fianza_paid: "Betaald",
    fianza_pay: "Betalen",
    fianza_pay_remaining: "Resterend bedrag betalen",
    fianza_remaining_label: "Totaal resterende borgsom:",
    fianza_pay_full: "Volledige borgsom betalen",
    fianza_link_generating: "Betalingslink genereren...",
    check_in_label: "Check-in:",
    check_out_label: "Check-out:",
    whatsapp_btn: "Contact opnemen met Host",
    whatsapp_message: "Hallo! Ik heb een vraag over mijn reservering [code] bij Vila de Fenals.",
    fianza_partial: "Gedeeltelijk",
    payment_received_success: "Betaling succesvol ontvangen!",
    payment_received_success_desc: "We hebben uw betaling voor de toeristenbelasting veilig verwerkt. Binnen enkele ogenblikken wordt Fase 3 gesynchroniseerd met uw Nuki-toegangscode.",
    tax_paid_success: "Toeristenbelasting succesvol betaald!",
    tax_paid_success_desc: "We hebben uw betaling voor de toeristenbelasting veilig verwerkt. Om uw virtuele sleutels te ontgrendelen en toegang te krijgen tot het appartement, moet u echter nog het verplichte registratieformulier voor alle reizigers invullen (Fase 1).",
    syncing_lock: "Slot synchroniseren...",
    check_in_completed_success: "Check-in succesvol afgerond!",
    check_in_completed_success_desc: "Uw check-in is correct afgerond. Uw virtuele sleutels en toegangscodes worden echter automatisch geactiveerd vanaf de geplande check-in tijd op uw dag van aankomst [date]."
  },
  ja: {
    fianza_title: "3. 保証金",
    fianza_desc: "安全上の理由から、一時的な保証金が必要となります。滞在終了時にアパートの状態を確認した後、手動で返金されます。",
    fianza_success_title: "保証金の支払いが完了しました。",
    fianza_success_desc: "総額が安全に担保されました。",
    fianza_split_label: "カードの1回あたりの利用限度額がこの金額を下回っていますか？",
    fianza_split_hint: "選択すると、カードの利用限度額を入力でき、保証金総額を複数の小さな支払いリンクに分割します。",
    fianza_limit_label: "カードの利用限度額 (€)",
    fianza_parts_label: "必要な分割支払い：",
    fianza_part: "分割",
    fianza_paid: "支払済",
    fianza_pay: "支払う",
    fianza_pay_remaining: "残額を支払う",
    fianza_remaining_label: "保証金の残額：",
    fianza_pay_full: "保証金全額を支払う",
    fianza_link_generating: "支払いリンクを生成中...",
    check_in_label: "チェックイン：",
    check_out_label: "チェックアウト：",
    whatsapp_btn: "ホストに連絡する",
    whatsapp_message: "こんにちは！Vila de Fenalsでの予約[code]について質問があります。",
    fianza_partial: "一部支払済",
    payment_received_success: "支払いが正常に受信されました！",
    payment_received_success_desc: "宿泊税の支払いが安全に処理されました。間もなく、フェーズ3がNukiアクセスコードと同期します。",
    tax_paid_success: "宿泊税が正常に支払われました！",
    tax_paid_success_desc: "宿泊税の支払いが安全に処理されました。ただし、バーチャルキーをロック解除してアパートに入るには、すべての宿泊者の必須登録フォーム（フェーズ1）を完了する必要があります。",
    syncing_lock: "ロックを同期中...",
    check_in_completed_success: "チェックインが正常に完了しました！",
    check_in_completed_success_desc: "チェックインが正しく完了しました。ただし、バーチャルキーとアクセスコードは、到着予定日のチェックイン予定時刻[date]から自動的に有効になります。"
  }
};

interface AccesoTabsProps {
  reservation: any;
  travelers: any[];
  lang: Lang;
  paymentStatus?: string;
  testMode: boolean;
  isValidTime: boolean;
}

export default function AccesoTabs({ 
  reservation, 
  travelers, 
  lang, 
  paymentStatus, 
  testMode,
  isValidTime
}: AccesoTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSimulated = searchParams.get('simulated') === 'true';
  const dict = translations[lang] || translations['es'];
  const rDict = recyclingTranslations[lang] || recyclingTranslations['es'];
  const aDict = accesoTranslations[lang] || accesoTranslations['es'];
  const decodedCode = reservation.reservation_code;
  const isTaxPaidFromDB = reservation.is_tax_paid === true;
  const taxPaidAmount = parseFloat(reservation.tax_paid || '0');
  const [localTaxPaid, setLocalTaxPaid] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (reservation.is_tax_paid === false) {
        // If the database says it's not paid, clear the local storage cache to match the DB ground truth
        localStorage.removeItem(`paycomet_success_${decodedCode}`);
        setLocalTaxPaid(false);
      } else {
        const stored = localStorage.getItem(`paycomet_success_${decodedCode}`) === 'true';
        if (stored) {
          setLocalTaxPaid(true);
        }
      }
    }
  }, [decodedCode, reservation.is_tax_paid]);

  // isTaxPaid will be calculated below after remainingTax
  // const isTaxPaid = isTaxPaidFromDB || localTaxPaid;

  const depositPaidFromDB = parseFloat(reservation.deposit_paid) || 0;
  const [localDepositPaid, setLocalDepositPaid] = useState(depositPaidFromDB);
  const [isSplitSelected, setIsSplitSelected] = useState(false);
  const [cardLimit, setCardLimit] = useState('500');
  const [generatingLinks, setGeneratingLinks] = useState<Record<number, boolean>>({});
  const [hasConfirmedDeposit, setHasConfirmedDeposit] = useState(false);

  useEffect(() => {
    setLocalDepositPaid(parseFloat(reservation.deposit_paid) || 0);
  }, [reservation.deposit_paid]);

  useEffect(() => {
    if (paymentStatus === 'deposit_success' && !hasConfirmedDeposit) {
      const amountStr = searchParams.get('deposit_amount') || '0';
      const parsedAmt = parseFloat(amountStr);
      console.log(`[AccesoTabs] Deposit payment success landed. Confirming deposit amount: ${parsedAmt}€`);

      setHasConfirmedDeposit(true);

      const endpointsToCall = [];
      endpointsToCall.push(
        fetch('/api/payment/confirm-deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservation_code: decodedCode, amount: parsedAmt })
        })
      );

      Promise.all(endpointsToCall).then(async (responses) => {
        const res = responses[0];
        if (res.ok) {
          const data = await res.json();
          console.log("[AccesoTabs] Deposit confirm response:", data);
          if (data.success) {
            setLocalDepositPaid(data.deposit_paid);
          }
        }
        router.refresh();
      }).catch(err => {
        console.error("[AccesoTabs] Error calling confirm-deposit API:", err);
        router.refresh();
      });
    }
  }, [paymentStatus, hasConfirmedDeposit, decodedCode, searchParams, router]);
  
  // Tab navigation state
  const [activeTab, setActiveTab] = useState('acceso');
  
  // WiFi copy state
  const [wifiCopied, setWifiCopied] = useState(false);
  
  // Community rules modal state
  const [showRules, setShowRules] = useState(false);
  
  // Image zoom modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Dynamic counter of minors among unregistered guests to calculate tax in parallel
  const [unregisteredMinorsCount, setUnregisteredMinorsCount] = useState(0);

  // Dynamic share URL constructed from window.location.origin to match exact environments (local, staging, prod)
  const [shareUrl, setShareUrl] = useState(`https://viladefenals.activavivienda.es/viladefenals/acceso/${reservation.reservation_code}/registro?lang=${lang}${testMode ? '&micro_charge=true' : ''}`);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/viladefenals/acceso/${reservation.reservation_code}/registro?lang=${lang}${testMode ? '&micro_charge=true' : ''}`);
    }
  }, [reservation.reservation_code, lang, testMode]);

  useEffect(() => {
    if (paymentStatus === 'success') {
      console.log("[AccesoTabs] Successful payment landed. Storing persistent state and calling confirm API fallback...");
      
      // Store in localStorage immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem(`paycomet_success_${decodedCode}`, 'true');
        setLocalTaxPaid(true);
      }

      // Invoke simulated webhook if requested, and also update general confirmation in DB
      const endpointsToCall = [];
      if (isSimulated && !isTaxPaidFromDB) {
        endpointsToCall.push(
          fetch('/api/paycomet/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservation_code: decodedCode, status: 'PAID' })
          })
        );
      } else if (!isTaxPaidFromDB) {
        endpointsToCall.push(
          fetch('/api/payment/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reservation_code: decodedCode })
          })
        );
      }

      if (endpointsToCall.length > 0) {
        Promise.all(endpointsToCall).then(() => {
          console.log("[AccesoTabs] Backend payment fallbacks successfully updated.");
          router.refresh();
        }).catch(err => {
          console.error("[AccesoTabs] Error in fallback backend confirm calls:", err);
          router.refresh();
        });
      }
    }
  }, [paymentStatus, isSimulated, isTaxPaidFromDB, decodedCode, router]);

  const totalGuests = reservation.total_guests || 2;

  const formattedCheckInDate = (() => {
    try {
      if (reservation.check_in && reservation.check_in.includes('-')) {
        const parts = reservation.check_in.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return reservation.check_in;
    } catch (e) {
      return reservation.check_in;
    }
  })();

  const formattedCheckOutDate = (() => {
    try {
      if (reservation.check_out && reservation.check_out.includes('-')) {
        const parts = reservation.check_out.split('-');
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return reservation.check_out;
    } catch (e) {
      return reservation.check_out;
    }
  })();

  const completedForms = travelers.length;
  const isPhase1Complete = completedForms >= totalGuests;
  const hasDeposit = reservation.has_deposit === true;
  const depositAmount = parseFloat(reservation.deposit_amount) || 0;
  const depositPaid = Math.max(parseFloat(reservation.deposit_paid) || 0, localDepositPaid);
  const isDepositComplete = !hasDeposit || (depositPaid >= depositAmount);

  const [isFinalizingFallback, setIsFinalizingFallback] = useState(false);

  // Calculate nights
  const checkIn = new Date(reservation.check_in);
  const checkOut = new Date(reservation.check_out);
  const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
  let nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const rawNights = nights;
  if (nights > 7) nights = 7;
  if (nights < 1) nights = 1;

  // 1. Calculate paying guests already registered (Age >= 16 on check-in date)
  let registeredPaying = 0;
  travelers.forEach((t) => {
    if (!t.fecha_nacimiento) {
      registeredPaying++;
      return;
    }
    const birthDate = new Date(t.fecha_nacimiento);
    let ageOnCheckIn = checkIn.getFullYear() - birthDate.getFullYear();
    const m = checkIn.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && checkIn.getDate() < birthDate.getDate())) {
      ageOnCheckIn--;
    }
    if (ageOnCheckIn >= 16) {
      registeredPaying++;
    }
  });

  // 2. Count unregistered remaining guests
  const unregisteredCount = Math.max(0, totalGuests - completedForms);

  // 3. Compute dynamic paying guests based on unregistered selection
  // At least one guest in the total guests count must be an adult (paying).
  // Total minors = registeredMinors + unregisteredMinors
  const registeredMinors = completedForms - registeredPaying;
  const maxUnregisteredMinors = Math.max(0, Math.min(unregisteredCount, totalGuests - 1 - registeredMinors));
  
  // Clamp selected minors count between 0 and maxUnregisteredMinors
  const safeMinorsCount = Math.min(Math.max(0, unregisteredMinorsCount), maxUnregisteredMinors);
  const unregisteredPayingCount = Math.max(0, unregisteredCount - safeMinorsCount);
  
  const payingGuests = registeredPaying + unregisteredPayingCount;
  
  const rate = 1.75;
  const calculatedTax = parseFloat((payingGuests * nights * rate).toFixed(2));
  const remainingTax = Math.max(0, parseFloat((calculatedTax - taxPaidAmount).toFixed(2)));
  const isTaxPaid = (isTaxPaidFromDB && remainingTax <= 0) || localTaxPaid;

  const isFullyUnlocked = isPhase1Complete && isTaxPaid && isDepositComplete;

  // Client-side fallback to finalize registration if fully unlocked but Nuki PIN is missing
  useEffect(() => {
    if (isFullyUnlocked && !reservation.nuki_pin && !isFinalizingFallback) {
      setIsFinalizingFallback(true);
      console.log("[AccesoTabs] All conditions met but Nuki PIN is missing. Triggering finalization fallback...");
      fetch('/api/registro-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservation_code: decodedCode })
      })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          console.log("[AccesoTabs] Fallback finalization succeeded:", data);
          router.refresh();
        } else {
          const errText = await res.text();
          console.error("[AccesoTabs] Fallback finalization API returned error:", errText);
          setIsFinalizingFallback(false);
        }
      })
      .catch(err => {
        console.error("[AccesoTabs] Fallback finalization API exception:", err);
        setIsFinalizingFallback(false);
      });
    }
  }, [isFullyUnlocked, reservation.nuki_pin, isFinalizingFallback, decodedCode, router]);

  // Build travelers checklist slots
  const guestSlots = [];
  for (let i = 0; i < totalGuests; i++) {
    if (travelers[i]) {
      guestSlots.push({
        registered: true,
        nombre: travelers[i].nombre,
        apellidos: travelers[i].apellidos,
        tipo_documento: travelers[i].tipo_documento,
        numero_documento: travelers[i].numero_documento,
        isMinor: travelers[i].parentesco ? true : false,
      });
    } else {
      guestSlots.push({
        registered: false,
        slotIndex: i + 1,
      });
    }
  }

  const handleCopyWifi = () => {
    navigator.clipboard.writeText('86075541');
    setWifiCopied(true);
    setTimeout(() => setWifiCopied(false), 2000);
  };

  const handlePayDeposit = async (amount: number, index: number) => {
    setGeneratingLinks(prev => ({ ...prev, [index]: true }));
    try {
      const res = await fetch('/api/payment/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservation_code: decodedCode,
          payment_type: 'deposit',
          payment_amount: amount
        })
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Error al generar el enlace de pago.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setGeneratingLinks(prev => ({ ...prev, [index]: false }));
    }
  };

  const ContactHostButton = () => {
    const whatsAppLink = `https://wa.me/34661690375?text=${encodeURIComponent(
      aDict.whatsapp_message.replace('[code]', decodedCode)
    )}`;

    return (
      <div className="pt-4 border-t border-white/5 mt-4">
        <a
          href={whatsAppLink}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2.5 w-full bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-md"
        >
          <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.394 9.805-9.805.002-2.618-1.013-5.082-2.86-6.93C16.376 1.933 13.91 1.917 12 1.917c-5.41 0-9.809 4.398-9.813 9.815-.002 1.62.476 3.206 1.383 4.622L2.508 21.5l5.244-1.378zM17.472 14.382c-.3-.149-1.778-.878-2.057-.98-.28-.1-.484-.148-.688.15-.2.299-.778.98-.953 1.18-.175.199-.349.224-.65.075-1.125-.562-1.993-1.002-2.774-2.335-.204-.349.204-.324.582-1.077.062-.124.031-.233-.016-.332-.047-.1-.484-1.171-.662-1.602-.175-.42-.35-.362-.484-.369-.125-.007-.268-.007-.41-.007s-.375.053-.57.269c-.2.215-.757.74-.757 1.804s.774 2.09 1.88 2.24c.11.015 2.155 3.292 5.22 4.615.73.315 1.3.503 1.74.643.73.23 1.4.198 1.92.12.58-.087 1.778-.727 2.027-1.43.25-.702.25-1.3.175-1.43-.075-.13-.275-.205-.575-.355z"/>
          </svg>
          <span>{aDict.whatsapp_btn}</span>
        </a>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Dynamic Payment Status Alerts */}
      {paymentStatus === 'success' && (
        <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-2xl p-4 text-sm text-emerald-200 flex items-start gap-2.5 shadow-[0_4px_20px_rgba(16,185,129,0.15)] animate-fade-in">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400 mt-0.5" />
          <div className="space-y-1">
            {isPhase1Complete ? (
              <>
                <span className="font-bold text-white uppercase tracking-wider text-xs">
                  {aDict.payment_received_success}
                </span>
                <p className="leading-relaxed opacity-90">
                  {aDict.payment_received_success_desc}
                </p>
              </>
            ) : (
              <>
                <span className="font-bold text-white uppercase tracking-wider text-xs text-emerald-300">
                  {aDict.tax_paid_success}
                </span>
                <p className="leading-relaxed opacity-90 text-emerald-100">
                  {aDict.tax_paid_success_desc}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {paymentStatus === 'error' && (
        <div className="bg-red-500/20 border border-red-500/40 rounded-2xl p-4 text-sm text-red-200 flex items-start gap-2.5 shadow-[0_4px_20px_rgba(239,68,68,0.15)] animate-fade-in">
          <ShieldAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white uppercase tracking-wider text-xs">Error en la Transacción</span>
            <p className="leading-relaxed opacity-90">
              La pasarela de pagos PayComet denegó el cobro o la operación fue cancelada. Por favor, vuelva a intentarlo.
            </p>
          </div>
        </div>
      )}

      {/* Tab Navigation (Glassmorphic Tabs) */}
      <div className="flex justify-between bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('acceso')}
          className={`flex-1 py-3 px-1 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'acceso' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Lock size={16} className={activeTab === 'acceso' ? 'text-white animate-pulse' : 'text-white/60'} /> 
          {dict.tab_access}
        </button>
        
        <button
          onClick={() => setActiveTab('llaves')}
          className={`flex-1 py-3 px-1 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'llaves' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Key size={16} className={activeTab === 'llaves' ? 'text-white' : 'text-white/60'} /> 
          {dict.tab_zones}
        </button>

        <button
          onClick={() => setActiveTab('parking')}
          className={`flex-1 py-3 px-1 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'parking' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <Car size={16} className={activeTab === 'parking' ? 'text-white' : 'text-white/60'} /> 
          {dict.tab_parking}
        </button>

        <button
          onClick={() => setActiveTab('barrio')}
          className={`flex-1 py-3 px-1 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
            activeTab === 'barrio' ? 'bg-gradient-to-r from-teal-400/90 to-cyan-500/90 text-white shadow-lg shadow-cyan-500/20' : 'text-white/60 hover:text-white hover:bg-white/5'
          }`}
        >
          <MapIcon size={16} className={activeTab === 'barrio' ? 'text-white' : 'text-white/60'} /> 
          {dict.tab_neighborhood}
        </button>
      </div>

      {/* ==========================================
          TAB 1: ACCESO (DYNAMIC LOCK/UNLOCK SCREEN)
          ========================================== */}
      {activeTab === 'acceso' && (
        <div className="space-y-4 animate-fade-in">
          {!isFullyUnlocked ? (
            /* locked check-in progression flow */
            <div className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 border border-red-500/35 flex items-center justify-center shadow-lg">
                  <Lock size={20} className="text-red-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-white/95">{dict.keys_blocked_title || 'Apartment Keys Blocked'}</h4>
                  <p className="text-sm text-white/70 leading-relaxed max-w-xs mx-auto">
                    {dict.keys_blocked_desc || 'La normativa turística de Cataluña exige el registro normativo y la liquidación tributaria antes de habilitar el acceso.'}
                  </p>
                </div>
              </div>

              {/* Phase 1: travelers */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                    <Users size={14} className="text-cyan-400" />
                    <span>{dict.phase1_title || '1. Registro Normativo (Mossos)'}</span>
                  </h3>
                  <span className="text-xs font-bold text-white bg-cyan-400/20 px-2 py-0.5 rounded-full border border-cyan-400/30">
                    {completedForms} / {totalGuests} {dict.completed_text || 'Completados'}
                  </span>
                </div>

                <div className="space-y-2">
                  {guestSlots.map((slot, idx) => {
                    if (slot.registered) {
                      const travelerObj = travelers[idx];
                      return (
                        <div key={idx} className="flex justify-between items-center bg-green-500/10 border border-green-500/25 rounded-xl p-3 text-sm animate-fade-in">
                          <div>
                            <p className="font-semibold text-white">{slot.nombre} {slot.apellidos}</p>
                            <p className="text-[11px] text-green-300/80">
                              {slot.isMinor ? (dict.minor_registered || 'Menor Registrado (Vinculado)') : `${slot.tipo_documento}: ${slot.numero_documento}`}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/20 px-2 py-0.5 rounded-md">
                              ✓ {dict.ready_text || 'Listo'}
                            </span>
                            
                            {!isFullyUnlocked && travelerObj?.id && (
                              <Link
                                href={`/viladefenals/acceso/${decodedCode}/registro?lang=${lang}&edit_id=${travelerObj.id}${testMode ? '&micro_charge=true' : ''}`}
                                className="text-xs font-bold text-cyan-300 hover:text-cyan-100 bg-white/5 hover:bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md transition-all active:scale-95 shrink-0"
                              >
                                {dict.edit_action || 'Editar'}
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-3 text-sm">
                          <div>
                            <p className="font-semibold text-white/50">{dict.guest_text || 'Huésped'} {slot.slotIndex}</p>
                            <p className="text-[11px] text-white/30">{dict.pending_obligatory || 'Pendiente de registro obligatorio'}</p>
                          </div>
                          <Link
                            href={`/viladefenals/acceso/${decodedCode}/registro?lang=${lang}${testMode ? '&micro_charge=true' : ''}`}
                            className="text-xs font-bold text-cyan-300 hover:text-cyan-100 bg-white/5 hover:bg-white/10 border border-white/15 px-3 py-1 rounded-md transition-all active:scale-95 shrink-0"
                          >
                            + {dict.register_action || 'Registrar'}
                          </Link>
                        </div>
                      );
                    }
                  })}
                </div>

                {!isPhase1Complete && (
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2 mt-2">
                    <p className="text-[11px] text-white/50 leading-relaxed">
                      {dict.group_share_desc || '¿Viaja en grupo? Comparta este enlace de registro único para que cada viajero rellene su propia ficha desde su móvil:'}
                    </p>
                    <ShareButton 
                      shareUrl={shareUrl} 
                      preFilledText={dict.share_text || 'Hola, te envío el enlace para rellenar el formulario obligatorio de viajeros para nuestro alojamiento en Vila de Fenals:'} 
                      dict={dict} 
                    />
                  </div>
                )}

              </div>

              {/* Phase 2: Tourist Tax */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                    <CreditCard size={14} className="text-cyan-400" />
                    <span>{dict.phase2_title || '2. Pago Tasa Turística'}</span>
                  </h3>
                  {isTaxPaid ? (
                    <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                      ✓ {dict.paid_text || 'Pagado'}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-yellow-300 uppercase tracking-widest bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
                      {dict.pending_text || 'Pendiente'}
                    </span>
                  )}
                </div>

                {isTaxPaid ? (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-300 flex items-center gap-2">
                    <CheckCircle2 size={16} className="shrink-0 text-green-400" />
                    <div>
                      <span className="font-bold">{dict.payment_verified || 'Pago verificado correctamente.'}</span>
                      <p className="text-[11px] text-white/60">{dict.payment_verified_desc || 'Tasa turística de la Generalitat liquidada por pasarela PayComet.'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Unregistered guests minors count question (if applicable) */}
                    {unregisteredCount > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2">
                        <p className="text-xs text-white/80 font-semibold leading-tight flex items-center gap-1">
                          <HelpCircle size={12} className="text-cyan-400 shrink-0" />
                          <span>{dict.unregistered_minors_prompt || 'De los viajeros restantes, ¿cuántos son menores de 16 años (exentos de tasa)?'}</span>
                        </p>
                        
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-white/40 leading-none">
                            {dict.payment_direct_exempt_hint || 'La ley de Cataluña exime del pago de la tasa a los menores de 16 años.'}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setUnregisteredMinorsCount(prev => Math.max(0, prev - 1))}
                              disabled={unregisteredMinorsCount <= 0}
                              className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 text-white font-bold flex items-center justify-center text-xs hover:bg-white/15 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              -
                            </button>
                            <span className="text-xs font-mono font-bold text-white px-1.5 min-w-[12px] text-center">
                              {unregisteredMinorsCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => setUnregisteredMinorsCount(prev => Math.min(maxUnregisteredMinors, prev + 1))}
                              disabled={unregisteredMinorsCount >= maxUnregisteredMinors}
                              className="w-6 h-6 rounded-lg bg-white/10 border border-white/15 text-white font-bold flex items-center justify-center text-xs hover:bg-white/15 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-sm bg-white/5 border border-white/5 rounded-xl p-3">
                      <div>
                        <p className="text-white/80 font-medium">
                          {dict.stay_text || 'Estancia'}: {nights} {nights === 1 ? (dict.noche_text || 'noche') : (dict.noches_text || 'noches')} ({dict.capped_text || 'Máx. 7 noches'})
                        </p>
                        <p className="text-[11px] text-white/50">
                          {payingGuests} {dict.de_text || 'de'} {totalGuests} {dict.subjects_tax_text || 'huéspedes sujetos a tasa (≥16 años)'}
                        </p>
                        {taxPaidAmount > 0 && remainingTax > 0 && (
                          <p className="text-[11px] text-yellow-400 mt-1">
                            Abonado: {taxPaidAmount.toFixed(2)}€ | Falta: {remainingTax.toFixed(2)}€
                          </p>
                        )}
                      </div>
                      <p className="text-lg font-light text-cyan-300 font-mono">{(testMode ? 0.10 : remainingTax).toFixed(2)}€</p>
                    </div>

                    <TasaForm 
                      reservationCode={decodedCode}
                      payingGuests={payingGuests}
                      nights={nights}
                      totalAmount={remainingTax}
                      calculatedTax={calculatedTax}
                      taxPaidAmount={taxPaidAmount}
                      unregisteredPayingGuests={unregisteredPayingCount}
                    />
                  </div>
                )}
              </div>

              {/* Phase 3: Fianza / Depósito de Seguridad */}
              {hasDeposit && depositAmount > 0 && (
                <div className="bg-black/20 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-200 flex items-center gap-1.5">
                      <Key size={14} className="text-cyan-400" />
                      <span>{aDict.fianza_title}</span>
                    </h3>
                    {isDepositComplete ? (
                      <span className="text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/20 px-2 py-0.5 rounded-full border border-green-500/30">
                        ✓ {dict.paid_text || 'Pagado'}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-yellow-300 uppercase tracking-widest bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/30">
                        {depositPaid > 0 
                          ? `${aDict.fianza_partial} (${depositPaid}/${depositAmount}€)`
                          : (dict.pending_text || 'Pendiente')}
                      </span>
                    )}
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white/70 leading-relaxed">
                    {aDict.fianza_desc}
                  </div>

                  {isDepositComplete ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-sm text-green-300 flex items-center gap-2">
                      <CheckCircle2 size={16} className="shrink-0 text-green-400" />
                      <div>
                        <span className="font-bold">{aDict.fianza_success_title}</span>
                        <p className="text-[11px] text-white/60">
                          {aDict.fianza_success_desc}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      {/* Split limit checkbox option */}
                      <div className="flex items-start gap-3 bg-black/20 border border-white/5 rounded-xl p-3">
                        <input
                          id="split_deposit_checkbox"
                          type="checkbox"
                          checked={isSplitSelected}
                          onChange={(e) => setIsSplitSelected(e.target.checked)}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 focus:outline-none cursor-pointer mt-0.5"
                        />
                        <div className="space-y-1 animate-fade-in">
                          <label htmlFor="split_deposit_checkbox" className="text-xs text-white/90 font-medium cursor-pointer block leading-none">
                            {aDict.fianza_split_label}
                          </label>
                          <span className="text-[10px] text-white/40 block leading-tight mt-1">
                            {aDict.fianza_split_hint}
                          </span>
                        </div>
                      </div>

                      {isSplitSelected && (
                        <div className="space-y-2 bg-black/10 border border-white/10 rounded-xl p-3 animate-fade-in">
                          <label htmlFor="card_limit_input" className="text-[10px] text-white/50 uppercase tracking-widest font-bold block">
                            {aDict.fianza_limit_label}
                          </label>
                          <div className="relative">
                            <input
                              id="card_limit_input"
                              type="number"
                              step="0.01"
                              min="0.10"
                              value={cardLimit}
                              onChange={(e) => setCardLimit(e.target.value)}
                              className="w-full bg-black/40 border border-white/15 rounded-xl py-2 px-3 pl-4 pr-10 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/40">
                              EUR
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Display the buttons */}
                      {(() => {
                        const limitVal = parseFloat(cardLimit);
                        if (isSplitSelected && limitVal > 0) {
                          // Split logic
                          const totalSplits: number[] = [];
                          let tempTotal = depositAmount;
                          while (tempTotal > 0) {
                            if (tempTotal <= limitVal) {
                              totalSplits.push(parseFloat(tempTotal.toFixed(2)));
                              tempTotal = 0;
                            } else {
                              totalSplits.push(parseFloat(limitVal.toFixed(2)));
                              tempTotal = parseFloat((tempTotal - limitVal).toFixed(2));
                            }
                          }

                          let accumulatedPaid = depositPaid;
                          const splitStatuses = totalSplits.map((splitAmt) => {
                            if (accumulatedPaid >= splitAmt) {
                              accumulatedPaid = parseFloat((accumulatedPaid - splitAmt).toFixed(2));
                              return { amount: splitAmt, status: 'paid' };
                            } else if (accumulatedPaid > 0) {
                              const paidPartial = accumulatedPaid;
                              accumulatedPaid = 0;
                              return { amount: splitAmt, paidPartial, status: 'partial' };
                            } else {
                              return { amount: splitAmt, status: 'pending' };
                            }
                          });

                          return (
                            <div className="space-y-2">
                              <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold block mb-1">
                                {aDict.fianza_parts_label}
                              </p>
                              {splitStatuses.map((split, sIdx) => {
                                if (split.status === 'paid') {
                                  return (
                                    <div key={sIdx} className="flex justify-between items-center bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-xs">
                                      <span className="font-semibold text-white/80">
                                        {aDict.fianza_part} {sIdx + 1} ({split.amount.toFixed(2)}€)
                                      </span>
                                      <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider bg-green-500/25 px-2 py-0.5 rounded-md border border-green-500/30">
                                        ✓ {aDict.fianza_paid}
                                      </span>
                                    </div>
                                  );
                                } else if (split.status === 'partial') {
                                  const partialPaid = split.paidPartial || 0;
                                  const pendingAmt = parseFloat((split.amount - partialPaid).toFixed(2));
                                  return (
                                    <div key={sIdx} className="flex justify-between items-center bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs">
                                      <div className="space-y-0.5">
                                        <span className="font-semibold text-white/80 block">
                                          {aDict.fianza_part} {sIdx + 1} ({split.amount.toFixed(2)}€)
                                        </span>
                                        <span className="text-[10px] text-yellow-300/70 block">
                                          {aDict.fianza_paid}: {partialPaid.toFixed(2)}€ | {dict.pending_text || 'Pendiente'}: {pendingAmt.toFixed(2)}€
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handlePayDeposit(pendingAmt, sIdx)}
                                        disabled={generatingLinks[sIdx]}
                                        className="text-[11px] font-bold text-white bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 rounded-lg py-1.5 px-3 uppercase tracking-wider flex items-center gap-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
                                      >
                                        {generatingLinks[sIdx] ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <span>{aDict.fianza_pay_remaining} ({pendingAmt.toFixed(2)}€)</span>
                                        )}
                                      </button>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div key={sIdx} className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3 text-xs">
                                      <span className="font-semibold text-white/80">
                                        {aDict.fianza_part} {sIdx + 1} ({split.amount.toFixed(2)}€)
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handlePayDeposit(split.amount, sIdx)}
                                        disabled={generatingLinks[sIdx]}
                                        className="text-[11px] font-bold text-white bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 rounded-lg py-1.5 px-3 uppercase tracking-wider flex items-center gap-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cyan-500/10"
                                      >
                                        {generatingLinks[sIdx] ? (
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                          <span>{aDict.fianza_pay} ({split.amount.toFixed(2)}€)</span>
                                        )}
                                      </button>
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          );
                        } else {
                          // Single complete payment link
                          const remainingDeposit = parseFloat((depositAmount - depositPaid).toFixed(2));
                          return (
                            <div className="space-y-3">
                              <div className="flex justify-between items-center bg-white/5 border border-white/5 rounded-xl p-3 text-xs">
                                <span className="text-white/60">
                                  {aDict.fianza_remaining_label}
                                </span>
                                <span className="font-bold text-cyan-300 font-mono text-sm">
                                  {remainingDeposit.toFixed(2)}€
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handlePayDeposit(remainingDeposit, 999)}
                                disabled={generatingLinks[999]}
                                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/15"
                              >
                                {generatingLinks[999] ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>{aDict.fianza_link_generating}</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard size={16} />
                                    <span>{aDict.fianza_pay_full} ({remainingDeposit.toFixed(2)}€)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isValidTime ? (
            /* unlocked portal controls */
            <div className="space-y-4">
              {/* Virtual Key Header */}
              <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-cyan-400/20 rounded-3xl p-6 text-center space-y-4 shadow-[0_4px_30px_rgba(6,182,212,0.1)]">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg">
                  <Unlock size={22} className="text-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white">{dict.portal_title}</h3>
                  <p className="text-sm text-white/70">{dict.portal_desc}</p>
                </div>
                
                {/* Physical opening button */}
                <div className="flex flex-col items-center justify-center">
                  <OpenDoorButton reservation={reservation} lang={lang} dict={dict} />
                </div>
              </div>

              {/* Maps Location Button */}
              <div className="pt-2">
                <a
                  href="https://maps.app.goo.gl/CtqNXCuE8TGzQCwcA?g_st=aw"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] text-sm shadow-md"
                >
                  <MapIcon size={18} className="shrink-0 text-cyan-400" />
                  <span>{(dict as any).maps_btn || 'Ubicación en Maps'}</span>
                </a>
              </div>

              {/* YouTube App Access Video Guide Card */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <ExternalLink size={18} className="text-cyan-400" /> {(dict as any).app_access_video_title || 'Acceso desde la App'}
                </h3>
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-inner">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/GyKgu-haTAo?rel=0"  
                    title="App Access Video"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Nuki Keypad Code Reveal Card */}
              {reservation.nuki_pin && (
                <div className="bg-black/20 border border-white/10 rounded-2xl p-5 text-center space-y-3">
                  <h3 className="font-semibold text-base flex items-center justify-center gap-2">
                    <Key size={18} className="text-cyan-400" /> {dict.code_title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">
                    {dict.code_desc}
                  </p>
                  
                  <div className="bg-black/35 backdrop-blur-md border border-white/15 rounded-2xl py-3 px-6 font-mono text-cyan-100 flex items-center justify-center gap-3 select-all cursor-pointer hover:bg-black/45 transition-all shadow-inner w-full max-w-[280px] mx-auto">
                    <span className="font-bold text-white text-3xl tracking-[0.15em] ml-2">{reservation.nuki_pin}</span>
                  </div>
                </div>
              )}

              {/* Fallback generating access card */}
              {!reservation.nuki_pin && (
                <div className="bg-black/20 border border-white/10 rounded-2xl p-5 text-center space-y-3 animate-pulse">
                  <h3 className="font-semibold text-base flex items-center justify-center gap-2">
                    <Key size={18} className="text-cyan-400 animate-bounce" /> {dict.code_title}
                  </h3>
                  <p className="text-white/75 text-sm leading-relaxed max-w-xs mx-auto">
                    {({
                      es: "Generando su código PIN personal...",
                      en: "Generating your personal PIN code...",
                      fr: "Génération de votre code PIN personnel...",
                      de: "Generiere Ihren persönlichen PIN-Code...",
                      pl: "Generowanie osobistego kodu PIN...",
                      nl: "Genereren van uw persoonlijke PIN-code...",
                      zh: "正在生成您的个人 PIN 码...",
                      uk: "Генерація вашого персонального PIN-коду...",
                      ru: "Генерация вашего персонального PIN-кода...",
                      ja: "個人用 PIN コードを生成中...",
                    } as Record<Lang, string>)[lang] || "Generating your personal PIN code..."}
                  </p>
                  
                  <div className="bg-black/35 backdrop-blur-md border border-white/15 rounded-2xl py-4 px-6 flex items-center justify-center gap-3 w-full max-w-[280px] mx-auto shadow-inner">
                    <svg className="animate-spin h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="font-semibold text-cyan-200 text-sm">
                      {aDict.syncing_lock}
                    </span>
                  </div>
                </div>
              )}

              {/* WiFi Details Card */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Wifi size={18} className="text-emerald-400" /> {dict.wifi_title}
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-sm">{dict.wifi_network}</span>
                    <span className="font-semibold text-sm text-white">FitelFibra_2G_4168</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-sm">{dict.wifi_password}</span>
                    <button 
                      onClick={handleCopyWifi}
                      className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm hover:text-emerald-300 transition-colors"
                    >
                      {wifiCopied ? (
                        <>
                          <CheckCircle2 size={14} /> 
                          <span>{dict.wifi_copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> 
                          <span>86075541</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Recycling Card */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold text-base flex items-center gap-2 text-cyan-200 border-b border-white/10 pb-1.5">
                  <span className="text-lg">♻️</span> {rDict.title}
                </h3>
                
                <p className="text-white/80 text-sm leading-relaxed">
                  {rDict.desc}
                </p>

                <div className="flex gap-4 pt-2">
                  <div className="flex-1 bg-black/25 border border-white/10 p-3.5 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-white/50 uppercase font-bold tracking-wider">
                      {rDict.room}
                    </p>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/10 bg-black/40">
                      <img 
                        src="/images/recursos/Cuarto de basuras.png" 
                        alt="Cuarto de basuras" 
                        className="w-full h-full object-cover hover:opacity-85 transition-opacity cursor-pointer shadow-sm"
                        onClick={() => setSelectedImage('/images/recursos/Cuarto de basuras.png')}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-black/25 border border-white/10 p-3.5 rounded-2xl text-center space-y-2">
                    <p className="text-xs text-white/50 uppercase font-bold tracking-wider">
                      {rDict.instructions}
                    </p>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-white/10 bg-black/40">
                      <img 
                        src="/images/recursos/Instruciones de Reciclaje.jpg" 
                        alt="Instrucciones de Reciclaje" 
                        className="w-full h-full object-cover hover:opacity-85 transition-opacity cursor-pointer shadow-sm"
                        onClick={() => setSelectedImage('/images/recursos/Instruciones de Reciclaje.jpg')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* unlocked but too early - virtual keys inactive notice */
            <div className="space-y-4 animate-fade-in">
              <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-3xl p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-500/35 flex items-center justify-center shadow-lg">
                  <Lock size={20} className="text-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-1.5 text-white">
                  <h3 className="text-base font-semibold text-cyan-300">{aDict.check_in_completed_success}</h3>
                  <p className="text-xs text-white/70 leading-relaxed max-w-xs mx-auto">
                    {aDict.check_in_completed_success_desc.replace('[date]', formattedCheckInDate)}
                  </p>
                </div>
                
                <div className="text-left bg-black/25 border border-white/10 rounded-2xl p-4 text-xs space-y-2.5">
                  <p className="flex justify-between items-center">
                    <span className="text-white/50">{aDict.check_in_label}</span>
                    <span className="font-bold text-cyan-200">{formattedCheckInDate}, {reservation.checkInTime || '16:00'}</span>
                  </p>
                  <p className="flex justify-between items-center">
                    <span className="text-white/50">{aDict.check_out_label}</span>
                    <span className="font-bold text-cyan-200">{formattedCheckOutDate}, {reservation.checkOutTime || '10:00'}</span>
                  </p>
                </div>
              </div>

              {/* WiFi Details Card */}
              <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Wifi size={18} className="text-emerald-400" /> {dict.wifi_title}
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-sm">{dict.wifi_network}</span>
                    <span className="font-semibold text-sm text-white">FitelFibra_2G_4168</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl">
                    <span className="text-white/60 text-sm">{dict.wifi_password}</span>
                    <button 
                      onClick={handleCopyWifi}
                      className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm hover:text-emerald-300 transition-colors"
                    >
                      {wifiCopied ? (
                        <>
                          <CheckCircle2 size={14} /> 
                          <span>{dict.wifi_copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} /> 
                          <span>86075541</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <ContactHostButton />
        </div>
      )}

      {/* ==========================================
          TAB 2: ZONAS (POOL & DIRECT KEYS INFOS)
          ========================================== */}
      {activeTab === 'llaves' && (
        <div className="space-y-4 animate-fade-in">
          {/* Pool Card */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-lg text-cyan-200 border-b border-white/10 pb-1.5">{dict.pool_title}</h3>
            
            <div className="flex items-start gap-4">
              <p className="text-white/80 text-sm leading-relaxed flex-1">{dict.pool_desc}</p>
              <img 
                src="/images/recursos/llave-piscina.jpeg" 
                alt="Llave Piscina" 
                className="w-20 h-20 object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shrink-0"
                onClick={() => setSelectedImage('/images/recursos/llave-piscina.jpeg')}
              />
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-inner">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/l9vpUNr4fXA?rel=0"  
                title="Pool Access Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>

          {/* Back Door Card */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-lg text-cyan-200 border-b border-white/10 pb-1.5">{dict.back_door_title}</h3>
            
            <div className="flex items-start gap-4">
              <p className="text-white/80 text-sm leading-relaxed flex-1">{dict.back_door_desc}</p>
              <img 
                src="/images/recursos/llave-trasera.jpeg" 
                alt="Llave Trasera" 
                className="w-20 h-20 object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shrink-0"
                onClick={() => setSelectedImage('/images/recursos/llave-trasera.jpeg')}
              />
            </div>

            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black shadow-inner">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/B508vUH8AbQ?rel=0" 
                title="Back Door Access Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>

          {/* Community Rules Button */}
          <div className="text-center py-4">
            <button 
              onClick={() => setShowRules(true)}
              className="font-bold text-base text-cyan-300 hover:text-cyan-100 underline underline-offset-4 transition-colors"
            >
              {dict.rules_link}
            </button>
          </div>
          <ContactHostButton />
        </div>
      )}

      {/* ==========================================
          TAB 3: PARKING (GARAGE SPOTS & CIRCUITS)
          ========================================== */}
      {activeTab === 'parking' && (
        <div className="space-y-4 animate-fade-in">
          {/* Plaza Info Header */}
          <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/10 border border-cyan-400/20 rounded-3xl p-5 space-y-3.5">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <h3 className="font-bold text-lg text-cyan-200 flex items-center gap-2">
                <Car className="text-cyan-400" /> {dict.parking_plaza}
              </h3>
              <a 
                href="https://maps.app.goo.gl/2hpbBNMGsopa93T57?g_st=aw" 
                target="_blank" 
                rel="noreferrer"
                className="bg-cyan-500 hover:bg-cyan-400 text-cyan-950 px-3.5 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 transition-all shadow-md active:scale-95"
              >
                {dict.parking_nav} <ExternalLink size={12} />
              </a>
            </div>
            
            <p className="text-sm text-white/80 leading-relaxed">
              {dict.parking_warning}
            </p>
          </div>

          {/* Parking attachments zoom card */}
          <div className="flex gap-4">
            <div className="flex-1 bg-black/25 border border-white/10 p-3.5 rounded-2xl text-center space-y-2">
              <p className="text-xs text-white/50 uppercase font-bold tracking-wider">Acceso (Mando)</p>
              <img 
                src="/images/recursos/parking-tag.jpeg" 
                alt="Mando Garaje" 
                className="w-full aspect-square object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shadow-sm"
                onClick={() => setSelectedImage('/images/recursos/parking-tag.jpeg')}
              />
            </div>
            
            <div className="flex-1 bg-black/25 border border-white/10 p-3.5 rounded-2xl text-center space-y-2">
              <p className="text-xs text-white/50 uppercase font-bold tracking-wider">Candado Barrera (0539)</p>
              <img 
                src="/images/recursos/parking-candado.jpeg" 
                alt="Candado Barrera" 
                className="w-full aspect-square object-cover rounded-xl border border-white/10 hover:opacity-85 transition-opacity cursor-pointer shadow-sm"
                onClick={() => setSelectedImage('/images/recursos/parking-candado.jpeg')}
              />
            </div>
          </div>

          {/* Videos Grid */}
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-base text-cyan-200 border-b border-white/10 pb-1.5">{dict.parking_to_apt_title}</h3>
            <p className="text-white/80 text-sm leading-relaxed">{dict.parking_to_apt_desc}</p>
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/bQ3bXpZAA-w?rel=0" 
                title="Elevator Access Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>

          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-base text-cyan-200 border-b border-white/10 pb-1.5">{dict.parking_car_access_title}</h3>
            <p className="text-white/80 text-sm leading-relaxed">{dict.parking_car_access_desc}</p>
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/52aGzhG-6qw?rel=0" 
                title="Car Access Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </div>
          <ContactHostButton />
        </div>
      )}

      {/* ==========================================
          TAB 4: BARRIO (NEIGHBORHOOD GPS MAPS)
          ========================================== */}
      {activeTab === 'barrio' && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-black/20 border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold text-lg text-cyan-200 border-b border-white/10 pb-1.5">{dict.neighborhood_services}</h3>
            
            {/* Embedded Google Maps Card */}
            <div className="w-full rounded-xl border border-white/10 overflow-hidden relative shadow-lg">
              <div className="aspect-[4/3] w-full relative bg-gray-800 overflow-hidden">
                <iframe 
                  src="https://www.google.com/maps/d/embed?mid=1RPK1nvAHLbKV5hhrm6RSG3sRt-7xJOI" 
                  width="100%" 
                  className="absolute left-0 border-0"
                  style={{ top: '-56px', height: 'calc(100% + 56px)' }}
                  title="Neighborhood Services Map"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>

            {/* Categorized Neighborhood Links */}
            <div className="space-y-4">
              {/* Basics and health */}
              <div>
                <h4 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-2">🛒 {dict.neighborhood_health}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=Supermercado+Consum+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Supermercado Consum</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Farmacia+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Farmacia Fenals</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Farmacia+Blanca+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Farmacia Blanca</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/place/Lavander%C3%ADa+24h+(go+laundry)/@41.7136585,2.8309247,19.25z/data=!4m6!3m5!1s0x12bb17812675b779:0x60f19ce56eac64d4!8m2!3d41.7136398!4d2.8307474!16s%2Fg%2F11h_4s81hw?entry=ttu" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">{dict.laundry}</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                </div>
              </div>

              {/* Eat */}
              <div>
                <h4 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-2">🥘 {dict.neighborhood_eat}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=L%27Arrosseria+de+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">L'Arrosseria de Fenals</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Planiol+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Restaurante Planiol</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=El+Jardi+Parrilla+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">El Jardí Parrilla</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Restaurante+Hay+Motivo+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Restaurante Hay Motivo</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Corsaro+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Pizzería Corsaro</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=heladeria+Fenals+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">{dict.ice_cream}</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                </div>
              </div>

              {/* See */}
              <div>
                <h4 className="text-cyan-300 font-bold text-sm uppercase tracking-wider mb-2">📸 {dict.neighborhood_see}</h4>
                <div className="grid grid-cols-1 gap-2">
                  <a href="https://www.google.com/maps/search/?api=1&query=Jardines+de+Santa+Clotilde+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Jardines de Santa Clotilde</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Cala+Boadella+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Cala Boadella</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Castell+de+Sant+Joan+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Castell de Sant Joan</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                  <a href="https://www.google.com/maps/search/?api=1&query=Water+World+Lloret+de+Mar" target="_blank" rel="noreferrer" className="flex justify-between items-center bg-white/5 border border-white/5 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                    <span className="font-medium text-sm text-white">Parque Acuático Water World</span>
                    <ExternalLink size={14} className="text-white/45" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL A: IMAGE ENLARGEMENT ZOOM
          ========================================== */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] flex items-center justify-center animate-in zoom-in-95 duration-200">
            <button 
              className="absolute -top-10 right-0 text-white/80 hover:text-white font-bold text-xs uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-full border border-white/10 shadow-md backdrop-blur-md"
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
            >
              Cerrar ✕
            </button>
            <img 
              src={selectedImage} 
              alt="Detalle" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/15"
            />
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL B: COMMUNITY RULES MULTI-LANG MODAL
          ========================================== */}
      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-950 border border-white/15 rounded-3xl p-6 max-w-lg w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl shadow-cyan-500/10">
            <h3 className="text-lg font-bold mb-4 text-cyan-200 border-b border-white/10 pb-2">{dict.rules_title}</h3>
            
            <div className="overflow-y-auto pr-2 space-y-3 flex-1 text-xs text-white/80 leading-relaxed scrollbar-thin">
              {dict.rules_texts && dict.rules_texts.map((rule: string, idx: number) => (
                <p key={idx} className="flex gap-2">
                  <span className="text-cyan-400 font-bold">•</span>
                  <span>{rule}</span>
                </p>
              ))}
            </div>
            
            <button 
              onClick={() => setShowRules(false)}
              className="mt-6 w-full bg-gradient-to-r from-teal-400 to-cyan-500 hover:from-teal-300 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-98"
            >
              {dict.rules_close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
