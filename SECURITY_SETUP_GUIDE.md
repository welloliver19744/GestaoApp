# Guia rápido – Configuração de Segurança e Infra

Este documento descreve, passo‑a‑passo, como aplicar as alterações de segurança que já foram preparadas nos scripts do repositório. Tudo que você precisa está dentro da pasta `scripts/` do projeto.

---

## 1️⃣ Acesso ao servidor
```bash
ssh ubuntu@137.131.187.156 -i C:\Users\welld\Downloads\ssh-key-2026-05-26\ \(1\).key
```

---

## 2️⃣ Transferir os arquivos do seu PC para o servidor
```bash
# No PowerShell
scp -r C:\Users\welld\Desktop\GestaoCasa\scripts\ ubuntu@137.131.187.156:/home/ubuntu/gestaocasa/
```
**Resultado esperado** (no servidor):
```
/home/ubuntu/gestaocasa/
├─ fail2ban.conf
├─ setup_ufw.sh
├─ healthcheck.sh
├─ backup.sh
├─ send-push.js
├─ send-email-notifications.js
├─ email-config.json
├─ email-config.example.json
└─ package.json
```

---

## 3️⃣ Configurar **fail2ban**
```bash
sudo cp /home/ubuntu/gestaocasa/fail2ban.conf /etc/fail2ban/jail.local
sudo systemctl restart fail2ban
sudo systemctl status fail2ban
```

O `jail.local` contém:
- **sshd**: banimento de 1 h após 5 tentativas falhas
- **nginx-limit-req**: banimento de 1 h após 3 excessos de rate limit em 10 min

---

## 4️⃣ Configurar o **firewall UFW**
```bash
chmod +x /home/ubuntu/gestaocasa/setup_ufw.sh
sudo /home/ubuntu/gestaocasa/setup_ufw.sh
```

O script realiza:
- `ufw allow OpenSSH` (porta 22)
- `ufw allow 80/tcp` & `ufw allow 443/tcp`
- `ufw allow 3001/tcp` (Nginx frontend)
- `ufw allow 8091/tcp` (PocketBase admin)
- `ufw enable`

### Verificar regras
```bash
sudo ufw status verbose
```

---

## 5️⃣ Health‑check da API PocketBase
### 5.1 Tornar o script executável
```bash
chmod +x /home/ubuntu/gestaocasa/healthcheck.sh
```
### 5.2 Teste manual
```bash
/home/ubuntu/gestaocasa/healthcheck.sh
# Saída esperada: "Health check passed"
```
### 5.3 Agendar via systemd timer
```bash
sudo tee /etc/systemd/system/gestaocasa-health.service > /dev/null <<'EOF'
[Unit]
Description=Health‑check da API GestaoCasa
[Service]
Type=oneshot
ExecStart=/home/ubuntu/gestaocasa/healthcheck.sh
EOF

sudo tee /etc/systemd/system/gestaocasa-health.timer > /dev/null <<'EOF'
[Unit]
Description=Timer para health‑check da API GestaoCasa
[Timer]
OnBootSec=30
OnUnitActiveSec=300
Persistent=true
[Install]
WantedBy=timers.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now gestaocasa-health.timer
systemctl list-timers | grep gestaocasa-health
```

---

## 6️⃣ Rate limiting (Nginx)
Já aplicado no `nginx.conf` do container gestaocasa-frontend:
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=3r/m;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://supabase-kong:8090/;
}

location /api/collections/users/auth-with-password {
    limit_req zone=login burst=2 nodelay;
    proxy_pass http://supabase-kong:8090/api/collections/users/auth-with-password;
}
```

---

## 7️⃣ Notificações por E-mail
### Configurar SMTP
```bash
cp /home/ubuntu/gestaocasa/scripts/email-config.example.json /home/ubuntu/gestaocasa/scripts/email-config.json
nano /home/ubuntu/gestaocasa/scripts/email-config.json
# Preencha host, port, user, pass
```

### Instalar dependência (nodemailer)
```bash
cd /home/ubuntu/gestaocasa/scripts && npm install
```

### Agendar cron (já ativo)
```
5 8 * * * node /home/ubuntu/gestaocasa/scripts/send-email-notifications.js >> /home/ubuntu/gestaocasa/scripts/push.log 2>&1
```

---

## 8️⃣ CI/CD (GitHub Actions)
Arquivo: `.github/workflows/ci.yml`
- Dispara em push na branch `master`
- Etapas: checkout, npm ci, lint, build, tests (24), TruffleHog

---

## 9️⃣ Checklist final
- [ ] fail2ban ativo com jails sshd + nginx-limit-req
- [ ] UFW ativo com portas 22, 80, 443, 3001, 8091
- [ ] Healthcheck agendado (systemd timer 5min)
- [ ] Rate limiting Nginx configurado (10r/s API, 3r/m login)
- [ ] Backup automático cron diário 03:00
- [ ] Push notifications cron diário 08:00
- [ ] Email notifications cron diário 08:05 (se SMTP configurado)
- [ ] CI/CD pipeline no GitHub Actions

---

*Qualquer dúvida ou erro ao executar algum passo, copie a mensagem de erro aqui que eu ajudo a corrigir.*
