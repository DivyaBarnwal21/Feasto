from pymongo import MongoClient

def verify_mongo():
    try:
        # Connect to local MongoDB
        client = MongoClient("mongodb://localhost:27017/")
        
        # Access database and collection
        db = client["feasto"]
        collection = db["orders"]
        
        # Insert a test document
        test_doc = {"test": "Connection established", "timestamp": "Verification"}
        result = collection.insert_one(test_doc)
        
        print("✅ SUCCESS!")
        print(f"Test document inserted with ID: {result.inserted_id}")
        print("The 'feasto' database and 'orders' collection should now be visible in MongoDB Compass or shell.")
        
    except Exception as e:
        print("❌ ERROR:")
        print(e)
        print("\nPlease ensure MongoDB is installed and running on default port 27017.")

if __name__ == "__main__":
    verify_mongo()
