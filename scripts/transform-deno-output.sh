#!/bin/bash

MODE=$1
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE"

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
  
  while IFS= read -r line; do
    # Skip task and debug lines
    if [[ $line =~ ^Task || $line =~ ^DEBUG ]]; then
      continue
    fi
    
    # Detect start of a new file diff
    if [[ $line =~ ^from[[:space:]](.+): ]]; then
      # Process previous file if exists
      if [[ $in_diff == true && -n $current_file && -n $changes ]]; then
        local escaped_changes=$(echo "$changes" | jq -R -s .)
        diagnostics=$(echo "$diagnostics" | jq --arg file "$current_file" \
                                            --arg changes "$escaped_changes" \
                                            --arg line "$line_number" \
          '. + [{
            "message": "\($changes)",
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
    fi
  done < "$1"
  
  # Process the last file if exists
  if [[ $in_diff == true && -n $current_file && -n $changes ]]; then
    local escaped_changes=$(echo "$changes" | jq -R -s .)
    diagnostics=$(echo "$diagnostics" | jq --arg file "$current_file" \
                                        --arg changes "$escaped_changes" \
                                        --arg line "$line_number" \
      '. + [{
        "message": "\($changes)",
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
  fi
  
  echo "$diagnostics"
}

if [ "$MODE" = "lint" ]; then
  # Extract JSON from deno lint output
  json_content=$(grep -v '^Task\|^DEBUG' "$TEMP_FILE" | tr -d '\r' | sed -n '/^{/,/^}/p')
  
  if [ -z "$json_content" ] || ! echo "$json_content" | jq empty 2>/dev/null; then
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
    process_fmt_diff "$TEMP_FILE"
    echo "}"
  ) | jq '.' > "${TEMP_FILE}.json" && cat "${TEMP_FILE}.json"
else
  echo "Usage: $0 <lint|fmt>" >&2
  rm "$TEMP_FILE" 2>/dev/null
  exit 1
fi

rm "$TEMP_FILE" "${TEMP_FILE}.json" 2>/dev/null
