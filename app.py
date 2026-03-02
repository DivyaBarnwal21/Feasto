from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# MongoDB Configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/feasto"
mongo = PyMongo(app)

@app.route('/api/orders', methods=['POST'])
def create_order():
    try:
        order_data = request.json
        if not order_data:
            return jsonify({"error": "No data provided"}), 400
        
        # Add timestamp
        order_data['created_at'] = datetime.utcnow()
        
        # Insert into MongoDB
        result = mongo.db.orders.insert_one(order_data)
        
        return jsonify({
            "message": "Order created successfully!",
            "order_id": str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/contact', methods=['POST'])
def create_contact():
    try:
        contact_data = request.json
        if not contact_data:
            return jsonify({"error": "No data provided"}), 400
        
        # Add timestamp
        contact_data['created_at'] = datetime.utcnow()
        
        # Insert into MongoDB
        result = mongo.db.contacts.insert_one(contact_data)
        
        return jsonify({
            "message": "Message received successfully!",
            "contact_id": str(result.inserted_id)
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/foods', methods=['GET'])
def get_foods():
    try:
        foods_cursor = mongo.db.foods.find({})
        foods = []
        for food in foods_cursor:
            food['_id'] = str(food['_id'])
            foods.append(food)
        return jsonify(foods), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/nutrition/add', methods=['POST'])
def add_nutrition():
    try:
        data = request.json
        user_id = data.get('userId', 'guest')
        food_id = data.get('foodId')
        
        if not food_id:
            return jsonify({"error": "Missing foodId"}), 400

        # Find food to get macros
        food = mongo.db.foods.find_one({"id": int(food_id)})
        if not food:
            return jsonify({"error": "Food not found"}), 404
            
        # Get start of today (midnight)
        from datetime import datetime
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Upsert the daily_nutrition record
        import pymongo
        result = mongo.db.daily_nutrition.find_one_and_update(
            {"userId": user_id, "date": today},
            {
                "$inc": {
                    "totalCalories": food.get("calories", 0),
                    "totalProtein": food.get("protein", 0),
                    "totalCarbs": food.get("carbs", 0),
                    "totalFats": food.get("fats", 0)
                }
            },
            upsert=True,
            return_document=pymongo.ReturnDocument.AFTER
        )
        
        # Clean ObjectIds for JSON serialization
        if '_id' in result:
            result['_id'] = str(result['_id'])
        
        return jsonify({
            "message": "Nutrition updated successfully!",
            "data": result
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/nutrition/today/<user_id>', methods=['GET'])
def get_today_nutrition(user_id):
    try:
        from datetime import datetime
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        record = mongo.db.daily_nutrition.find_one({"userId": user_id, "date": today})
        
        if not record:
            return jsonify({
                "totalCalories": 0,
                "totalProtein": 0,
                "totalCarbs": 0,
                "totalFats": 0
            }), 200
            
        record['_id'] = str(record['_id'])
        return jsonify(record), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("Server running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
