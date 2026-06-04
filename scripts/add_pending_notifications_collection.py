import sqlite3, json, sys, uuid
from datetime import datetime

def main():
    db_path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/pb_data.db"
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Check if collection already exists
    c.execute("SELECT id FROM _collections WHERE name='pending_notifications'")
    existing = c.fetchone()
    
    if existing:
        print("Collection 'pending_notifications' already exists")
        conn.close()
        return
    
    # Generate a collection ID (can be any string, but using UUID for uniqueness)
    collection_id = str(uuid.uuid4())
    current_time = int(datetime.now().timestamp())
    
    # Insert the collection into _collections table
    collection_data = {
        "id": collection_id,
        "name": "pending_notifications",
        "type": "auth",
        "system": False,
        "created": current_time,
        "updated": current_time,
        "fields": json.dumps([
            {
                "name": "user",
                "type": "relation",
                "required": False,
                "options": {
                    "collectionId": "_pb_users_auth_",
                    "cascadeDelete": False,
                    "maxSelect": 1,
                    "minSelect": 0,
                    "fields": []
                }
            },
            {
                "name": "title",
                "type": "text",
                "required": True,
                "options": {
                    "min": 1,
                    "max": 255,
                    "pattern": ""
                }
            },
            {
                "name": "body",
                "type": "text",
                "required": True,
                "options": {
                    "min": 1,
                    "max": 1000,
                    "pattern": ""
                }
            },
            {
                "name": "url",
                "type": "text",
                "required": False,
                "options": {
                    "min": 0,
                    "max": 500,
                    "pattern": ""
                }
            }
        ]),
        "indexes": json.dumps([]),
        "listRule": "@request.auth.id = user",
        "viewRule": "@request.auth.id = user",
        "createRule": "@request.auth.id = user",
        "updateRule": "@request.auth.id = user",
        "deleteRule": "@request.auth.id = user"
    }
    
    # Insert into _collections
    c.execute("""
        INSERT INTO _collections (id, name, type, system, created, updated, fields, indexes, listRule, viewRule, createRule, updateRule, deleteRule)
        VALUES (:id, :name, :type, :system, :created, :updated, :fields, :indexes, :listRule, :viewRule, :createRule, :updateRule, :deleteRule)
    """, collection_data)
    
    print(f"Created collection 'pending_notifications' with ID: {collection_id}")
    
    conn.commit()
    conn.close()
    print("Done!")

if __name__ == "__main__":
    main()