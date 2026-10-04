import { useEffect, useState } from 'react';
import client from '../../api/client';
import '../../styles/admin.css';

const TYPES_CYCLE = ['regular', 'vip', 'disabled'];

const TYPE_CLASS = {
    regular: 'conf-step__chair_standart',
    vip: 'conf-step__chair_vip',
    disabled: 'conf-step__chair_disabled',
};

export default function HallConfigurator() {
    const [venues, setVenues] = useState([]);
    const [selectedVenueId, setSelectedVenueId] = useState(null);
    const [seats, setSeats] = useState([]);
    const [originalSeats, setOriginalSeats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [savedMsg, setSavedMsg] = useState(null);

    // Список залов — один раз
    useEffect(() => {
        client.get('venues/')
            .then(({ data }) => {
                const list = data.results ?? data;
                setVenues(list);
                if (list.length > 0) setSelectedVenueId(list[0].id);
            })
            .catch((err) => setError(err.message));
    }, []);

    // Места выбранного зала
    useEffect(() => {
        if (!selectedVenueId) return;
        setLoading(true);
        setError(null);
        setSavedMsg(null);
        client.get(`seats/?venue=${selectedVenueId}`)
            .then(({ data }) => {
                const list = data.results ?? data;
                setSeats(list);
                setOriginalSeats(list);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [selectedVenueId]);

    const selectedVenue = venues.find((v) => v.id === selectedVenueId);

    const onSeatClick = (seatId) => {
        setSavedMsg(null);
        setSeats((prev) =>
            prev.map((s) => {
                if (s.id !== seatId) return s;
                const idx = TYPES_CYCLE.indexOf(s.type);
                const next = TYPES_CYCLE[(idx + 1) % TYPES_CYCLE.length];
                return { ...s, type: next };
            })
        );
    };

    const hasChanges = seats.some((s) => {
        const orig = originalSeats.find((o) => o.id === s.id);
        return orig && orig.type !== s.type;
    });

    const onSave = async () => {
        setSaving(true);
        setError(null);
        setSavedMsg(null);
        try {
            const changed = seats.filter((s) => {
                const orig = originalSeats.find((o) => o.id === s.id);
                return orig && orig.type !== s.type;
            });

            for (const s of changed) {
                await client.patch(`seats/${s.id}/`, { type: s.type });
            }

            setOriginalSeats(seats);
            setSavedMsg(`Сохранено мест: ${changed.length}`);
        } catch (err) {
            const detail = err.response?.data?.detail || err.message;
            setError(`Не удалось сохранить: ${detail}`);
        } finally {
            setSaving(false);
        }
    };

    const onCancel = () => {
        setSeats(originalSeats);
        setSavedMsg(null);
    };

    // Группировка по ряду
    const byRow = {};
    seats.forEach((s) => {
        if (!byRow[s.row_number]) byRow[s.row_number] = [];
        byRow[s.row_number].push(s);
    });
    Object.values(byRow).forEach((row) =>
        row.sort((a, b) => a.seat_number - b.seat_number)
    );

    return (
        <div className="hall-configurator">
            <p className="conf-step__paragraph">
                Выберите зал и кликните по местам, чтобы изменить их тип:
                обычное → VIP → отключено.
            </p>

            {/* Селектор залов */}
            <ul className="conf-step__selectors-box">
                {venues.map((v) => (
                    <li key={v.id}>
                        <input
                            type="radio"
                            name="venue"
                            className="conf-step__radio"
                            id={`venue-${v.id}`}
                            checked={selectedVenueId === v.id}
                            onChange={() => setSelectedVenueId(v.id)}
                        />
                        <label className="conf-step__selector" htmlFor={`venue-${v.id}`}>
                            {v.name}
                        </label>
                    </li>
                ))}
            </ul>

            {loading && <p>Загрузка мест…</p>}
            {error && <p className="explanation-text">Ошибка: {error}</p>}
            {savedMsg && <p className="conf-step__wrapper__save-status">{savedMsg}</p>}

            {!loading && selectedVenue && (
                <>
                    {/* Легенда */}
                    <p className="conf-step__legend">
                        <span className={`conf-step__chair ${TYPE_CLASS.regular}`} /> обычное
                        <span
                            className={`conf-step__chair ${TYPE_CLASS.vip}`}
                            style={{ marginLeft: 20 }}
                        />{' '}
                        VIP
                        <span
                            className={`conf-step__chair ${TYPE_CLASS.disabled}`}
                            style={{ marginLeft: 20 }}
                        />{' '}
                        отключено
                    </p>

                    {/* Схема зала */}
                    <div className="conf-step__hall">
                        <div className="conf-step__hall-wrapper">
                            {Object.entries(byRow).map(([rowNum, rowSeats]) => (
                                <div className="conf-step__row" key={rowNum}>
                                    {rowSeats.map((s) => (
                                        <span
                                            key={s.id}
                                            className={`conf-step__chair ${TYPE_CLASS[s.type] || TYPE_CLASS.regular
                                                }`}
                                            onClick={() => onSeatClick(s.id)}
                                            title={`Ряд ${s.row_number}, место ${s.seat_number} — ${s.type}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="conf-step__buttons">
                        <button
                            type="button"
                            className="conf-step__button conf-step__button-accent"
                            disabled={!hasChanges || saving}
                            onClick={onSave}
                        >
                            {saving ? 'Сохраняем…' : 'Сохранить'}
                        </button>
                        <button
                            type="button"
                            className="conf-step__button conf-step__button-regular"
                            disabled={!hasChanges || saving}
                            onClick={onCancel}
                        >
                            Отмена
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}