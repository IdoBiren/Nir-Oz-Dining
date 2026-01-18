import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../supabaseClient';
import GroupOrderModal from './GroupOrderModal';
import './CalendarBoard.css';

const CalendarBoard = () => {
    const { user } = useUser();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [meals, setMeals] = useState({}); // { '2024-01-01': { veg: 1, meat: 0 } }
    const [loadingDates, setLoadingDates] = useState({});

    // Group Order Modal State
    const [editingDate, setEditingDate] = useState(null); // '2024-01-01' or null

    // Weekly Mode State
    const [isWeeklyMode, setIsWeeklyMode] = useState(false);

    // Check Roles
    const isGroupUser = user?.role === 'group_order';

    // Fetch meals
    useEffect(() => {
        if (!user) {
            setMeals({});
            return;
        }

        const fetchMeals = async () => {
            if (!user?.email) return;

            // Mock Fetch for Test User
            if (user?.id && user.id.startsWith('test-')) {
                setMeals({
                    '2025-01-01': { veg: 1, meat: 0 },
                    '2025-01-02': { veg: 0, meat: 1 }
                });
                return;
            }

            try {
                // Fetch Meals
                const { data, error } = await supabase
                    .from('user_meals')
                    .select('meal_date, veg_quantity, meat_quantity')
                    .eq('user_email', user.email);

                if (error) throw error;

                const mapping = {};
                data.forEach(row => {
                    mapping[row.meal_date] = {
                        veg: row.veg_quantity || 0,
                        meat: row.meat_quantity || 0
                    };
                });
                setMeals(mapping);
            } catch (err) {
                console.error('Error fetching meals:', err);
            }
        };

        fetchMeals();
    }, [user]);

    // Single Day Save
    const saveMealToBackend = async (dateStr, veg, meat) => {
        setLoadingDates(prev => ({ ...prev, [dateStr]: true }));
        try {
            await performSave(dateStr, veg, meat);
        } catch (err) {
            console.error('Error saving:', err);
            alert('Failed to save order.');
        } finally {
            setLoadingDates(prev => ({ ...prev, [dateStr]: false }));
            setEditingDate(null);
        }
    };

    // Low-level Save Helper
    const performSave = async (dateStr, veg, meat) => {
        // Mock Save for Test User
        if (user?.id && user.id.startsWith('test-')) {
            await new Promise(r => setTimeout(r, 300)); // Fake delay
            setMeals(prev => {
                const copy = { ...prev };
                if (veg === 0 && meat === 0) delete copy[dateStr];
                else copy[dateStr] = { veg, meat };
                return copy;
            });
            return;
        }

        // Delete if both 0
        if (veg === 0 && meat === 0) {
            const { error } = await supabase
                .from('user_meals')
                .delete()
                .match({ user_email: user.email, meal_date: dateStr });
            if (error) throw error;
        } else {
            // Upsert
            const { error } = await supabase
                .from('user_meals')
                .upsert({
                    user_email: user.email,
                    meal_date: dateStr,
                    veg_quantity: veg,
                    meat_quantity: meat
                }, { onConflict: 'user_email, meal_date' });
            if (error) throw error;
        }
        // Update Local State
        setMeals(prev => {
            const copy = { ...prev };
            if (veg === 0 && meat === 0) delete copy[dateStr];
            else copy[dateStr] = { veg, meat };
            return copy;
        });
    };

    // Bulk Save for Weekly Mode
    const bulkSaveMealsToBackend = async (updates) => {
        // updates: [{ dateStr, veg, meat }]
        const loadingMap = {};
        updates.forEach(u => loadingMap[u.dateStr] = true);
        setLoadingDates(prev => ({ ...prev, ...loadingMap }));

        try {
            // Mock Save
            if (user?.id && user.id.startsWith('test-')) {
                await new Promise(r => setTimeout(r, 500));
                setMeals(prev => {
                    const copy = { ...prev };
                    updates.forEach(u => {
                        if (u.veg === 0 && u.meat === 0) delete copy[u.dateStr];
                        else copy[u.dateStr] = { veg: u.veg, meat: u.meat };
                    });
                    return copy;
                });
                return;
            }

            // Real Backend - Split Delete and Upsert
            const toDelete = updates.filter(u => u.veg === 0 && u.meat === 0);
            const toUpsert = updates.filter(u => u.veg > 0 || u.meat > 0);
            const promises = [];

            if (toDelete.length > 0) {
                const deleteDates = toDelete.map(u => u.dateStr);
                promises.push(
                    supabase.from('user_meals')
                        .delete()
                        .in('meal_date', deleteDates)
                        .eq('user_email', user.email)
                );
            }

            if (toUpsert.length > 0) {
                const upsertRows = toUpsert.map(u => ({
                    user_email: user.email,
                    meal_date: u.dateStr,
                    veg_quantity: u.veg,
                    meat_quantity: u.meat
                }));
                promises.push(
                    supabase.from('user_meals')
                        .upsert(upsertRows, { onConflict: 'user_email, meal_date' })
                );
            }

            const results = await Promise.all(promises);
            results.forEach(({ error }) => { if (error) throw error; });

            // Update Local
            setMeals(prev => {
                const copy = { ...prev };
                updates.forEach(u => {
                    if (u.veg === 0 && u.meat === 0) delete copy[u.dateStr];
                    else copy[u.dateStr] = { veg: u.veg, meat: u.meat };
                });
                return copy;
            });

        } catch (err) {
            console.error('Bulk save error:', err);
            alert('Failed to save weekly order.');
        } finally {
            const resetLoading = {};
            updates.forEach(u => resetLoading[u.dateStr] = false);
            setLoadingDates(prev => ({ ...prev, ...resetLoading }));
            setEditingDate(null);
        }
    };

    // Calculate Week Dates (Sunday to Thursday)
    const getWeekDays = (sourceDate) => {
        const date = new Date(sourceDate);
        const day = date.getDay(); // 0 (Sun) - 6 (Sat)
        // Adjust to find Sunday of this week
        const diff = date.getDate() - day; // Sunday is 0 distance from 0
        const weekStart = new Date(date);
        weekStart.setDate(diff); // Set to Sunday

        const weekDates = [];
        // Loop Sun (0) to Thu (4)
        for (let i = 0; i <= 4; i++) {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            weekDates.push(d);
        }
        return weekDates;
    };


    const handleDayClick = (dateStr) => {
        if (!user) {
            alert('Please sign in first.');
            return;
        }
        if (loadingDates[dateStr]) return;

        const dateObj = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Block if Today or Past
        if (dateObj <= today) return;

        const current = meals[dateStr] || { veg: 0, meat: 0 };

        if (isGroupUser) {
            setEditingDate(dateStr);
        } else {
            // Single User Toggle: None -> Meat -> Veg -> None
            let newVeg = 0;
            let newMeat = 0;

            if (current.veg === 0 && current.meat === 0) {
                newMeat = 1; // First click: Meat
            } else if (current.meat > 0) {
                newMeat = 0; newVeg = 1; // Second click: Veg
            } else {
                newVeg = 0; newMeat = 0; // Third click: None
            }

            if (isWeeklyMode) {
                const weekDays = getWeekDays(dateObj);
                const updates = [];
                weekDays.forEach(d => {
                    // Check if locked (Past or Today)
                    if (d <= today) return;

                    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    updates.push({ dateStr: dStr, veg: newVeg, meat: newMeat });
                });
                bulkSaveMealsToBackend(updates);
            } else {
                saveMealToBackend(dateStr, newVeg, newMeat);
            }
        }
    };

    const handleGroupSave = (date, veg, meat) => {
        if (isWeeklyMode) {
            const dObj = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const weekDays = getWeekDays(dObj);
            const updates = [];
            weekDays.forEach(d => {
                if (d <= today) return;
                const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                updates.push({ dateStr: dStr, veg, meat });
            });
            bulkSaveMealsToBackend(updates);
        } else {
            saveMealToBackend(date, veg, meat);
        }
    };

    // Calendar Helper Functions
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = [
        "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
        "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ];

    const generateCalendarDays = () => {
        const days = [];
        const today = new Date();
        // Reset time part for accurate comparison
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);

        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);

            // Comparison
            const isToday = dateObj.getTime() === today.getTime();
            // Updated Logic: Locked if Past OR Today
            const isLocked = dateObj <= today;
            const dayOfWeek = dateObj.getDay();
            const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday (5) or Saturday (6)

            const meal = meals[dateStr];
            const isLoading = loadingDates[dateStr];

            // Determine display
            let displayContent = null;
            let hasOrder = false;

            if (meal && (meal.veg > 0 || meal.meat > 0)) {
                hasOrder = true;
                if (isGroupUser) {
                    displayContent = (
                        <div className="group-counts">
                            {meal.veg > 0 && <span className="veg-count">🥦 {meal.veg}</span>}
                            {meal.meat > 0 && <span className="meat-count">🍖 {meal.meat}</span>}
                        </div>
                    );
                } else {
                    displayContent = (
                        <div className={`meal-indicator`}>
                            {meal.meat > 0 ? '🍖' : '🥦'}
                        </div>
                    );
                }
            }

            days.push(
                <div
                    key={i}
                    className={`calendar-day ${hasOrder ? 'confirmed' : ''} ${isLoading ? 'loading' : ''} ${isToday ? 'today' : ''} ${isLocked ? 'past' : ''} ${isWeekend ? 'weekend' : ''}`}
                    onClick={() => !isLocked && !isWeekend && handleDayClick(dateStr)}
                >
                    <span className="day-number">{i}</span>
                    {isLoading ? <div className="spinner"></div> : displayContent}
                    {isWeekend && <span className="weekend-label" style={{ fontSize: '0.7em', color: '#999', marginTop: '5px' }}>סגור</span>}
                </div>
            );
        }
        return days;
    };

    return (
        <div className="calendar-board glass-panel" dir="rtl">
            <div className="calendar-header">
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}>&lt;</button>
                <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}>&gt;</button>
            </div>

            <div className="calendar-legend">
                <div className="legend-item"><span className="dot veg"></span> צמחוני</div>
                <div className="legend-item"><span className="dot meat"></span> בשרי</div>

                <label className="weekly-toggle" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '20px' }}>
                    <input
                        type="checkbox"
                        checked={isWeeklyMode}
                        onChange={(e) => setIsWeeklyMode(e.target.checked)}
                        style={{ marginLeft: '5px' }}
                    />
                    <span>בחירה לכל השבוע</span>
                </label>
            </div>

            <div className="calendar-grid">
                <div className="day-name">א'</div>
                <div className="day-name">ב'</div>
                <div className="day-name">ג'</div>
                <div className="day-name">ד'</div>
                <div className="day-name">ה'</div>
                <div className="day-name">ו'</div>
                <div className="day-name">ש'</div>
                {generateCalendarDays()}
            </div>

            <p className="calendar-hint">
                {isGroupUser ? 'לחץ על יום לעריכת כמויות.' : 'לחץ לבחירה: בשרי 🍖 \u2190 צמחוני 🥦 \u2190 ללא'}
                {isWeeklyMode && <br />}<span style={{ color: 'var(--color-primary)' }}>{isWeeklyMode ? 'מצב עריכה שבועית פעיל: הבחירה תחול על כל השבוע (א-ה).' : ''}</span>
            </p>

            {editingDate && (
                <GroupOrderModal
                    date={editingDate}
                    initialVeg={meals[editingDate]?.veg || 0}
                    initialMeat={meals[editingDate]?.meat || 0}
                    onSave={handleGroupSave}
                    onClose={() => setEditingDate(null)}
                />
            )}
        </div>
    );
};

export default CalendarBoard;
