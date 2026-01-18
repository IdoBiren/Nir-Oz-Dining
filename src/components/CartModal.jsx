import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import CartContext from '../context/CartContext';
import { useUser } from '../context/UserContext';
import { supabase, isBackendConfigured } from '../supabaseClient';
import './CartModal.css';

const Backdrop = ({ onClose }) => {
    return <div className="backdrop" onClick={onClose} />;
};

const ModalOverlay = ({ onClose }) => {
    const cartCtx = useContext(CartContext);
    const { user } = useUser(); // Get user info
    const hasItems = cartCtx.items.length > 0;
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const totalAmount = `$${cartCtx.totalAmount.toFixed(2)}`;

    const cartItemRemoveHandler = (id) => {
        cartCtx.removeItem(id);
    };

    const cartItemAddHandler = (item) => {
        cartCtx.addItem({ ...item, amount: 1 });
    };

    const orderHandler = async () => {
        if (!isBackendConfigured) {
            alert('Backend not configured! Please set up Supabase in .env file.');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('orders')
                .insert([
                    {
                        customer_name: user ? user.name : 'Guest',
                        items: cartCtx.items,
                        total_amount: cartCtx.totalAmount,
                        status: 'pending'
                    },
                ]);

            if (error) throw error;

            alert('Order sent to kitchen!');
            cartCtx.clearCart();
            onClose();
        } catch (error) {
            console.error('Error placing order:', error);
            alert('Failed to place order. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const cartItems = (
        <ul className="cart-items">
            {cartCtx.items.map((item) => (
                <li key={item.id} className="cart-item">
                    <div>
                        <h4 className="cart-item-name">{item.name}</h4>
                        <div className="cart-item-summary">
                            <span className="cart-item-price">${item.price.toFixed(2)}</span>
                            <span className="cart-item-amount">x {item.amount}</span>
                        </div>
                    </div>
                    <div className="cart-item-actions">
                        <button onClick={() => cartItemRemoveHandler(item.id)}>−</button>
                        <button onClick={() => cartItemAddHandler(item)}>+</button>
                    </div>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="modal glass-panel">
            <div className="modal-content">
                <h2 className="modal-title">Your Cart</h2>
                {cartItems}
                <div className="total">
                    <span>Total Amount</span>
                    <span>{totalAmount}</span>
                </div>
                <div className="actions">
                    <button className="btn-alt" onClick={onClose}>
                        Close
                    </button>
                    {hasItems && (
                        <button className="btn-primary" onClick={orderHandler} disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Order'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const portalElement = document.getElementById('overlays');

const CartModal = ({ onClose }) => {
    return (
        <>
            {ReactDOM.createPortal(<Backdrop onClose={onClose} />, portalElement)}
            {ReactDOM.createPortal(<ModalOverlay onClose={onClose} />, portalElement)}
        </>
    );
};

export default CartModal;
