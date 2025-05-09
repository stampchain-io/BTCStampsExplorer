#!/bin/bash
set -e
set -u

MODE=$1
TEMP_FILE=$(mktemp)
cat > "$TEMP_FILE"

debug() {
  echo "DEBUG: $*" >&2
}

process_fmt_diff() {
  local diagnostics="[]"
  local current_file=""
  local line_number=""
  local changes=""
  local in_diff=false
  
  while IFS= read -r line; do
    debug "Processing line: $line"
    
    # Skip empty lines and warning messages
    if [[ -z $line || $line =~ ^Warning ]]; then
      debug "Skipping empty/warning line"
      continue
    fi
    
    # Handle file path lines
    if [[ $line =~ ^from[[:space:]]*(.+): ]]; then
      debug "Found file header line"
      # Process previous file if we have changes
      if [[ -n $changes && -n $current_file && -n $line_number ]]; then
        debug "Processing previous file: $current_file"
        debug "Changes: $changes"
        debug "Line number: $line_number"
        
        local escaped_changes
        escaped_changes=$(echo -n "$changes" | jq -Rs .)
        local new_diagnostic
        new_diagnostic=$(jq -n \
          --arg file "$current_file" \
          --arg changes "$escaped_changes" \
          --arg line "$line_number" \
          '{
            message: "Formatting issues found. Run `deno fmt` to fix:" + "\n" + $changes,
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
        debug "Created diagnostic: $new_diagnostic"
        diagnostics=$(echo "$diagnostics" | jq --argjson diag "$new_diagnostic" '. + [$diag]')
      fi
      
      # Start new file
      local full_path="${BASH_REMATCH[1]}"
      current_file="${full_path#/home/ubuntu/repos/BTCStampsExplorer/}"
      changes=""
      line_number=""
      in_diff=true
      debug "New file: $current_file"
      continue
    fi
    
    # Handle diff lines
    if [[ $in_diff == true ]]; then
      if [[ $line =~ ^[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*[-+] ]]; then
        if [[ -z $line_number ]]; then
          line_number="${BASH_REMATCH[1]}"
          debug "First line number: $line_number"
        fi
        changes+="$line"$'\n'
        debug "Added line to changes: $line"
      fi
    fi
  done < "$TEMP_FILE"
  
  # Process the last file
  if [[ -n $changes && -n $current_file && -n $line_number ]]; then
    debug "Processing final file: $current_file"
    debug "Final changes: $changes"
    debug "Final line number: $line_number"
    
    local escaped_changes
    escaped_changes=$(echo -n "$changes" | jq -Rs .)
    local new_diagnostic
    new_diagnostic=$(jq -n \
      --arg file "$current_file" \
      --arg changes "$escaped_changes" \
      --arg line "$line_number" \
      '{
        message: "Formatting issues found. Run `deno fmt` to fix:" + "\n" + $changes,
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
    debug "Created final diagnostic: $new_diagnostic"
    diagnostics=$(echo "$diagnostics" | jq --argjson diag "$new_diagnostic" '. + [$diag]')
  fi
  
  debug "Final diagnostics array: $diagnostics"
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