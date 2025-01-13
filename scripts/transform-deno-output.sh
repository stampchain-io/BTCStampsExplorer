#!/bin/bash
set -e
set -u

MODE=$1
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE"

debug() {
  echo "DEBUG: $*" >&2
}

create_diagnostic() {
  local file="$1"
  local line_number="$2"
  local changes="$3"
  
  jq -n \
    --arg file "$file" \
    --arg line "$line_number" \
    --arg changes "$changes" \
    '{
      message: "Formatting issues found. Run `deno fmt` to fix:\n" + $changes,
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
    }'
}

process_fmt_diff() {
  local file=""
  local line_number=""
  local changes=""
  local diagnostics="[]"
  local in_diff=false
  
  while IFS= read -r line; do
    debug "Processing line: $line"
    
    # Skip empty lines and warning messages
    if [[ -z $line || $line =~ ^Warning ]]; then
      continue
    fi
    
    # Handle file path lines
    if [[ $line =~ ^from[[:space:]]*(.+): ]]; then
      # Process previous file if we have changes
      if [[ -n "$changes" && -n "$file" && -n "$line_number" ]]; then
        debug "Creating diagnostic for $file"
        local diagnostic
        diagnostic=$(create_diagnostic "$file" "$line_number" "$changes")
        debug "Created diagnostic: $diagnostic"
        diagnostics=$(echo "$diagnostics" | jq --argjson diag "$diagnostic" '. + [$diag]')
      fi
      
      # Start new file
      local full_path="${BASH_REMATCH[1]}"
      file="${full_path#/home/ubuntu/repos/BTCStampsExplorer/}"
      changes=""
      line_number=""
      in_diff=true
      debug "New file: $file"
      continue
    fi
    
    # Handle diff lines
    if [[ $in_diff == true ]]; then
      if [[ $line =~ ^[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*[-+] ]]; then
        if [[ -z "$line_number" ]]; then
          line_number="${BASH_REMATCH[1]}"
          debug "First line number: $line_number"
        fi
        changes+="$line"$'\n'
        debug "Added line: $line"
      fi
    fi
  done < "$TEMP_FILE"
  
  # Process the last file
  if [[ -n "$changes" && -n "$file" && -n "$line_number" ]]; then
    debug "Creating diagnostic for last file: $file"
    local diagnostic
    diagnostic=$(create_diagnostic "$file" "$line_number" "$changes")
    debug "Created diagnostic: $diagnostic"
    diagnostics=$(echo "$diagnostics" | jq --argjson diag "$diagnostic" '. + [$diag]')
  fi
  
  echo "$diagnostics"
}

if [ "$MODE" = "fmt" ]; then
  debug "Processing fmt output..."
  diagnostics=$(process_fmt_diff)
  debug "Generated diagnostics: $diagnostics"
  json_output=$(jq -n \
    --arg name "denofmt" \
    --arg url "https://deno.land/manual/tools/formatter" \
    --argjson diags "$diagnostics" \
    '{
      source: {name: $name, url: $url},
      diagnostics: $diags
    }')
  echo "$json_output"
elif [ "$MODE" = "lint" ]; then
  json_content=$(grep -v '^Task\|^DEBUG' "$TEMP_FILE" | tr -d '\r' | sed -n '/^{/,/^}/p')
  if [ -z "$json_content" ] || ! echo "$json_content" | jq empty 2>/dev/null; then
    echo "{\"source\":{\"name\":\"denolint\",\"url\":\"https://deno.land/manual/tools/linter\"},\"diagnostics\":[]}"
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
else
  echo "Usage: $0 <lint|fmt>" >&2
  exit 1
fi

rm -f "$TEMP_FILE"
