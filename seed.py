from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/")
db = client.feasto

# Data from data.js, but with added nutrition stats
food_items = [
    {
        "id": 1,
        "name": 'Margherita Pizza',
        "category": 'pizza',
        "price": 150,
        "description": 'Classic delight with 100% real mozzarella cheese.',
        "image": 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=500&auto=format&fit=crop',
        "rating": 4.5,
        "calories": 800, "protein": 36, "carbs": 100, "fats": 28
    },
    {
        "id": 2,
        "name": 'Veggie Supreme',
        "category": 'pizza',
        "price": 200,
        "description": 'Black olives, green capsicum, mushroom, onion, red paprika, sweet corn.',
        "image": 'assets/images/veggie-supreme.png',
        "rating": 4.7,
        "calories": 750, "protein": 30, "carbs": 95, "fats": 25
    },
    {
        "id": 3,
        "name": 'Classic Cheeseburger',
        "category": 'burger',
        "price": 50,
        "description": 'Juicy beef patty with cheddar cheese, lettuce, tomato, and house sauce.',
        "image": 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=500&auto=format&fit=crop',
        "rating": 4.8,
        "calories": 550, "protein": 30, "carbs": 45, "fats": 28
    },
    {
        "id": 4,
        "name": 'Spicy Chicken Burger',
        "category": 'burger',
        "price": 150,
        "description": 'Crispy fried chicken fillet with spicy mayo and pickles.',
        "image": 'assets/images/spicy-chicken-burger.png',
        "rating": 4.6,
        "calories": 600, "protein": 35, "carbs": 50, "fats": 30
    },
    {
        "id": 5,
        "name": 'Butter Chicken',
        "category": 'indian',
        "price": 450,
        "description": 'Tender chicken cooked in a rich tomato and butter gravy.',
        "image": 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=500&auto=format&fit=crop',
        "rating": 4.9,
        "calories": 650, "protein": 40, "carbs": 25, "fats": 45
    },
    {
        "id": 6,
        "name": 'Paneer Tikka Masala',
        "category": 'indian',
        "price": 350,
        "description": 'Grilled paneer cubes in a spicy and creamy tomato sauce.',
        "image": 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=500&auto=format&fit=crop',
        "rating": 4.7,
        "calories": 550, "protein": 20, "carbs": 30, "fats": 40
    },
    {
        "id": 7,
        "name": 'Kung Pao Chicken',
        "category": 'chinese',
        "price": 540,
        "description": 'Spicy stir-try dish made with chicken, peanuts, vegetables, and chili peppers.',
        "image": 'https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=500&auto=format&fit=crop',
        "rating": 4.4,
        "calories": 500, "protein": 35, "carbs": 35, "fats": 25
    },
    {
        "id": 8,
        "name": 'Chocolate Lava Cake',
        "category": 'dessert',
        "price": 60,
        "description": 'Molten chocolate cake topped with vanilla ice cream.',
        "image": 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=500&auto=format&fit=crop',
        "rating": 4.9,
        "calories": 450, "protein": 6, "carbs": 60, "fats": 22
    },
    {
        "id": 9,
        "name": 'Fresh Lime Soda',
        "category": 'drinks',
        "price": 120,
        "description": 'Refreshing sweet and salty soda with fresh lime juice.',
        "image": 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=500&auto=format&fit=crop',
        "rating": 4.5,
        "calories": 150, "protein": 0, "carbs": 38, "fats": 0
    },
    {
        "id": 10,
        "name": 'Crispy French Fries',
        "category": 'burger',
        "price": 100,
        "description": 'Golden crispy potato fries lightly salted and served with ketchup.',
        "image": 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?q=80&w=500&auto=format&fit=crop',
        "rating": 4.7,
        "calories": 380, "protein": 5, "carbs": 48, "fats": 18
    },
    {
        "id": 11,
        "name": 'Chicken Biryani',
        "category": 'indian',
        "price": 60,
        "description": 'Aromatic basmati rice cooked with spices and tender chicken pieces.',
        "image": 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=500&auto=format&fit=crop',
        "rating": 4.9,
        "calories": 700, "protein": 40, "carbs": 90, "fats": 20
    },
    {
        "id": 12,
        "name": 'Spring Rolls',
        "category": 'chinese',
        "price": 40,
        "description": 'Crispy fried rolls filled with savory vegetables and glass noodles.',
        "image": 'assets/images/spring-rolls.png',
        "rating": 4.5,
        "calories": 250, "protein": 6, "carbs": 35, "fats": 10
    },
    {
        "id": 13,
        "name": 'Mango Lassi',
        "category": 'drinks',
        "price": 80,
        "description": 'Creamy yogurt-based drink blended with sweet ripe mangoes.',
        "image": 'assets/images/mango-lassi.png',
        "rating": 4.8,
        "calories": 300, "protein": 8, "carbs": 45, "fats": 10
    }
]

# Create standard index
db.foods.drop() # Clear old stuff
db.foods.insert_many(food_items)

# Make daily_nutrition index
db.daily_nutrition.create_index([("userId", 1), ("date", 1)], unique=True)

print("MongoDB seeded with foods and macros!")
