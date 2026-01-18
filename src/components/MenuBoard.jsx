import React, { useContext } from 'react';
import MealCard from './MealCard';
import { DUMMY_MEALS } from '../data/meals';
import CartContext from '../context/CartContext';
import './MenuBoard.css';

const MenuBoard = () => {
    const cartCtx = useContext(CartContext);

    const handleAddToCart = (id) => {
        const meal = DUMMY_MEALS.find(m => m.id === id);
        if (meal) {
            cartCtx.addItem({
                id: id,
                name: meal.name,
                amount: 1,
                price: meal.price
            });
        }
    };

    return (
        <section className="menu-board container">
            <h2 className="section-title">Our Menu</h2>
            <div className="meals-grid">
                {DUMMY_MEALS.map((meal) => (
                    <MealCard
                        key={meal.id}
                        id={meal.id}
                        name={meal.name}
                        description={meal.description}
                        price={meal.price}
                        image={meal.image}
                        onAddToCart={handleAddToCart}
                    />
                ))}
            </div>
        </section>
    );
};

export default MenuBoard;
