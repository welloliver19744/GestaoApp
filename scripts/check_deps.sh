#!/bin/bash
cd /home/ubuntu/gestaocasa/scripts
if [ -f node_modules/web-push/package.json ]; then
  echo "web-push INSTALLED"
else
  echo "web-push MISSING"
fi
if [ -f node_modules/nodemailer/package.json ]; then
  echo "nodemailer INSTALLED"
else
  echo "nodemailer MISSING"
fi
echo "node_modules size:"
du -sh node_modules 2>/dev/null || echo "no node_modules"
