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
  # Extract formatting issues from deno fmt output
  local diagnostics="[]"
  local current_file=""
  local line_number=0
  
  while IFS= read -r line; do
    # Skip task and debug lines
    if [[ $line =~ ^Task || $line =~ ^DEBUG ]]; then
      continue
    fi
    
    # Extract file path
    if [[ $line =~ ^from[[:space:]](.*):[[:space:]]*$ ]]; then
      current_file="${BASH_REMATCH[1]}"
      continue
    fi
    
    # Extract line number and changes
    if [[ $line =~ ^[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*[-+] ]]; then
      line_number="${BASH_REMATCH[1]}"
      local old_line=""
      local new_line=""
      
      # If this is a removal line, store it and read the next line for the addition
      if [[ $line =~ \|[[:space:]]*-(.*) ]]; then
        old_line="${BASH_REMATCH[1]}"
        read -r next_line
        if [[ $next_line =~ \|[[:space:]]*\+(.*) ]]; then
          new_line="${BASH_REMATCH[1]}"
          
          # Create a diagnostic entry for this change
          diagnostics=$(echo "$diagnostics" | jq --arg file "$current_file" \
            --arg line "$line_number" --arg old "$old_line" --arg new "$new_line" \
            '. + [{
              "message": "Formatting issue:\n- " + $old + "\n+ " + $new,
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
      fi
    fi
  done < "$1"
    fi
  done < "$1"
    
    # Detect start of a new file diff
    if [[ $line =~ ^from[[:space:]]/.*: ]]; then
      # Process previous file if exists
      if [[ $in_diff == true && -n $file && -n $changes ]]; then
        local escaped_changes=$(echo "$changes" | jq -R -s '.')
        diagnostics=$(echo "$diagnostics" | jq --arg file "$file" --arg changes "$escaped_changes" --arg start_line "$start_line" \
          '. + [{
            "message": "File is not properly formatted:\n" + $changes,
            "location": {
              "path": $file,
              "range": {
                "start": {"line": ($start_line|tonumber), "column": 1},
                "end": {"line": ($start_line|tonumber), "column": 1}
              }
            },
            "severity": "WARNING",
            "code": {
              "value": "fmt",
              "url": "https://deno.land/manual/tools/formatter"
            }
          }]')
      fi
      
      # Extract new file path
      file=$(echo "$line" | sed -n 's/^from \(.*\):/\1/p')
      changes=""
      in_diff=true
      start_line=0
      continue
    fi
    
    # Extract line number and capture diff lines
    if [[ $in_diff == true && $line =~ ^[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*[-+] ]]; then
      if [[ $start_line == 0 ]]; then
        start_line=${BASH_REMATCH[1]}
      fi
      changes+="$line"$'\n'
    fi
  done < "$1"
  
  # Process the last file if exists
  if [[ $in_diff == true && -n $file && -n $changes ]]; then
    local escaped_changes=$(echo "$changes" | jq -R -s '.')
    diagnostics=$(echo "$diagnostics" | jq --arg file "$file" --arg changes "$escaped_changes" \
      '. + [{
        "message": "File is not properly formatted:\n" + $changes,
        "location": {
          "path": $file,
          "range": {
            "start": {"line": 1, "column": 1},
            "end": {"line": 1, "column": 1}
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
  json_content=$(sed -n '/^{/,/^}/p' "$TEMP_FILE" | sed 's/^Task check:lint:debug$//' | tr -d '\r')
  
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
  )
else
  echo "Usage: $0 <lint|fmt>" >&2
  rm "$TEMP_FILE"
  exit 1
fi

rm "$TEMP_FILE" "${TEMP_FILE}.json" 2>/dev/null
