# INSTRUCOES_AMANHA.md

## Segurança e Infraestrutura (Item 11)

1. **Acesso ao servidor**
   ```bash
   ssh <USUARIO>@<ENDERECO_DO_SERVIDOR>
   ```
2. **Transferir scripts**
   ```bash
   scp -r C:\Users\welld\Desktop\GestaoCasa\scripts\ <USUARIO>@<ENDERECO_DO_SERVIDOR>:/home/<USUARIO>/gestaocasa/
   ```
3. **Fail2Ban**
   ```bash
   sudo cp /home/<USUARIO>/gestaocasa/fail2ban.conf /etc/fail2ban/jail.local
   sudo apt-get update && sudo apt-get install -y fail2ban
   sudo systemctl restart fail2ban
   sudo systemctl status fail2ban
   ```
4. **UFW**
   ```bash
   chmod +x /home/<USUARIO>/gestaocasa/setup_ufw.sh
   sudo /home/<USUARIO>/gestaocasa/setup_ufw.sh
   sudo ufw status verbose
   ```
5. **Health‑check**
   ```bash
   chmod +x /home/<USUARIO>/gestaocasa/healthcheck.sh
   /home/<USUARIO>/gestaocasa/healthcheck.sh   # teste manual
   ```
   - **systemd timer** (recomendado)
   ```bash
   sudo tee /etc/systemd/system/gestaocasa-health.service > /dev/null <<'EOF'
   [Unit]
   Description=Health‑check da API GestaoCasa

   [Service]
   Type=oneshot
   ExecStart=/home/<USUARIO>/gestaocasa/healthcheck.sh
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
   - **cron** (alternativa)
   ```bash
   crontab -e
   # */5 * * * * /home/<USUARIO>/gestaocasa/healthcheck.sh >> /var/log/gestaocasa-health.log 2>&1
   ```
6. **CI/CD** – já está configurado em `.github/workflows/ci.yml`.  Basta fazer push para a branch `main` que o GitHub Actions executa checkout, npm ci, lint, build, testes e escaneia por segredos.

## Testes (Item 12) – Próximos passos
- Instalar Vitest (`npm i -D vitest @testing-library/react`).
- Criar testes:
  - `frontend/tests/ShareModal.test.tsx` – verifica fetch de usuários, seleção múltipla e PATCH.
  - `frontend/tests/utils.test.ts` – cobre `formatCurrency` (com moeda) e `compressImage`.
- Atualizar CI para rodar `npm test --if-present`.
- Rodar localmente `npm test` e garantir que passe antes de commitar.

## Checklist rápido
- [ ] Fail2Ban ativo
- [ ] UFW configurado
- [ ] Health‑check agendado
- [ ] CI/CD executando sem erros
- [ ] Testes Vitest criados e passando
- [ ] Fluxo de compartilhamento validado com duas contas
