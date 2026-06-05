docker cp gestaocasa-pocketbase:/pb_data/data.db /tmp/pb_data.db
sqlite3 /tmp/pb_data.db "SELECT id, name, type FROM _collections ORDER BY name;"
echo "---"
sqlite3 /tmp/pb_data.db "SELECT fields FROM _collections WHERE name='cards';"
