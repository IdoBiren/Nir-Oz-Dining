import React from 'react';
import './MealCard.css';

const MealCard = ({ id, name, description, price, image, onAddToCart }) => {
    const formattedPrice = `$${price.toFixed(2)}`;

    return (
        <article className="meal-card glass-panel">
            <div className="meal-img-container">
                <img src={image} alt={name} className="meal-img" />
            </div>
            <div className="meal-content">
                <div>
                    <h3 className="meal-title">{name}</h3>
                    <p className="meal-description">{description}</p>
                </div>
                <div className="meal-action">
                    <span className="meal-price">{formattedPrice}</span>
                    <button className="btn-add" onClick={() => onAddToCart(id)}>+ Add</button>
                </div>
            </div>
        </article>
    );
};

export default MealCard;
