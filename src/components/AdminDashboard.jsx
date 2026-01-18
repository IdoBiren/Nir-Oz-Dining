import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useUser } from '../context/UserContext';
import './AdminDashboard.css';
import './CalendarBoard.css'; // Reuse calendar styles

const AdminDashboard = () => {
    const { user } = useUser();
    const [ordersMap, setOrdersMap] = useState({}); // { '2025-01-01': { veg: 5, meat: 10, total: 15 } }
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'users'
    const [selectedDateDetails, setSelectedDateDetails] = useState(null); // { date: '...', users: [] }
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Calendar Helpers
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const monthNames = [
        "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
        "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    ];

    const changeMonth = (offset) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentMonth(newDate);
    };

    const fetchOrderDetails = async (date) => {
        // Mock Details for Test User
        if (user?.id && user.id.startsWith('test-')) {
            setSelectedDateDetails({
                date,
                users: [
                    { name: 'Test User', email: 'test@example.com', veg: 1, meat: 0 },
                    { name: 'Another User', email: 'other@example.com', veg: 0, meat: 1 }
                ]
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('user_meals')
                .select(`
                    veg_quantity, 
                    meat_quantity, 
                    user_email
                `)
                .eq('meal_date', date);

            if (error) throw error;

            const details = data.map(order => {
                const orderEmail = order.user_email?.toLowerCase();
                const userProfile = usersList.find(u => u.user_email?.toLowerCase() === orderEmail);
                return {
                    name: userProfile?.name || order.user_email,
                    email: order.user_email,
                    veg: order.veg_quantity,
                    meat: order.meat_quantity
                };
            });

            setSelectedDateDetails({ date, users: details });

        } catch (err) {
            console.error('Error details:', err);
            alert('שגיאה בטעינת פירוט');
        }
    };

    const closeDetails = () => setSelectedDateDetails(null);

    useEffect(() => {
        const fetchData = async () => {
            // Check for Test User
            if (user?.id && user.id.startsWith('test-')) {
                console.log('Using Mock Data for Test User');
                setOrdersMap({
                    '2025-01-01': { veg: 5, meat: 10, total: 15 },
                    '2025-01-02': { veg: 8, meat: 12, total: 20 },
                });
                setUsersList([
                    { user_email: 'test_user@example.com', role: 'user', name: 'Test User' },
                    { user_email: 'test_manager@example.com', role: 'group_order', name: 'Test Manager' },
                    { user_email: 'real_admin@example.com', role: 'admin', name: 'Real Admin' },
                ]);
                setLoading(false);
                return;
            }

            try {
                // Fetch Meals
                const { data: mealsData, error: mealsError } = await supabase
                    .from('user_meals')
                    .select('meal_date, veg_quantity, meat_quantity');

                if (mealsError) throw mealsError;

                // Aggregate Orders
                const agg = {};
                mealsData.forEach(row => {
                    if (!agg[row.meal_date]) {
                        agg[row.meal_date] = { veg: 0, meat: 0, total: 0 };
                    }
                    agg[row.meal_date].veg += (row.veg_quantity || 0);
                    agg[row.meal_date].meat += (row.meat_quantity || 0);
                    agg[row.meal_date].total += (row.veg_quantity || 0) + (row.meat_quantity || 0);
                });
                setOrdersMap(agg);

                // Fetch Users
                const { data: rolesData, error: rolesError } = await supabase
                    .from('user_roles')
                    .select('*');

                if (!rolesError) {
                    setUsersList(rolesData);
                }

            } catch (error) {
                console.error('Error fetching admin data:', error);
                alert('שגיאה בטעינת נתונים');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const updateRole = async (email, newRole) => {
        if (user?.id && user.id.startsWith('test-')) {
            setUsersList(usersList.map(u => u.user_email === email ? { ...u, role: newRole } : u));
            alert('(Mock) Role updated successfully!');
            return;
        }

        try {
            const { error } = await supabase
                .from('user_roles')
                .update({ role: newRole })
                .eq('user_email', email);

            if (error) throw error;

            setUsersList(usersList.map(u => u.user_email === email ? { ...u, role: newRole } : u));
            alert('התפקיד עודכן בהצלחה!');
        } catch (error) {
            console.error('Error updating role:', error);
            alert('שגיאה בעדכון תפקיד. וודא שיש לך הרשאות מתאימות.');
        }
    };

    // Render Calendar Days
    const generateCalendarDays = () => {
        const gridItems = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Build Data Model
        const rawCells = [];

        // Padding Start
        for (let i = 0; i < firstDayOfMonth; i++) {
            rawCells.push({ type: 'empty', id: `start-${i}` });
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            rawCells.push({ type: 'day', dayNum: i, dateObj, dateStr, id: `day-${i}` });
        }

        // Padding End (Ensure divisible by 7)
        const remainder = rawCells.length % 7;
        const paddingNeeded = remainder === 0 ? 0 : 7 - remainder;
        for (let i = 0; i < paddingNeeded; i++) {
            rawCells.push({ type: 'empty', id: `end-${i}` });
        }

        // 2. Render Batches
        for (let i = 0; i < rawCells.length; i += 7) {
            const weekBatch = rawCells.slice(i, i + 7);
            const weekTotals = { veg: 0, meat: 0 };

            // Render Days
            weekBatch.forEach(cell => {
                if (cell.type === 'empty') {
                    gridItems.push(<div key={cell.id} className="calendar-day empty"></div>);
                } else {
                    const { dateObj, dateStr, dayNum } = cell;
                    const isToday = dateObj.getTime() === today.getTime();
                    const dayOfWeek = dateObj.getDay();
                    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

                    const stats = ordersMap[dateStr];
                    const hasOrder = stats && stats.total > 0;

                    if (hasOrder) {
                        weekTotals.veg += stats.veg || 0;
                        weekTotals.meat += stats.meat || 0;
                    }

                    let displayContent = null;
                    if (hasOrder) {
                        displayContent = (
                            <div className="group-counts">
                                {stats.veg > 0 && <span className="veg-count">{stats.veg}</span>}
                                {stats.meat > 0 && <span className="meat-count">{stats.meat}</span>}
                            </div>
                        );
                    }

                    gridItems.push(
                        <div
                            key={cell.id}
                            className={`calendar-day ${hasOrder ? 'confirmed' : ''} ${isToday ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                            onClick={() => hasOrder && fetchOrderDetails(dateStr)}
                            style={{ cursor: hasOrder ? 'pointer' : 'default' }}
                        >
                            <span className="day-number">{dayNum}</span>
                            {displayContent}
                            {isWeekend && <span className="weekend-label" style={{ fontSize: '0.7em', color: '#999', marginTop: '5px' }}>סגור</span>}
                        </div>
                    );
                }
            });

            // 3. Render Week Summary Column (Removed for Admin)
        }
        return gridItems;
    };

    if (loading) return <div className="loading-screen">טוען נתונים...</div>;

    return (
        <div className="admin-dashboard glass-panel" dir="rtl">
            <h2>לוח בקרה - מנהל</h2>

            <div className="admin-tabs">
                <button
                    className={activeTab === 'orders' ? 'active' : ''}
                    onClick={() => setActiveTab('orders')}
                >
                    סיכום חודשי
                </button>
                <button
                    className={activeTab === 'users' ? 'active' : ''}
                    onClick={() => setActiveTab('users')}
                >
                    רשימת משתמשים
                </button>
            </div>

            {activeTab === 'orders' ? (
                <div className="calendar-board admin-calendar"> {/* Use shared calendar class */}
                    <div className="calendar-header">
                        <button onClick={() => changeMonth(-1)}>&lt;</button>
                        <h2>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
                        <button onClick={() => changeMonth(1)}>&gt;</button>
                    </div>

                    <div className="calendar-legend">
                        <div className="legend-item"><span className="dot veg"></span> סיכום צמחוני</div>
                        <div className="legend-item"><span className="dot meat"></span> סיכום בשרי</div>
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

                    <p className="calendar-hint">לחץ על יום לצפייה בפירוט המזמינים</p>
                </div>
            ) : (
                <div className="table-container">
                    <h3>ניהול הרשאות</h3>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>שם משתמש</th>
                                <th>אימייל</th>
                                <th>תפקיד</th>
                                <th>פעולות</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.length > 0 ? (
                                usersList.map(u => (
                                    <tr key={u.user_email}>
                                        <td>{u.name || (u.user_email ? u.user_email.split('@')[0] : '-')}</td>
                                        <td style={{ direction: 'ltr', textAlign: 'right' }}>{u.user_email}</td>
                                        <td>
                                            <select
                                                value={u.role}
                                                onChange={(e) => updateRole(u.user_email, e.target.value)}
                                                className="role-select"
                                                style={{ padding: '5px' }}
                                            >
                                                <option value="user">משתמש רגיל</option>
                                                <option value="group_order">אחראי קבוצה</option>
                                                <option value="admin">מנהל</option>
                                            </select>
                                        </td>
                                        <td>
                                            {/* Future: Delete button */}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>לא נמצאו משתמשים.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Details Modal */}
            {selectedDateDetails && (
                <div className="modal-backdrop" onClick={closeDetails}>
                    <div className="modal-content details-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>פירוט המזמינים - {new Date(selectedDateDetails.date).toLocaleDateString('he-IL')}</h3>
                            <button className="close-btn" onClick={closeDetails}>&times;</button>
                        </div>
                        <div className="details-list">
                            <table className="details-table">
                                <thead>
                                    <tr>
                                        <th>שם</th>
                                        <th>צמחוני</th>
                                        <th>בשרי</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedDateDetails.users.map((u, idx) => (
                                        <tr key={idx}>
                                            <td>
                                                <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                                                <div style={{ fontSize: '0.8em', color: '#666' }}>{u.email}</div>
                                            </td>
                                            <td className={u.veg > 0 ? 'veg-text' : ''}>{u.veg > 0 ? u.veg : '-'}</td>
                                            <td className={u.meat > 0 ? 'meat-text' : ''}>{u.meat > 0 ? u.meat : '-'}</td>
                                        </tr>
                                    ))}
                                    {selectedDateDetails.users.length === 0 && (
                                        <tr><td colSpan="3" style={{ textAlign: 'center' }}>אין נתונים</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
