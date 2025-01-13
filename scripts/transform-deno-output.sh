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
  local file=""
  local line_number=""
  local changes=""
  local diagnostics="[]"
  
  while IFS= read -r line; do
    debug "Processing line: $line"
    
    if [[ $line =~ ^from[[:space:]]*(.+): ]]; then
      if [[ -n "$changes" && -n "$file" && -n "$line_number" ]]; then
        debug "Creating diagnostic for $file"
        local diagnostic
        diagnostic=$(jq -n \
          --arg file "$file" \
          --arg message "Formatting issues found. Run 'deno fmt' to fix:" \
          --arg changes "$changes" \
          --arg line "$line_number" \
          '{
            message: ($message + "\n" + $changes),
            location: {
              path: $file,
              range: {
                start: {line: ($line|tonumber), column: 1},
                end: {line: ($line|tonumber), column: 1}
              }
            },
            severity: "WARNING",
            code: {
              value: "fmt",
              url: "https://deno.land/manual/tools/formatter"
            }
          }')
        diagnostics=$(echo "$diagnostics" | jq --argjson diag "$diagnostic" '. + [$diag]')
      fi
      
      file="${BASH_REMATCH[1]}"
      file="${file#/home/ubuntu/repos/BTCStampsExplorer/}"
      changes=""
      line_number=""
      continue
    fi
    
    if [[ $line =~ ^[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*[-+] ]]; then
      if [[ -z "$line_number" ]]; then
        line_number="${BASH_REMATCH[1]}"
      fi
      changes="${changes}${line}\n"
    fi
  done < "$TEMP_FILE"
  
  # Process last file
  if [[ -n "$changes" && -n "$file" && -n "$line_number" ]]; then
    debug "Creating diagnostic for last file $file"
    local diagnostic
    diagnostic=$(jq -n \
      --arg file "$file" \
      --arg message "Formatting issues found. Run 'deno fmt' to fix:" \
      --arg changes "$changes" \
      --arg line "$line_number" \
      '{
        message: ($message + "\n" + $changes),
        location: {
          path: $file,
          range: {
            start: {line: ($line|tonumber), column: 1},
            end: {line: ($line|tonumber), column: 1}
          }
        },
        severity: "WARNING",
        code: {
          value: "fmt",
          url: "https://deno.land/manual/tools/formatter"
        }
      }')
    diagnostics=$(echo "$diagnostics" | jq --argjson diag "$diagnostic" '. + [$diag]')
  fi
  
  echo "$diagnostics"
}

if [ "$MODE" = "lint" ]; then
  json_content=$(grep -v '^Task\|^DEBUG' "$TEMP_FILE" | tr -d '\r' | sed -n '/^{/,/^}/p')
  if [ -z "$json_content" ] || ! echo "$json_content" | jq empty 2>/dev/null; then
    create_empty_rdjson "denolint" "https://deno.land/manual/tools/linter"
    exit 0
  fi
  
  (echo "{\"source\":{\"name\":\"denolint\",\"url\":\"https://deno.land/manual/tools/linter\"},\"diagnostics\":"; \
   echo "$json_content" | jq -c '[.diagnostics[] | {
      message: .message,
      location: {
        path: (.filename | sub("file://"; "")),
        range: {
          start: {line: .range.start.line, column: .range.start.col},
          end: {line: .range.end.line, column: .range.end.col}
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
  diagnostics=$(process_fmt_diff)
  echo "{\"source\":{\"name\":\"denofmt\",\"url\":\"https://deno.land/manual/tools/formatter\"},\"diagnostics\":$diagnostics}"
else
  echo "Usage: $0 <lint|fmt>" >&2
  exit 1
fi

rm -f "$TEMP_FILE"
