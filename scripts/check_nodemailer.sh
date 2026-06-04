#!/bin/bash
echo "Checking nodemailer..."
node -e "try { require.resolve('nodemailer'); console.log('AVAILABLE'); } catch(e) { console.log('NOT_AVAILABLE'); }"
echo "Checking web-push..."
node -e "try { require.resolve('web-push'); console.log('AVAILABLE'); } catch(e) { console.log('NOT_AVAILABLE'); }"
echo "done"
