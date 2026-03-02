import React from 'react';
import './NutritionModal.css';

const NutritionModal = ({ isOpen, onClose, foodItem }) => {
    if (!isOpen || !foodItem) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose} aria-label="Close modal">X</button>

                <h2>{foodItem.name} - Nutritional Info</h2>

                <div className="nutrition-grid">
                    <div className="nutrition-card calories">
                        <span className="label">Calories</span>
                        <span className="value">{foodItem.calories} kcal</span>
                    </div>
                    <div className="nutrition-card protein">
                        <span className="label">Protein</span>
                        <span className="value">{foodItem.protein} g</span>
                    </div>
                    <div className="nutrition-card carbs">
                        <span className="label">Carbs</span>
                        <span className="value">{foodItem.carbs} g</span>
                    </div>
                    <div className="nutrition-card fats">
                        <span className="label">Fats</span>
                        <span className="value">{foodItem.fats} g</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NutritionModal;
