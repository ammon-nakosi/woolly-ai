#!/bin/bash

# Production Script Template for Woolly Framework
# 
# This template implements all required patterns from docs/SCRIPT-MODE-GUIDELINES.md
# Features: dry-run mode, limits, batching, rate limiting, progress tracking, outcomes
#
# Usage:
#   ./script.sh --dry-run --limit 10                    # Test with 10 items
#   ./script.sh --live --limit 100 --batch-size 20      # Live run, limited
#   ./script.sh --live --force                           # Full production run

# ============================================================================
# CONFIGURATION
# ============================================================================

SCRIPT_NAME="${SCRIPT_NAME:-production-script}"  # Update this
SCRIPT_VERSION="1.0.0"
START_TIME=$(date +"%Y-%m-%dT%H:%M:%S%z")
START_EPOCH=$(date +%s)

# Default processing parameters
DEFAULT_BATCH_SIZE=10
DEFAULT_DELAY_BETWEEN_ITEMS=200      # milliseconds
DEFAULT_DELAY_BETWEEN_BATCHES=1000   # milliseconds
DEFAULT_PROGRESS_INTERVAL=100        # Show progress every N items

# ============================================================================
# ARGUMENT PARSING
# ============================================================================

# Initialize flags with defaults
DRY_RUN=true  # Default to dry-run for safety
LIVE=false
FORCE=false
LIMIT=""
BATCH_SIZE=$DEFAULT_BATCH_SIZE
DELAY_ITEMS=$DEFAULT_DELAY_BETWEEN_ITEMS
DELAY_BATCHES=$DEFAULT_DELAY_BETWEEN_BATCHES
PROGRESS_INTERVAL=$DEFAULT_PROGRESS_INTERVAL
VERBOSE=false
NO_LOG=false
INPUT_FILE=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            LIVE=false
            shift
            ;;
        --live)
            LIVE=true
            DRY_RUN=false
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --limit)
            LIMIT="$2"
            shift 2
            ;;
        --batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        --delay-items)
            DELAY_ITEMS="$2"
            shift 2
            ;;
        --delay-batches)
            DELAY_BATCHES="$2"
            shift 2
            ;;
        --progress-interval)
            PROGRESS_INTERVAL="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --no-log)
            NO_LOG=true
            shift
            ;;
        --help)
            cat <<EOF
$SCRIPT_NAME v$SCRIPT_VERSION

Usage: $0 [options] [input-file]

Safety Flags:
  --dry-run           Run in simulation mode (default)
  --live              Execute actual changes
  --force             Skip confirmation prompts

Processing Control:
  --limit N           Process maximum N items
  --batch-size N      Items per batch (default: $DEFAULT_BATCH_SIZE)
  --delay-items MS    Delay between items in ms (default: $DEFAULT_DELAY_BETWEEN_ITEMS)
  --delay-batches MS  Delay between batches in ms (default: $DEFAULT_DELAY_BETWEEN_BATCHES)

Monitoring:
  --verbose           Show detailed debug output
  --no-log            Disable file logging
  --progress-interval N  Update progress every N items (default: $DEFAULT_PROGRESS_INTERVAL)

Standard:
  --help              Show this help message

Testing Progression:
  1. $0 --dry-run --limit 5
  2. $0 --dry-run --limit 100
  3. $0 --live --limit 10
  4. $0 --live --limit 100
  5. $0 --live

Logs saved to: ~/.woolly/scripts/$SCRIPT_NAME/logs/
Outcomes saved to: ~/.woolly/scripts/$SCRIPT_NAME/outcomes/
EOF
            exit 0
            ;;
        *)
            # Assume it's the input file if not a flag
            if [[ ! "$1" =~ ^-- ]]; then
                INPUT_FILE="$1"
            fi
            shift
            ;;
    esac
done

