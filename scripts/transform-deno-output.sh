#!/bin/bash

set -e
set -u

MODE=$1
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE"

debug() {
  echo "DEBUG: $*" >&2
}

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
  
  while IFS= read -r line || [ -n "$line" ]; do
    debug "Processing line: $line"
    
    # Skip empty lines and warning messages
    if [[ -z $line || $line =~ ^Warning ]]; then
      continue
    fi
    
    # Handle file path lines
    if [[ $line =~ ^from[[:space:]]*(.+): ]]; then
      # Process previous file if we have changes
      if [[ -n $changes && -n $current_file ]]; then
        debug "Creating diagnostic for $current_file"
        local escaped_changes
        escaped_changes=$(printf '%s' "$changes" | sed 's/"/\\"/g')
        local new_diagnostic
        new_diagnostic=$(jq -n \
          --arg file "$current_file" \
          --arg message "Formatting issues found:" \
          --arg changes "$escaped_changes" \
          --arg line "$line_number" \
          '{
            message: ($message + "\n" + $changes),
            location: {
              path: $file,
              range: {
                start: {line: ($line|tonumber), column: 1},
                end: {line: ($line|tonumber), column: 80}
              }
            },
            severity: "WARNING",
            code: {
              value: "fmt",
              url: "https://deno.land/manual/tools/formatter"
            }
          }')
        diagnostics=$(echo "$diagnostics" | jq --argjson diag "$new_diagnostic" '. + [$diag]')
      fi
      
      # Start new file
      local full_path="${BASH_REMATCH[1]}"
      current_file="${full_path#/home/ubuntu/repos/BTCStampsExplorer/}"
      changes=""
      line_number=0
      in_diff=true
      debug "New file: $current_file"
      continue
    fi
    
    # Handle diff lines
    if [[ $in_diff == true ]]; then
      if [[ $line =~ ^[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*[-+] ]]; then
        # Set initial line number
        if [[ $line_number == 0 ]]; then
          line_number="${BASH_REMATCH[1]}"
          debug "First line number: $line_number"
        fi
        changes+="$line"$'\n'
        debug "Added line: $line"
      fi
    fi
    
    # Handle error message - create diagnostic for current file
    if [[ $line =~ ^error:[[:space:]]*Found[[:space:]]*[0-9]+[[:space:]]*not[[:space:]]*formatted ]]; then
      if [[ -n $changes && -n $current_file ]]; then
        debug "Creating diagnostic for $current_file on error"
        local escaped_changes
        escaped_changes=$(printf '%s' "$changes" | sed 's/"/\\"/g')
        local new_diagnostic
        new_diagnostic=$(jq -n \
          --arg file "$current_file" \
          --arg message "Formatting issues found:" \
          --arg changes "$escaped_changes" \
          --arg line "$line_number" \
          '{
            message: ($message + "\n" + $changes),
            location: {
              path: $file,
              range: {
                start: {line: ($line|tonumber), column: 1},
                end: {line: ($line|tonumber), column: 80}
              }
            },
            severity: "WARNING",
            code: {
              value: "fmt",
              url: "https://deno.land/manual/tools/formatter"
            }
          }')
        diagnostics=$(echo "$diagnostics" | jq --argjson diag "$new_diagnostic" '. + [$diag]')
      fi
    fi
  done < "$TEMP_FILE"
  
  echo "$diagnostics"
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
    create_empty_rdjson "denolint" "https://deno.land/manual/tools/linter"
    rm "$TEMP_FILE" 2>/dev/null
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
    create_empty_rdjson "denofmt" "https://deno.land/manual/tools/formatter"
  fi
else
  echo "Usage: $0 <lint|fmt>" >&2
  rm "$TEMP_FILE" 2>/dev/null
  exit 1
fi

rm "$TEMP_FILE" "${TEMP_FILE}.json" 2>/dev/null
