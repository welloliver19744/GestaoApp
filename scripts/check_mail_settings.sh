#!/bin/bash
docker exec gestaocasa-pocketbase cat /pb_data/settings.json | python3 -c "
import sys, json
s = json.load(sys.stdin)
m = s.get('mail', {})
for k in ['host','port','username','tls']:
    print(f'{k}: {m.get(k)}')
"
