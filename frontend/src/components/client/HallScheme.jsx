import { useMemo, useState } from 'react';

export default function HallScheme({
  seats,
  bookedSeatIds,
  priceRegular,
  priceVip,
  onConfirm,
}) {
  const [selected, setSelected] = useState([]);

  // Группируем места по рядам
  const rows = useMemo(() => {
    const map = {};
    seats.forEach((s) => {
      if (!map[s.row_number]) map[s.row_number] = [];
      map[s.row_number].push(s);
    });
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([row, items]) => ({
        row: Number(row),
        seats: items.sort((a, b) => a.seat_number - b.seat_number),
      }));
  }, [seats]);

  const isDisabled = (seat) => seat.type === 'disabled';

  const toggle = (seat) => {
    if (isDisabled(seat)) return;
    if (bookedSeatIds.includes(seat.id)) return;
    setSelected((prev) =>
      prev.find((s) => s.id === seat.id)
        ? prev.filter((s) => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  const total = selected.reduce(
    (sum, s) => sum + Number(s.type === 'vip' ? priceVip : priceRegular),
    0
  );

  const chairClass = (seat) => {
    if (bookedSeatIds.includes(seat.id)) return 'buying-scheme__chair_taken';
    if (selected.find((s) => s.id === seat.id)) return 'buying-scheme__chair_selected';
    if (isDisabled(seat)) return 'buying-scheme__chair_disabled';
    return seat.type === 'vip'
      ? 'buying-scheme__chair_vip'
      : 'buying-scheme__chair_standart';
  };

  

  return (
    <div className="buying-scheme">
      <div className="buying-scheme__wrapper">
        {rows.map(({ row, seats: rowSeats }) => (
          <div key={row} className="buying-scheme__row">
            {rowSeats.map((seat) => (
              <span
                key={seat.id}
                className={`buying-scheme__chair ${chairClass(seat)}`}
                onClick={() => toggle(seat)}
                style={isDisabled(seat) ? { cursor: 'default' } : undefined}
                title={
                  isDisabled(seat)
                  ? `Ряд ${seat.row_number}, место ${seat.seat_number} (место недоступно)`
                  : `Ряд ${seat.row_number}, место ${seat.seat_number} (${seat.type_display})`
                }
              />
            ))}
          </div>
        ))}
      </div>

      <div className="buying-scheme__legend">
        <div className="col">
          <p className="buying-scheme__legend-price">
            <span className="buying-scheme__chair buying-scheme__chair_standart" />
            {' '}Свободно ({priceRegular} руб)
          </p>
          <p className="buying-scheme__legend-price">
            <span className="buying-scheme__chair buying-scheme__chair_vip" />
            {' '}Свободно VIP ({priceVip} руб)
          </p>
          <p className="buying-scheme__legend-price">
            <span className="buying-scheme__chair buying-scheme__chair_disabled" />
            {' '}Недоступно
          </p>
        </div>
        <div className="col">
          <p className="buying-scheme__legend-price">
            <span className="buying-scheme__chair buying-scheme__chair_taken" />
            {' '}Занято
          </p>
          <p className="buying-scheme__legend-price">
            <span className="buying-scheme__chair buying-scheme__chair_selected" />
            {' '}Выбрано
          </p>
        </div>
      </div>

      <button
        className="acceptin-button"
        disabled={selected.length === 0}
        onClick={() => onConfirm(selected, total)}
      >
        {selected.length === 0
          ? 'Выберите места'
          : `Забронировать за ${total} ₽`}
      </button>
    </div>
  );
}