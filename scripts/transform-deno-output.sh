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
  local file=""
  local changes=""
  local in_diff=false
  local current_line=""
  local diagnostics="[]"
  local start_line=0
  
  while IFS= read -r line; do
    # Skip debug and info lines, but keep error lines
    if [[ $line =~ ^DEBUG || $line =~ ^Task || $line =~ ^Checked ]]; then
      continue
    fi
    
    # Capture error lines for formatting issues
    if [[ $line =~ ^error: ]]; then
      file=$(echo "$line" | sed -n 's/^error: \(.*\) is not formatted$/\1/p')
      if [[ -n $file ]]; then
        diagnostics=$(echo "$diagnostics" | jq --arg file "$file" \
          '. + [{
            "message": "File is not properly formatted",
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
      continue
    fi
    
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
