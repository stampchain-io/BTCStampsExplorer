#!/bin/bash

sed -i 's/^#*DB_HOST/#DB_HOST/' .env

# Get the environment argument
ENV=${1:-test}

# Use the environment argument in the copilot command
copilot svc deploy -n front-end -e $ENV