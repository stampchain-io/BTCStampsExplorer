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
  
  # Debug function
  debug() {
    echo "DEBUG: $*" >&2
  }
  
  # Function to create a diagnostic entry
  create_diagnostic() {
    local file="$1"
    local line="$2"
    local changes="$3"
    
    debug "Creating diagnostic for file: $file"
    debug "Line number: $line"
    debug "Changes:"
    echo "$changes" >&2
    
    # Process and escape changes
    local processed_changes=""
    while IFS= read -r change_line; do
      if [[ -n $change_line ]]; then
        processed_changes+="$change_line"$'\n'
      fi
    done <<< "$changes"
    
    local escaped_changes
    escaped_changes=$(printf '%s' "$processed_changes" | jq -Rs .)
    
    debug "Escaped changes: $escaped_changes"
    
    # Create the diagnostic JSON
    local new_diagnostic
    new_diagnostic=$(jq -n \
      --arg file "$file" \
      --arg message "Formatting issues found. Run \`deno fmt\` to fix:" \
      --arg changes "$processed_changes" \
      --arg line "$line" \
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
    
    # Validate and return the diagnostic
    if echo "$new_diagnostic" | jq empty > /dev/null 2>&1; then
      echo "$new_diagnostic"
      return 0
    else
      debug "Invalid diagnostic JSON:"
      echo "$new_diagnostic" >&2
      return 1
    fi
  }
  
  debug "Starting process_fmt_diff"
  
  while IFS= read -r line || [ -n "$line" ]; do
    debug "Processing line: $line"
    
    # Skip warning lines and empty lines
    if [[ $line =~ ^Warning || -z $line ]]; then
      debug "Skipping warning/empty line"
      continue
    fi
    
    # Skip error summary only if it's not a formatting error
    if [[ $line =~ ^error: && ! $line =~ ^error:[[:space:]]*Found[[:space:]]*[0-9]+[[:space:]]*not[[:space:]]*formatted ]]; then
      debug "Skipping non-formatting error line"
      continue
    fi
    
    # Detect start of a new file diff
    if [[ $line =~ ^from[[:space:]]*(/home/ubuntu/repos/BTCStampsExplorer/)?(.+): ]]; then
      local matched_path="${BASH_REMATCH[2]}"
      debug "Found file marker: $matched_path"
      # Process previous file if exists
      if [[ $in_diff == true && -n $current_file && -n $changes ]]; then
        debug "Processing previous file: $current_file"
        
        local new_diagnostic
        if new_diagnostic=$(create_diagnostic "$current_file" "$line_number" "$changes"); then
          debug "Valid diagnostic created, adding to array"
          diagnostics=$(echo "$diagnostics" | jq --argjson diag "$new_diagnostic" '. + [$diag]')
          has_diagnostics=true
          ((processed_files++))
          debug "Current diagnostics array: $(echo "$diagnostics" | jq -c '.')"
        else
          debug "Failed to create diagnostic, skipping"
        fi
      fi
      
      # Use the captured relative path
      current_file="$matched_path"
      debug "Setting current file to: $current_file"
      debug "New current file (relative path): $current_file"
      changes=""
      in_diff=true
      line_number=0
      continue
    fi
    
    # Extract line number and capture diff lines
    if [[ $in_diff == true ]]; then
      # Match lines with line numbers and diff markers
      if [[ $line =~ ^[[:space:]]*([0-9]+)[[:space:]]*\|[[:space:]]*[-+] ]]; then
        local current_line="${BASH_REMATCH[1]}"
        debug "Found line with number: $current_line"
        
        # Set initial line number if not set
        if [[ $line_number == 0 ]]; then
          line_number="$current_line"
          debug "Setting first line number: $line_number"
        fi
        
        # Add the line with proper formatting
        changes+="$line"$'\n'
        has_diagnostics=true
        debug "Added line with number to changes"
      elif [[ $line =~ ^[[:space:]]*\|[[:space:]]*[-+] ]]; then
        # Capture diff lines without line numbers
        debug "Found diff line without line number"
        changes+="$line"$'\n'
        has_diagnostics=true
        debug "Added line without number to changes"
      fi
      
      # If we have changes, log the current state
      if [[ -n "$changes" ]]; then
        debug "Current file: $current_file"
        debug "Current line number: $line_number"
        debug "Current changes accumulated:"
        echo "$changes" >&2
      fi
    fi
  done < "$TEMP_FILE"
  
  # Process the last file
  if [[ $in_diff == true && -n $current_file && -n $changes ]]; then
    debug "Processing final file: $current_file"
    
    local new_diagnostic
    if new_diagnostic=$(create_diagnostic "$current_file" "$line_number" "$changes"); then
      debug "Valid diagnostic created for final file, adding to array"
      diagnostics=$(echo "$diagnostics" | jq --argjson diag "$new_diagnostic" '. + [$diag]')
      has_diagnostics=true
      ((processed_files++))
      debug "Final diagnostics array: $(echo "$diagnostics" | jq -c '.')"
    else
      debug "Failed to create diagnostic for final file"
    fi
  fi
  
  debug "Processed $processed_files files"
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
  # Capture process_fmt_diff output separately to avoid mixing with debug messages
  diagnostics=$(process_fmt_diff)
  
  # Create the complete JSON structure
  json_output=$(jq -n \
    --arg name "denofmt" \
    --arg url "https://deno.land/manual/tools/formatter" \
    --argjson diags "$diagnostics" \
    '{
      source: {name: $name, url: $url},
      diagnostics: $diags
    }')
  
  # Validate the JSON structure
  if echo "$json_output" | jq empty 2>/dev/null; then
    echo "$json_output"
  else
    debug "Invalid JSON output:"
    echo "$json_output" >&2
    create_empty_rdjson "denofmt" "https://deno.land/manual/tools/formatter"
  fi
else
  echo "Usage: $0 <lint|fmt>" >&2
  rm "$TEMP_FILE" 2>/dev/null
  exit 1
fi

rm "$TEMP_FILE" "${TEMP_FILE}.json" 2>/dev/null
