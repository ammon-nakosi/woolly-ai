#!/bin/bash

# Counsel Framework Script Logging Template
# This template provides crash-resistant logging for shell scripts

# Script configuration
SCRIPT_NAME="${SCRIPT_NAME:-$(basename "$0" .sh)}"
SCRIPT_VERSION="1.0.0"
START_TIME=$(date +"%Y-%m-%dT%H:%M:%S%z")
START_EPOCH=$(date +%s)

# Parse command line arguments for logging options
NO_LOG=false
VERBOSE=false
DRY_RUN=false
LIMIT=""
for arg in "$@"; do
    case $arg in
        --no-log)
            NO_LOG=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --dry-run|--dryrun)
            DRY_RUN=true
            shift
            ;;
        --limit=*)
            LIMIT="${arg#*=}"
            shift
            ;;
        --help)
            echo "Usage: $0 [--no-log] [--verbose] [--dry-run] [--limit=N] [--help]"
            echo ""
            echo "Options:"
            echo "  --no-log    Disable logging to file (console output only)"
            echo "  --verbose   Enable verbose debug output"
            echo "  --dry-run   Run in dry-run mode (no actual changes)"
            echo "  --limit=N   Limit processing to N items"
            echo "  --help      Show this help message"
            exit 0
            ;;
    esac
done

# Stats tracking
STAT_SUCCESSES=0
STAT_FAILURES=0
STAT_WARNINGS=0

# Setup logging and outcome directories and files
if [ "$NO_LOG" = false ]; then
    BASE_DIR="$HOME/.counsel/scripts/${SCRIPT_NAME}"
    LOG_DIR="${BASE_DIR}/logs"
    OUTCOME_DIR="${BASE_DIR}/outcomes"
    mkdir -p "$LOG_DIR" "$OUTCOME_DIR"
    
    # Build filename suffix based on context
    SUFFIX=""
    [ "$DRY_RUN" = true ] && SUFFIX="${SUFFIX}-dryrun"
    [ -n "$LIMIT" ] && SUFFIX="${SUFFIX}-limit${LIMIT}"
    
    # Create timestamp for files
    TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")
    LOG_FILE="${LOG_DIR}/${SCRIPT_NAME}-${TIMESTAMP}${SUFFIX}.log"
    OUTCOME_FILE="${OUTCOME_DIR}/${SCRIPT_NAME}-${TIMESTAMP}${SUFFIX}.json"
    
    # Create log file and announce locations
    touch "$LOG_FILE"
    echo -e "\033[36mℹ\033[0m Logging to: $LOG_FILE"
    echo -e "\033[36mℹ\033[0m Outcomes to: $OUTCOME_FILE"
    
    # Write initial log entries
    {
        echo "[$(date -Iseconds)] [INFO] Logging to: $LOG_FILE"
        echo "[$(date -Iseconds)] [INFO] Outcomes to: $OUTCOME_FILE"
        echo "[$(date -Iseconds)] [INFO] Script started: $SCRIPT_NAME v$SCRIPT_VERSION"
        echo "[$(date -Iseconds)] [INFO] Run mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")$([ -n "$LIMIT" ] && echo " (limit: $LIMIT)")"
        echo "[$(date -Iseconds)] [INFO] Arguments: $*"
        echo "[$(date -Iseconds)] [INFO] Working directory: $(pwd)"
        echo "[$(date -Iseconds)] [INFO] User: $(whoami)"
        echo "[$(date -Iseconds)] [INFO] Hostname: $(hostname)"
        echo "================================================================================"
    } >> "$LOG_FILE"
    
    # Setup exec to duplicate all output to log file
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)
fi

