const express = require('express');
const router = express.Router();
const DailyNutrition = require('../models/DailyNutrition');
const Food = require('../models/Food');

// POST /api/nutrition/add-to-cart
// Called when a user adds a food item to their cart
router.post('/add-to-cart', async (req, res) => {
  try {
    const { userId, foodId } = req.body;

    if (!userId || !foodId) {
        return res.status(400).json({ message: 'Missing userId or foodId' });
    }

    // 1. Fetch food details to get its nutritional values
    const food = await Food.findById(foodId);
    if (!food) {
      return res.status(404).json({ message: 'Food item not found' });
    }

    // 2. Identify "today" (normalized to midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3. Update DailyNutrition totals if entry exists for today, else Create new entry
    const updatedIntake = await DailyNutrition.findOneAndUpdate(
      { userId, date: today },
      {
        $inc: {
          totalCalories: food.calories,
          totalProtein: food.protein,
          totalCarbs: food.carbs,
          totalFats: food.fats
        }
      },
      { new: true, upsert: true } // `upsert: true` creates a new document if one is not found
    );

    res.status(200).json({
      message: 'Daily nutrition updated successfully',
      data: updatedIntake
    });
  } catch (error) {
    console.error('Error updating daily nutrition:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// GET /api/nutrition/today/:userId
// Fetch today's intake dashboard data for a user
router.get('/today/:userId', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const intake = await DailyNutrition.findOne({ 
            userId: req.params.userId, 
            date: today 
        });

        // If no intake yet, return 0s
        if (!intake) {
           return res.status(200).json({
               totalCalories: 0,
               totalProtein: 0,
               totalCarbs: 0,
               totalFats: 0
           });
        }

        res.status(200).json(intake);
    } catch (error) {
        console.error('Error fetching today\\'s intake:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
