import React, { useRef } from 'react';
import './LoginModal.css'; // Reuse styles for consistency

const GroupOrderModal = ({ date, initialVeg, initialMeat, onSave, onClose }) => {
    const vegRef = useRef();
    const meatRef = useRef();

    const submitHandler = (e) => {
        e.preventDefault();
        const veg = parseInt(vegRef.current.value) || 0;
        const meat = parseInt(meatRef.current.value) || 0;
        onSave(date, veg, meat);
    };

    return (
        <div className="backdrop" onClick={onClose}>
            <div className="modal login-modal glass-panel" onClick={(e) => e.stopPropagation()} dir="rtl">
                <h2>הזמנה קבוצתית</h2>
                <p className="login-subtitle">הגדרת כמויות לתאריך {date}</p>

                <form onSubmit={submitHandler}>
                    <div className="control">
                        <label>מנות צמחוניות 🥦</label>
                        <input
                            type="number"
                            ref={vegRef}
                            defaultValue={initialVeg}
                            min="0"
                            autoFocus
                        />
                    </div>
                    <div className="control">
                        <label>מנות בשריות 🍖</label>
                        <input
                            type="number"
                            ref={meatRef}
                            defaultValue={initialMeat}
                            min="0"
                        />
                    </div>

                    <div className="actions" style={{ display: 'flex', gap: '10px' }}>
                        <button type="button" className="btn-alt" onClick={onClose} style={{ flex: 1 }}>ביטול</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1, marginTop: 0 }}>שמור השינויים</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GroupOrderModal;