# Safety check: warn if neither --dry-run nor --live specified
if [ "$LIVE" = false ] && [ "$DRY_RUN" = true ]; then
    echo -e "\033[33m⚠\033[0m  Neither --dry-run nor --live explicitly set. Defaulting to --dry-run for safety."
fi

# ============================================================================
# STATS TRACKING
# ============================================================================

STAT_SUCCESSES=0
STAT_FAILURES=0
STAT_WARNINGS=0
STAT_SKIPPED=0
TOTAL_PROCESSED=0

# Arrays to track results (for verbose output)
declare -a SUCCEEDED_IDS
declare -a FAILED_IDS

# ============================================================================
# SETUP LOGGING
# ============================================================================

if [ "$NO_LOG" = false ]; then
    BASE_DIR="$HOME/.woolly/scripts/${SCRIPT_NAME}"
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
        echo "[$(date -Iseconds)] [INFO] Script started: $SCRIPT_NAME v$SCRIPT_VERSION"
        echo "[$(date -Iseconds)] [INFO] Run mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")"
        [ -n "$LIMIT" ] && echo "[$(date -Iseconds)] [INFO] Limit: $LIMIT items"
        echo "[$(date -Iseconds)] [INFO] Batch size: $BATCH_SIZE"
        echo "[$(date -Iseconds)] [INFO] Delays: ${DELAY_ITEMS}ms between items, ${DELAY_BATCHES}ms between batches"
        echo "[$(date -Iseconds)] [INFO] Working directory: $(pwd)"
        echo "================================================================================"
    } >> "$LOG_FILE"
    
    # Setup exec to duplicate all output to log file
    exec 1> >(tee -a "$LOG_FILE")
    exec 2> >(tee -a "$LOG_FILE" >&2)
fi

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================

