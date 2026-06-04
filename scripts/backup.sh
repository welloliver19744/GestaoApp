#!/bin/bash
set -e

# Backup automático do pb_data (PocketBase)
# Uso: ./backup.sh                    # Faz backup agora
# Uso: ./backup.sh restore ARQUIVO    # Restaura backup

BACKUP_DIR="$HOME/gestaocasa/backups"
DATA_DIR="$HOME/gestaocasa/pocketbase/pb_data"
RETENTION_DAYS=14
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
LOG_FILE="$BACKUP_DIR/backup.log"

mkdir -p "$BACKUP_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

do_backup() {
    log "Iniciando backup do pb_data (zero downtime)..."

    # Cópia a quente via docker cp (SQLite WAL suporta leitura concorrente)
    TEMP_DIR=$(mktemp -d)
    docker cp "gestaocasa-pocketbase:/pb_data/." "$TEMP_DIR/pb_data/"

    # Compacta
    BACKUP_FILE="$BACKUP_DIR/pb_data-$TIMESTAMP.tar.gz"
    cd "$TEMP_DIR"
    tar -czf "$BACKUP_FILE" pb_data/
    cd "$HOME"

    # Limpa temp
    rm -rf "$TEMP_DIR"

    # Remove backups antigos
    find "$BACKUP_DIR" -name "pb_data-*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null

    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    TOTAL=$(find "$BACKUP_DIR" -name "pb_data-*.tar.gz" | wc -l)
    log "Backup concluído: $BACKUP_FILE ($SIZE) | Total de backups: $TOTAL | Retenção: $RETENTION_DAYS dias"
}

do_restore() {
    RESTORE_FILE="$1"
    if [ ! -f "$RESTORE_FILE" ]; then
        log "ERRO: Arquivo de restore não encontrado: $RESTORE_FILE"
        exit 1
    fi

    log "Restaurando backup: $RESTORE_FILE"

    # Para o container
    docker stop gestaocasa-pocketbase

    # Faz backup do atual antes de restaurar (rollback)
    ROLLBACK_DIR="$BACKUP_DIR/pre-restore"
    mkdir -p "$ROLLBACK_DIR"
    cp -a "$DATA_DIR" "$ROLLBACK_DIR/pb_data-$(date +%Y-%m-%d_%H-%M-%S)"

    # Remove dados atuais e extrai o backup
    rm -rf "$DATA_DIR"
    mkdir -p "$DATA_DIR"
    tar -xzf "$RESTORE_FILE" -C "$DATA_DIR" --strip-components=1

    # Ajusta permissões
    chown -R root:root "$DATA_DIR" 2>/dev/null || true

    # Reinicia
    docker start gestaocasa-pocketbase

    log "Restore concluído! Backup anterior salvo em: $ROLLBACK_DIR"
}

do_status() {
    TOTAL=$(find "$BACKUP_DIR" -name "pb_data-*.tar.gz" | wc -l)
    LATEST=$(ls -t "$BACKUP_DIR"/pb_data-*.tar.gz 2>/dev/null | head -1)
    SIZE="N/A"
    DATE="N/A"

    if [ -n "$LATEST" ]; then
        SIZE=$(du -h "$LATEST" | cut -f1)
        DATE=$(basename "$LATEST" | sed 's/pb_data-//' | sed 's/\.tar\.gz//')
    fi

    echo "Status do Backup"
    echo "Total de backups: $TOTAL"
    echo "Último backup: $DATE"
    echo "Tamanho: $SIZE"
    echo "Diretório: $BACKUP_DIR"
    echo "Retenção: $RETENTION_DAYS dias"
}

case "${1:-backup}" in
    backup)
        do_backup
        ;;
    restore)
        do_restore "$2"
        ;;
    status)
        do_status
        ;;
    *)
        echo "Uso: $0 {backup|restore ARQUIVO|status}"
        exit 1
        ;;
esac
