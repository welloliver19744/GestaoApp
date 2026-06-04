#!/bin/bash
CRONTAB=$(mktemp)
crontab -l 2>/dev/null > "$CRONTAB"

# Remove corrupted email line if exists
sed -i '/send-email-notifications/d' "$CRONTAB"

# Remove any lines that look like file listings (corrupted)
sed -i '/Modelfile\|backups\|dashboard\|dump_supabase\|gateway_test\|get-docker\|hermes-agent\|snap\|teste_ia\|test_discord\|diagmedcall/d' "$CRONTAB"

# Add email notification cron (runs 5 min after push at 8:05 AM)
echo '5 8 * * * cd /home/ubuntu/gestaocasa/scripts && node send-email-notifications.js >> /home/ubuntu/gestaocasa/scripts/email.log 2>&1' >> "$CRONTAB"

crontab "$CRONTAB"
rm "$CRONTAB"
echo "Crontab updated:"
crontab -l
