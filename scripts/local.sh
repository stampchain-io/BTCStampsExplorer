#!/bin/bash
# deno run -A main.ts build

# remove comment on the DB_HOST line
sed -i 's/^#DB_HOST/DB_HOST/' .env