# Logging functions with stats tracking
log_info() {
    local message="$*"
    echo -e "\033[36mℹ\033[0m $message"
    [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [INFO] $message" >> "$LOG_FILE"
}

log_success() {
    local message="$*"
    echo -e "\033[32m✓\033[0m $message"
    [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [SUCCESS] $message" >> "$LOG_FILE"
    ((STAT_SUCCESSES++))
}

log_warn() {
    local message="$*"
    echo -e "\033[33m⚠\033[0m $message" >&2
    [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [WARN] $message" >> "$LOG_FILE"
    ((STAT_WARNINGS++))
}

log_error() {
    local message="$*"
    echo -e "\033[31m✗\033[0m $message" >&2
    [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [ERROR] $message" >> "$LOG_FILE"
    ((STAT_FAILURES++))
}

log_debug() {
    local message="$*"
    if [ "$VERBOSE" = true ]; then
        echo -e "\033[90m○\033[0m $message"
        [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [DEBUG] $message" >> "$LOG_FILE"
    fi
}

# Function to save outcome JSON
save_outcome() {
    if [ "$NO_LOG" = true ]; then
        return
    fi
    
    local custom_stats="$1"
    local metadata="$2"
    local verbose_data="$3"
    
    END_TIME=$(date +"%Y-%m-%dT%H:%M:%S%z")
    END_EPOCH=$(date +%s)
    DURATION=$((END_EPOCH - START_EPOCH))
    
    # Determine success based on failures
    SUCCESS_BOOL="true"
    [ $STAT_FAILURES -gt 0 ] && SUCCESS_BOOL="false"
    
    # Build the JSON (using printf for portability)
    cat > "$OUTCOME_FILE" <<EOF
{
  "scriptName": "$SCRIPT_NAME",
  "startTime": "$START_TIME",
  "endTime": "$END_TIME",
  "duration": $DURATION,
  "success": $SUCCESS_BOOL,
  "runMode": {
    "dryRun": $([ "$DRY_RUN" = true ] && echo "true" || echo "false"),
    "limit": $([ -n "$LIMIT" ] && echo "$LIMIT" || echo "null"),
    "verbose": $([ "$VERBOSE" = true ] && echo "true" || echo "false")
  },
  "stats": {
    "successes": $STAT_SUCCESSES,
    "failures": $STAT_FAILURES,
    "warnings": $STAT_WARNINGS${custom_stats:+,$custom_stats}
  }${metadata:+,
  "metadata": $metadata}${verbose_data:+,
  "verboseData": $verbose_data}
}
EOF
    
    # Create latest symlink
    ln -sf "$OUTCOME_FILE" "${OUTCOME_DIR}/latest.json" 2>/dev/null || true
    
    echo -e "\033[36mℹ\033[0m Outcome saved to: $OUTCOME_FILE"
}

# Cleanup function to be called on script exit
cleanup() {
    local exit_code=$?
    
    # Save outcome before closing
    save_outcome
    
    if [ "$NO_LOG" = false ]; then
        {
            echo "================================================================================"
            if [ $exit_code -eq 0 ]; then
                echo "[$(date -Iseconds)] [INFO] Script completed successfully"
            else
                echo "[$(date -Iseconds)] [ERROR] Script failed with exit code: $exit_code"
            fi
        } >> "$LOG_FILE"
    fi
}

# Register cleanup function
trap cleanup EXIT

# Error handler
handle_error() {
    local line_no=$1
    local exit_code=$2
    log_error "Error occurred in script at line $line_no with exit code $exit_code"
    exit $exit_code
}

# Register error handler
trap 'handle_error ${LINENO} $?' ERR

# Set error handling options
set -eE  # Exit on error and inherit ERR trap
set -u   # Exit on undefined variable
set -o pipefail  # Pipe failures cause script to exit

# ============================================================================
# SCRIPT IMPLEMENTATION STARTS HERE
# ============================================================================

log_info "Starting $SCRIPT_NAME execution"

# Example usage of logging functions:
# log_info "Processing data..."
# log_success "Data processed successfully"
# log_warn "Configuration file not found, using defaults"
# log_error "Failed to connect to database"
# log_debug "Variable value: $SOME_VAR"

# Your script logic goes here...

log_success "Script completed successfully"