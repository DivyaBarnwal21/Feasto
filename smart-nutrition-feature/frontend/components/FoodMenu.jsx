import React, { useState } from 'react';
import NutritionModal from './NutritionModal';

// This acts as an example of your existing food menu integrated with the new feature
const FoodMenu = ({ userId, setCartItems }) => {
    const [selectedFood, setSelectedFood] = useState(null);

    // Mock data representing a fetched food list from your MongoDB
    const [menuItems] = useState([
        {
            _id: '1',
            name: 'Paneer Butter Masala',
            price: 250,
            calories: 450,
            protein: 15,
            carbs: 25,
            fats: 30
        },
        {
            _id: '2',
            name: 'Chicken Biryani',
            price: 300,
            calories: 600,
            protein: 35,
            carbs: 65,
            fats: 20
        }
    ]);

    // INTEGRATION: Wrap your existing Add To Cart handler to also call the new API
    const handleAddToCart = async (food) => {
        // 1. Existing Add to Cart logic
        // e.g. setCartItems(prev => [...prev, food]);
        console.log(`Added ${food.name} to cart.`);

        // 2. Call our new Nutrition tracking API
        try {
            const response = await fetch('/api/nutrition/add-to-cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, foodId: food._id })
            });

            if (!response.ok) {
                console.warn('Failed to update daily nutrition intake.');
            } else {
                console.log('Daily nutrition updated!');
                // If you have global state or context updating the DailyIntakeChart, you might trigger a refresh here.
            }
        } catch (error) {
            console.error('Error updating nutrition:', error);
        }
    };

    return (
        <div className="menu-container">
            <h2>Our Menu</h2>
            <div className="food-grid">
                {menuItems.map(item => (
                    <div key={item._id} className="food-card">
                        <h3>{item.name}</h3>
                        <p className="price">₹{item.price}</p>

                        <div className="card-actions">
                            {/* This opens the new Modal */}
                            <button
                                className="btn-info"
                                onClick={() => setSelectedFood(item)}
                            >
                                Nutritional Info
                            </button>

                            <button
                                className="btn-add"
                                onClick={() => handleAddToCart(item)}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Render the modal outside the loop */}
            <NutritionModal
                isOpen={!!selectedFood}
                onClose={() => setSelectedFood(null)}
                foodItem={selectedFood}
            />
        </div>
    );
};

export default FoodMenu;
