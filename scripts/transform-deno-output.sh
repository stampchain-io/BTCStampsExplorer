#!/bin/bash

set -e  # Exit on error
set -u  # Exit on undefined variables

echo "Starting transform-deno-output.sh with mode: $1" >&2

MODE=$1
TEMP_FILE=$(mktemp)
echo "Created temp file: $TEMP_FILE" >&2
cat > "$TEMP_FILE"

# Debug: Show input content
echo "Input content preview:" >&2
head -n 5 "$TEMP_FILE" >&2

create_empty_rdjson() {
  local source_name=$1
  local source_url=$2
  echo "{\"source\":{\"name\":\"$source_name\",\"url\":\"$source_url\"},\"diagnostics\":[]}"
}

process_fmt_diff() {
  local diagnostics="[]"
  local current_file=""
  local line_number=0
  local changes=""
  local in_diff=false
  local has_diagnostics=false
  local processed_files=0
  local start_time=$(date +%s)
  
  echo "Starting process_fmt_diff function at $(date)" >&2
  
  # Trap errors and print debug info
  trap 'echo "Error in process_fmt_diff at line $LINENO. Current file: $current_file" >&2' ERR
  
  while IFS= read -r line || [ -n "$line" ]; do  # Handle last line properly
    # Skip warning lines, empty lines, and error summary
    if [[ $line =~ ^Warning || -z $line || $line =~ ^error: ]]; then
      continue
    fi
    
    # Detect start of a new file diff
    if [[ $line =~ ^from[[:space:]](.+): ]]; then
      # Process previous file if exists
      if [[ $in_diff == true && -n $current_file && -n $changes ]]; then
        echo "Processing file $((processed_files + 1)): $current_file" >&2
        local escaped_changes
        escaped_changes=$(echo "$changes" | jq -R -s . 2>&2) || {
          echo "Error escaping changes for $current_file" >&2
          return 1
        }
        echo "Updating diagnostics for $current_file" >&2
        diagnostics=$(echo "$diagnostics" | jq --arg file "$current_file" \
                                         --arg changes "$escaped_changes" \
                                         --arg line "$line_number" \
          '. + [{
            "message": "Formatting issues found:\n" + $changes,
            "location": {
              "path": $file,
              "range": {
                "start": {"line": ($line|tonumber), "column": 1},
                "end": {"line": ($line|tonumber), "column": 1}
              }
            },
            "severity": "WARNING",
            "code": {
              "value": "fmt",
              "url": "https://deno.land/manual/tools/formatter"
            }
          }]')
        has_diagnostics=true
      fi
      
      # Start new file
      current_file="${BASH_REMATCH[1]}"
      changes=""
      in_diff=true
      line_number=0
      continue
    fi
    
    # Extract line number and capture diff lines
    if [[ $in_diff == true && $line =~ ^[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*[-+] ]]; then
      if [[ $line_number == 0 ]]; then
        line_number="${BASH_REMATCH[1]}"
      fi
      changes+="$line"$'\n'
      has_diagnostics=true
    fi
  done < "$TEMP_FILE"
  
  # Process the last file if exists
  if [[ $in_diff == true && -n $current_file && -n $changes ]]; then
    local escaped_changes=$(echo "$changes" | jq -R -s .)
    diagnostics=$(echo "$diagnostics" | jq --arg file "$current_file" \
                                       --arg changes "$escaped_changes" \
                                       --arg line "$line_number" \
      '. + [{
        "message": "Formatting issues found:\n" + $changes,
        "location": {
          "path": $file,
          "range": {
            "start": {"line": ($line|tonumber), "column": 1},
            "end": {"line": ($line|tonumber), "column": 1}
          }
        },
        "severity": "WARNING",
        "code": {
          "value": "fmt",
          "url": "https://deno.land/manual/tools/formatter"
        }
      }]')
    has_diagnostics=true
  fi
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  echo "Finished processing $processed_files files in $duration seconds" >&2
  
  if [[ "$has_diagnostics" == "true" ]]; then
    echo "Returning diagnostics array with findings" >&2
    echo "$diagnostics"
  else
    echo "No diagnostics found, returning empty array" >&2
    echo "[]"
  fi
}

if [ "$MODE" = "lint" ]; then
  # Extract JSON from deno lint output
  json_content=$(grep -v '^Task\|^DEBUG' "$TEMP_FILE" | tr -d '\r' | sed -n '/^{/,/^}/p')
  
  if [ -z "$json_content" ]; then
    create_empty_rdjson "denolint" "https://deno.land/manual/tools/linter"
    rm "$TEMP_FILE" 2>/dev/null
    exit 0
  fi
  
  # Validate and format JSON
  if ! echo "$json_content" | jq empty 2>/dev/null; then
    echo "{\"source\":{\"name\":\"denolint\",\"url\":\"https://deno.land/manual/tools/linter\"},\"diagnostics\":[]}" > "${TEMP_FILE}.json"
    cat "${TEMP_FILE}.json"
    rm "$TEMP_FILE" "${TEMP_FILE}.json" 2>/dev/null
    exit 0
  fi

  # Transform lint output to rdjson
  (echo "{\"source\":{\"name\":\"denolint\",\"url\":\"https://deno.land/manual/tools/linter\"},\"diagnostics\":"; \
   echo "$json_content" | jq -c '[.diagnostics[] | {
      message: .message,
      location: {
        path: (.filename | sub("file://"; "")),
        range: {
          start: {
            line: .range.start.line,
            column: .range.start.col
          },
          end: {
            line: .range.end.line,
            column: .range.end.col
          }
        }
      },
      severity: "WARNING",
      code: {
        value: .code,
        url: ("https://deno.land/manual/tools/linter#" + .code)
      }
    }]'; \
   echo "}")

elif [ "$MODE" = "fmt" ]; then
  # Transform fmt output to rdjson
  (
    echo "{\"source\":{\"name\":\"denofmt\",\"url\":\"https://deno.land/manual/tools/formatter\"},\"diagnostics\":"
    process_fmt_diff
    echo "}" 
  ) | jq '.' > "${TEMP_FILE}.json"
  
  # Validate JSON and output
  if jq empty "${TEMP_FILE}.json" 2>/dev/null; then
    cat "${TEMP_FILE}.json"
  else
    echo "{\"source\":{\"name\":\"denofmt\",\"url\":\"https://deno.land/manual/tools/formatter\"},\"diagnostics\":[]}"
  fi
else
  echo "Usage: $0 <lint|fmt>" >&2
  rm "$TEMP_FILE" 2>/dev/null
  exit 1
fi

rm "$TEMP_FILE" "${TEMP_FILE}.json" 2>/dev/null
