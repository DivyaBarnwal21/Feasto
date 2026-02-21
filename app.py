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

if __name__ == '__main__':
    print("Server running on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
