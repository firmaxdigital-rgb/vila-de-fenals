export const translations = {
  es: {
    not_found_title: "Reserva no encontrada",
    not_found_desc: "Revisa el enlace o contacta con el anfitrión.",
    inactive_title: "Tu llave virtual está inactiva fuera de las fechas de reserva.",
    active_key: "Llave Virtual Activa",
    valid_until: "Válido hasta",
    open: "ABRIR",
    portal: "Portal Edificio",
    connecting: "CONECTANDO...",
    opened: "¡ABIERTO!",
    error: "ERROR",
    error_conn: "Error de conexión. Revisa tu internet."
  },
  en: {
    not_found_title: "Reservation not found",
    not_found_desc: "Check the link or contact the host.",
    inactive_title: "Your virtual key is inactive outside of reservation dates.",
    active_key: "Active Virtual Key",
    valid_until: "Valid until",
    open: "OPEN",
    portal: "Building Gate",
    connecting: "CONNECTING...",
    opened: "OPENED!",
    error: "ERROR",
    error_conn: "Connection error. Check your internet."
  },
  fr: {
    not_found_title: "Réservation introuvable",
    not_found_desc: "Vérifiez le lien ou contactez l'hôte.",
    inactive_title: "Votre clé virtuelle est inactive en dehors des dates de réservation.",
    active_key: "Clé Virtuelle Active",
    valid_until: "Valable jusqu'au",
    open: "OUVRIR",
    portal: "Portail du Bâtiment",
    connecting: "CONNEXION...",
    opened: "OUVERT !",
    error: "ERREUR",
    error_conn: "Erreur de connexion. Vérifiez votre internet."
  },
  de: {
    not_found_title: "Reservierung nicht gefunden",
    not_found_desc: "Überprüfen Sie den Link oder kontaktieren Sie den Gastgeber.",
    inactive_title: "Ihr virtueller Schlüssel ist außerhalb der Reservierungsdaten inaktiv.",
    active_key: "Aktiver virtueller Schlüssel",
    valid_until: "Gültig bis",
    open: "ÖFFNEN",
    portal: "Gebäudetor",
    connecting: "VERBINDEN...",
    opened: "GEÖFFNET!",
    error: "FEHLER",
    error_conn: "Verbindungsfehler. Überprüfen Sie Ihr Internet."
  },
  pl: {
    not_found_title: "Nie znaleziono rezerwacji",
    not_found_desc: "Sprawdź link lub skontaktuj się z gospodarzem.",
    inactive_title: "Twój wirtualny klucz jest nieaktywny poza datami rezerwacji.",
    active_key: "Aktywny klucz wirtualny",
    valid_until: "Ważny do",
    open: "OTWÓRZ",
    portal: "Brama Budynku",
    connecting: "ŁĄCZENIE...",
    opened: "OTWARTE!",
    error: "BŁĄD",
    error_conn: "Błąd połączenia. Sprawdź swój internet."
  },
  zh: {
    not_found_title: "未找到预订",
    not_found_desc: "请检查链接或联系房东。",
    inactive_title: "您的虚拟钥匙在预订日期外无效。",
    active_key: "有效虚拟钥匙",
    valid_until: "有效期至",
    open: "打开",
    portal: "大楼大门",
    connecting: "连接中...",
    opened: "已打开！",
    error: "错误",
    error_conn: "连接错误。请检查您的网络。"
  },
  uk: {
    not_found_title: "Бронювання не знайдено",
    not_found_desc: "Перевірте посилання або зв'яжіться з господарем.",
    inactive_title: "Ваш віртуальний ключ неактивний поза датами бронювання.",
    active_key: "Активний віртуальний ключ",
    valid_until: "Дійсний до",
    open: "ВІДКРИТИ",
    portal: "Ворота будівлі",
    connecting: "З'ЄДНАННЯ...",
    opened: "ВІДКРИТО!",
    error: "ПОМИЛКА",
    error_conn: "Помилка з'єднання. Перевірте інтернет."
  },
  ru: {
    not_found_title: "Бронирование не найдено",
    not_found_desc: "Проверьте ссылку или свяжитесь с хозяином.",
    inactive_title: "Ваш виртуальный ключ неактивен вне дат бронирования.",
    active_key: "Активный виртуальный ключ",
    valid_until: "Действителен до",
    open: "ОТКРЫТЬ",
    portal: "Ворота здания",
    connecting: "ПОДКЛЮЧЕНИЕ...",
    opened: "ОТКРЫТО!",
    error: "ОШИБКА",
    error_conn: "Ошибка подключения. Проверьте интернет."
  }
};

export type Lang = keyof typeof translations;
