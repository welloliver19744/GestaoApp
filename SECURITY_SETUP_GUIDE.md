# Guia rápido – Configuração de Segurança e Infra (Item 11)

Este documento descreve, passo‑a‑passo, como aplicar as alterações de segurança que já foram preparadas nos scripts do repositório.  Tudo que você precisa está dentro da pasta `scripts/` do projeto.

---

## 1️⃣ Acesso ao servidor
```bash
# Substitua pelos seus dados
ssh <USUARIO>@<ENDERECO_DO_SERVIDOR>
# Caso sua conexão SSH use outra porta, adicione -p <PORTA>
```

---

## 2️⃣ Transferir os arquivos do seu PC para o servidor
> **Windows → Linux** (usar `scp` ou `pscp`).
```bash
# No PowerShell (caminho local da sua máquina Windows)
scp -r C:\Users\welld\Desktop\GestaoCasa\scripts\ <USUARIO>@<ENDERECO_DO_SERVIDOR>:/home/<USUARIO>/gestaocasa/
```
> **Resultado esperado** (no servidor):
```
/home/<USUARIO>/gestaocasa/
├─ fail2ban.conf
├─ setup_ufw.sh
└─ healthcheck.sh
```
---

## 3️⃣ Configurar **fail2ban**
```bash
# Copiar o arquivo para o diretório de configuração do fail2ban
sudo cp /home/<USUARIO>/gestaocasa/fail2ban.conf /etc/fail2ban/jail.local

# (Se o fail2ban ainda não estiver instalado)
sudo apt-get update && sudo apt-get install -y fail2ban

# Reiniciar o serviço para aplicar as regras
sudo systemctl restart fail2ban

# Verificar se está ativo
sudo systemctl status fail2ban
```
> O `jail.local` já contém: banimento de 1 h após 5 tentativas falhas em `sshd`.
---

## 4️⃣ Configurar o **firewall UFW**
```bash
# Tornar o script executável
chmod +x /home/<USUARIO>/gestaocasa/setup_ufw.sh

# Executar como root
sudo /home/<USUARIO>/gestaocasa/setup_ufw.sh
```
> O script realiza:
> - `ufw allow OpenSSH` (porta 22 ou a que usa seu SSH)
> - `ufw allow 80/tcp`  & `ufw allow 443/tcp` (HTTP/HTTPS)
> - `ufw allow 8091/tcp` (porta pública que seu Kong/Nginx encaminha para PocketBase)
> - `ufw enable`

### Verificar regras
```bash
sudo ufw status verbose
```
---

## 5️⃣ Health‑check da API PocketBase
### 5.1 Tornar o script executável
```bash
chmod +x /home/<USUARIO>/gestaocasa/healthcheck.sh
```
### 5.2 Teste manual
```bash
/home/<USUARIO>/gestaocasa/healthcheck.sh
# Saída esperada: "Health check passed"
```
### 5.3 Agendar a verificação automática
#### Opção A – **systemd timer** (recomendado)
```bash
# Serviço
sudo tee /etc/systemd/system/gestaocasa-health.service > /dev/null <<'EOF'
[Unit]
Description=Health‑check da API GestaoCasa

[Service]
Type=oneshot
ExecStart=/home/<USUARIO>/gestaocasa/healthcheck.sh
EOF

# Timer (a cada 5 minutos)
sudo tee /etc/systemd/system/gestaocasa-health.timer > /dev/null <<'EOF'
[Unit]
Description=Timer para health‑check da API GestaoCasa

[Timer]
OnBootSec=30
OnUnitActiveSec=300   # 5 minutos
Persistent=true

[Install]
WantedBy=timers.target
EOF

# (Re)carregar e habilitar
sudo systemctl daemon-reload
sudo systemctl enable --now gestaocasa-health.timer

# Verificar se está ativo
systemctl list-timers | grep gestaocasa-health
```
#### Opção B – **cron** (alternativa simples)
```bash
crontab -e
# Adicione a linha abaixo (executa a cada 5 minutos)
*/5 * * * * /home/<USUARIO>/gestaocasa/healthcheck.sh >> /var/log/gestaocasa-health.log 2>&1
```
---

## 6️⃣ CI/CD (GitHub Actions) já está pronto
- Arquivo: `.github/workflows/ci.yml`
- Dispara em *push* ou *pull‑request* na branch `main`.
- Etapas:
  1. Checkout do código
  2. `npm ci` (frontend)
  3. Lint (`npm run lint` – opcional)
  4. Build (`npm run build`)
  5. Testes (`npm test` – se houver)
  6. Scaneamento de segredos com **TruffleHog**

### Como ativar
1. Crie um repositório no GitHub e **push** o seu código:
```bash
# Caso ainda não tenha remoto configurado
git remote add origin git@github.com:<SEU_USUARIO>/GestaoCasa.git
git push -u origin main
```
2. Acesse a aba **Actions** do repositório → você verá o workflow rodando.

---

## 7️⃣ Checklist final (confirmação)
- [ ] `fail2ban.conf` copiado para `/etc/fail2ban/jail.local` e serviço reiniciado.
- [ ] `setup_ufw.sh` executado, firewall ativo e regras listadas.
- [ ] `healthcheck.sh` testado manualmente e agendado (systemd ou cron).
- [ ] Workflow CI presente e primeiro *run* concluído com sucesso.

---

## 8️⃣ Próximos passos
- **Item 12 – Testes**: criar testes unitários/componente (Vitest) e garantir que o pipeline CI falhe caso quebrem.
- **Refinamento de segurança** (TLS, cabeçalhos Hardening, etc.) se necessário.

---

*Este guia foi gerado automaticamente a partir dos scripts já presentes no repositório.  Qualquer dúvida ou erro ao executar algum passo, copie‑a mensagem de erro aqui que eu ajudo a corrigir.*