log_info() {
    echo -e "\033[36mℹ\033[0m $*"
    [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [INFO] $*" >> "$LOG_FILE"
}

log_success() {
    echo -e "\033[32m✓\033[0m $*"
    [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [SUCCESS] $*" >> "$LOG_FILE"
    ((STAT_SUCCESSES++))
}

log_warn() {
    echo -e "\033[33m⚠\033[0m $*" >&2
    [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [WARN] $*" >> "$LOG_FILE"
    ((STAT_WARNINGS++))
}

log_error() {
    echo -e "\033[31m✗\033[0m $*" >&2
    [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [ERROR] $*" >> "$LOG_FILE"
    ((STAT_FAILURES++))
}

log_debug() {
    if [ "$VERBOSE" = true ]; then
        echo -e "\033[90m○\033[0m $*"
        [ "$NO_LOG" = false ] && echo "[$(date -Iseconds)] [DEBUG] $*" >> "$LOG_FILE"
    fi
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

# Sleep for milliseconds
sleep_ms() {
    local ms=$1
    if [ "$ms" -gt 0 ]; then
        sleep "$(echo "scale=3; $ms/1000" | bc)"
    fi
}

# Format duration in seconds to human readable
format_duration() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local minutes=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))
    
    if [ $hours -gt 0 ]; then
        echo "${hours}h ${minutes}m ${secs}s"
    elif [ $minutes -gt 0 ]; then
        echo "${minutes}m ${secs}s"
    else
        echo "${secs}s"
    fi
}

# Show progress
show_progress() {
    local current=$1
    local total=$2
    
    if [ $total -eq 0 ]; then
        return
    fi
    
    local percent=$((current * 100 / total))
    local elapsed=$(($(date +%s) - START_EPOCH))
    
    if [ $elapsed -gt 0 ]; then
        local rate=$(echo "scale=1; $current / $elapsed" | bc)
        local remaining=$(echo "scale=0; ($total - $current) / $rate" | bc 2>/dev/null || echo "0")
        
        log_info "Progress: $current/$total (${percent}%) | Rate: ${rate}/sec | ETA: $(format_duration $remaining)"
    else
        log_info "Progress: $current/$total (${percent}%)"
    fi
}

# Confirm execution
confirm_execution() {
    local item_count=$1
    
    if [ "$DRY_RUN" = true ] || [ "$FORCE" = true ]; then
        return
    fi
    
    log_warn ""
    log_warn "⚠️  WARNING: This will execute in LIVE mode!"
    log_warn "About to process $item_count items"
    log_warn ""
    log_warn "Starting in 5 seconds... (Press Ctrl+C to cancel)"
    
    for i in 5 4 3 2 1; do
        echo -ne "\r$i..."
        sleep 1
    done
    echo -ne "\r     \r"
    log_info "Starting execution..."
    echo ""
}

# Save outcome JSON
save_outcome() {
    if [ "$NO_LOG" = true ]; then
        return
    fi
    
    END_TIME=$(date +"%Y-%m-%dT%H:%M:%S%z")
    END_EPOCH=$(date +%s)
    DURATION=$((END_EPOCH - START_EPOCH))
    
    # Calculate success rate
    local total_items=$((STAT_SUCCESSES + STAT_FAILURES))
    local success_rate=0
    if [ $total_items -gt 0 ]; then
        success_rate=$((STAT_SUCCESSES * 100 / total_items))
    fi
    
    # Determine overall success
    SUCCESS_BOOL="true"
    [ $STAT_FAILURES -gt 0 ] && SUCCESS_BOOL="false"
    
    # Build the JSON
    cat > "$OUTCOME_FILE" <<EOF
{
  "scriptName": "$SCRIPT_NAME",
  "scriptVersion": "$SCRIPT_VERSION",
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
    "warnings": $STAT_WARNINGS,
    "skipped": $STAT_SKIPPED,
    "totalProcessed": $TOTAL_PROCESSED,
    "successRate": "${success_rate}%",
    "batchSize": $BATCH_SIZE
  },
  "metadata": {
    "inputFile": "$([ -n "$INPUT_FILE" ] && echo "\"$INPUT_FILE\"" || echo "null")",
    "workingDirectory": "$(pwd)"
  }
}
EOF
    
    # Create latest symlink
    ln -sf "$OUTCOME_FILE" "${OUTCOME_DIR}/latest.json" 2>/dev/null || true
    
    log_info "Outcome saved to: $OUTCOME_FILE"
}

# ============================================================================
# DATA LOADING
# ============================================================================

load_items() {
    local input_file=$1
    
    # Example: Load items from file or generate sample data
    # Replace with your actual data loading logic
    
    if [ -n "$input_file" ] && [ -f "$input_file" ]; then
        log_info "Loading items from file: $input_file"
        # Read file line by line (adjust based on your file format)
        mapfile -t ITEMS < "$input_file"
    else
        log_info "Using sample data for demonstration"
        # Generate sample items
        ITEMS=()
        for i in $(seq 1 100); do
            ITEMS+=("item-$i")
        done
    fi
    
    log_info "Loaded ${#ITEMS[@]} items"
}

# ============================================================================
# PROCESSING LOGIC
# ============================================================================

process_item() {
    local item=$1
    
    # Replace with your actual processing logic
    
    if [ "$DRY_RUN" = true ]; then
        log_debug "[DRY RUN] Would process: $item"
        # Simulate processing time
        sleep_ms 50
        # Simulate random success/failure
        if [ $((RANDOM % 10)) -gt 0 ]; then
            return 0  # Success
        else
            return 1  # Failure
        fi
    fi
    
    # Actual processing logic here
    log_debug "Processing: $item"
    
    # Example: API call, database update, etc.
    sleep_ms 50  # Simulate work
    
    # Return success or failure
    return 0
}

# ============================================================================
# CLEANUP
# ============================================================================

