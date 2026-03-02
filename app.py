import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson.objectid import ObjectId

app = Flask(__name__)
CORS(app)

# MongoDB Configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/feasto"
app.config["JWT_SECRET"] = "super-secret-key-12345" # In production, use os.environ.get
mongo = PyMongo(app)

# --- JWT Middleware ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]
                
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
            
        try:
            data = jwt.decode(token, app.config['JWT_SECRET'], algorithms=["HS256"])
            current_user = mongo.db.users.find_one({"_id": ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'Invalid token user!'}), 401
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
            
        # Pass the current_user to the route
        return f(current_user, *args, **kwargs)
    return decorated

# --- Auth Routes ---
@app.route('/api/auth/register', methods=['POST'])
def register_user():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not name or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400
            
        # Check if email exists
        if mongo.db.users.find_one({'email': email}):
            return jsonify({'error': 'Email already registered'}), 400
            
        # Hash password securely
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        user_id = mongo.db.users.insert_one({
            'name': name,
            'email': email,
            'password': hashed_password.decode('utf-8'),
            'createdAt': datetime.utcnow()
        }).inserted_id
        
        return jsonify({'message': 'User registered successfully!', 'userId': str(user_id)}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login_user():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400
            
        user = mongo.db.users.find_one({'email': email})
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
            
        # Verify password
        if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
            # Generate JWT
            token = jwt.encode({
                'user_id': str(user['_id']),
                'exp': datetime.utcnow() + timedelta(days=7) # Token expires in 7 days
            }, app.config['JWT_SECRET'], algorithm="HS256")
            
            return jsonify({
                'message': 'Login successful',
                'token': token,
                'user': {
                    'id': str(user['_id']),
                    'name': user['name'],
                    'email': user['email']
                }
            }), 200
        else:
             return jsonify({'error': 'Invalid email or password'}), 401
             
    except Exception as e:
        return jsonify({'error': str(e)}), 500

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
@token_required
def add_nutrition(current_user):
    try:
        data = request.json
        user_id = str(current_user['_id'])
        food_id = data.get('foodId')
        count = data.get('count', 1)
        
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
                    "totalCalories": food.get("calories", 0) * count,
                    "totalProtein": food.get("protein", 0) * count,
                    "totalCarbs": food.get("carbs", 0) * count,
                    "totalFats": food.get("fats", 0) * count
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

@app.route('/api/nutrition/remove', methods=['POST'])
@token_required
def remove_nutrition(current_user):
    try:
        data = request.json
        user_id = str(current_user['_id'])
        food_id = data.get('foodId')
        count = data.get('count', 1)
        
        if not food_id:
            return jsonify({"error": "Missing foodId"}), 400

        # Find food to get macros
        food = mongo.db.foods.find_one({"id": int(food_id)})
        if not food:
            return jsonify({"error": "Food not found"}), 404
            
        from datetime import datetime
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Upsert the daily_nutrition record with negative values
        import pymongo
        result = mongo.db.daily_nutrition.find_one_and_update(
            {"userId": user_id, "date": today},
            {
                "$inc": {
                    "totalCalories": -(food.get("calories", 0) * count),
                    "totalProtein": -(food.get("protein", 0) * count),
                    "totalCarbs": -(food.get("carbs", 0) * count),
                    "totalFats": -(food.get("fats", 0) * count)
                }
            },
            upsert=True,
            return_document=pymongo.ReturnDocument.AFTER
        )
        
        # Ensure values don't go below 0
        if result:
            needs_update = False
            for key in ["totalCalories", "totalProtein", "totalCarbs", "totalFats"]:
                if result.get(key, 0) < 0:
                    result[key] = 0
                    needs_update = True
            
            if needs_update:
                result = mongo.db.daily_nutrition.find_one_and_update(
                    {"userId": user_id, "date": today},
                    {"$set": {
                        "totalCalories": result["totalCalories"],
                        "totalProtein": result["totalProtein"],
                        "totalCarbs": result["totalCarbs"],
                        "totalFats": result["totalFats"]
                    }},
                    return_document=pymongo.ReturnDocument.AFTER
                )
                
            if '_id' in result:
                result['_id'] = str(result['_id'])
            
        return jsonify({
            "message": "Nutrition removed successfully!",
            "data": result
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/nutrition/today', methods=['GET'])
@token_required
def get_today_nutrition(current_user):
    try:
        from datetime import datetime
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Get user ID string to query the older records if they existed, or new ones
        user_id = str(current_user['_id'])
        
        # Check both modern (tied to ObjectId) or legacy 'guest_user' formats for robust querying
        record = mongo.db.daily_nutrition.find_one({
            "$or": [
                {"userId": user_id, "date": today},
                {"userId": "guest_user", "date": today} # For backward compatibility with older data locally
            ]
        })
        
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
