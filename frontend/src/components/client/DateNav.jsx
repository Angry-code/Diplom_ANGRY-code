const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

// Возвращает ISO-строку 'YYYY-MM-DD' для date
function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Генерирует массив из 7 дней, начиная с today
export function getWeekDays() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      iso: toISODate(d),
      date: d,
      weekday: i === 0 ? 'Сегодня' : WEEKDAYS[d.getDay()],
      dayNumber: d.getDate(),
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      isToday: i === 0,
    };
  });
}

export default function DateNav({ selectedDate, onSelect }) {
  const days = getWeekDays();

  return (
    <nav className="page-nav">
      {days.map((day) => (
        <a
          key={day.iso}
          className={`page-nav__day ${day.isToday ? 'page-nav__day_today' : ''} ${
            day.isWeekend ? 'page-nav__day_weekend' : ''
          } ${selectedDate === day.iso ? 'page-nav__day_chosen' : ''}`}
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelect(day.iso);
          }}
        >
          <span className="page-nav__day-week">{day.weekday}</span>
          <span className="page-nav__day-number">{day.dayNumber}</span>
        </a>
      ))}
      <a
        className="page-nav__day page-nav__day_next"
        href="#"
        onClick={(e) => e.preventDefault()}
      />
    </nav>
  );
}