cleanup() {
    local exit_code=$?
    
    # Save outcome
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

# Register cleanup
trap cleanup EXIT

# Error handler
handle_error() {
    local line_no=$1
    local exit_code=$2
    log_error "Error occurred at line $line_no with exit code $exit_code"
    exit $exit_code
}

# Register error handler
trap 'handle_error ${LINENO} $?' ERR

# Set error handling options
set -eE  # Exit on error and inherit ERR trap
set -u   # Exit on undefined variable
set -o pipefail  # Pipe failures cause script to exit

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    log_info "Starting $SCRIPT_NAME v$SCRIPT_VERSION"
    log_info "Mode: $([ "$DRY_RUN" = true ] && echo "DRY RUN" || echo "LIVE")"
    [ -n "$LIMIT" ] && log_info "Limit: $LIMIT items"
    log_info "Batch size: $BATCH_SIZE"
    log_info "Delays: ${DELAY_ITEMS}ms between items, ${DELAY_BATCHES}ms between batches"
    echo ""
    
    # Load items
    load_items "$INPUT_FILE"
    
    # Apply limit if specified
    if [ -n "$LIMIT" ] && [ "$LIMIT" -lt "${#ITEMS[@]}" ]; then
        ITEMS=("${ITEMS[@]:0:$LIMIT}")
        log_info "Limited to first $LIMIT items"
    fi
    
    local total_items=${#ITEMS[@]}
    
    if [ $total_items -eq 0 ]; then
        log_warn "No items to process"
        return
    fi
    
    # Confirmation prompt
    confirm_execution $total_items
    
    # Process in batches
    local total_batches=$(((total_items + BATCH_SIZE - 1) / BATCH_SIZE))
    local batch_num=0
    
    for ((i = 0; i < total_items; i += BATCH_SIZE)); do
        batch_num=$((batch_num + 1))
        local batch_end=$((i + BATCH_SIZE))
        [ $batch_end -gt $total_items ] && batch_end=$total_items
        
        log_info ""
        log_info "Processing batch $batch_num/$total_batches ($(($batch_end - i)) items)"
        
        # Process items in batch
        for ((j = i; j < batch_end; j++)); do
            local item="${ITEMS[$j]}"
            TOTAL_PROCESSED=$((TOTAL_PROCESSED + 1))
            
            # Show progress at intervals
            if [ $((TOTAL_PROCESSED % PROGRESS_INTERVAL)) -eq 0 ] || [ $TOTAL_PROCESSED -eq $total_items ]; then
                show_progress $TOTAL_PROCESSED $total_items
            fi
            
            # Process item
            if process_item "$item"; then
                log_success "$item"
                SUCCEEDED_IDS+=("$item")
            else
                log_error "$item"
                FAILED_IDS+=("$item")
            fi
            
            # Delay between items
            if [ $DELAY_ITEMS -gt 0 ] && [ $TOTAL_PROCESSED -lt $total_items ]; then
                sleep_ms $DELAY_ITEMS
            fi
        done
        
        # Delay between batches
        if [ $batch_num -lt $total_batches ] && [ $DELAY_BATCHES -gt 0 ]; then
            log_debug "Waiting ${DELAY_BATCHES}ms before next batch..."
            sleep_ms $DELAY_BATCHES
        fi
    done
    
    # Final summary
    echo ""
    echo "============================================================"
    log_info "EXECUTION SUMMARY"
    echo "============================================================"
    log_success "Succeeded: $STAT_SUCCESSES"
    [ $STAT_FAILURES -gt 0 ] && log_error "Failed: $STAT_FAILURES"
    [ $STAT_SKIPPED -gt 0 ] && log_warn "Skipped: $STAT_SKIPPED"
    
    local duration=$(($(date +%s) - START_EPOCH))
    log_info "Total time: $(format_duration $duration)"
    if [ $duration -gt 0 ]; then
        local rate=$(echo "scale=1; $total_items / $duration" | bc)
        log_info "Average rate: ${rate} items/sec"
    fi
    
    echo ""
    log_success "✅ Script completed successfully"
}

# Run main function
main "$@"