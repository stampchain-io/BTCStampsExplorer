#!/bin/bash

# Script to migrate Postman files to tests/postman directory and update references

echo "=== Migrating Postman Files to tests/postman ==="

# Create the new directory structure
mkdir -p tests/postman/collections
mkdir -p tests/postman/environments
mkdir -p tests/postman/data

# Move collection files
echo "Moving collection files..."
mv postman-collection-*.json tests/postman/collections/ 2>/dev/null || echo "No collection files to move"

# Move environment files
echo "Moving environment files..."
mv postman-environment*.json tests/postman/environments/ 2>/dev/null || echo "No environment files to move"

# Move data files
echo "Moving data files..."
mv postman-data-*.json tests/postman/data/ 2>/dev/null || echo "No data files to move"

# Update docker-compose.test.yml references
echo "Updating docker-compose.test.yml..."
sed -i.bak 's|NEWMAN_COLLECTION=postman-collection-|NEWMAN_COLLECTION=tests/postman/collections/postman-collection-|g' docker-compose.test.yml
sed -i.bak 's|newman run postman-collection-|newman run tests/postman/collections/postman-collection-|g' docker-compose.test.yml
sed -i.bak 's|NEWMAN_ENVIRONMENT=postman-environment|NEWMAN_ENVIRONMENT=tests/postman/environments/postman-environment|g' docker-compose.test.yml
sed -i.bak 's|--environment postman-environment|--environment tests/postman/environments/postman-environment|g' docker-compose.test.yml

# Update package.json scripts
echo "Updating package.json..."
sed -i.bak 's|postman-collection-|tests/postman/collections/postman-collection-|g' package.json
sed -i.bak 's|postman-environment|tests/postman/environments/postman-environment|g' package.json

# Update run-newman scripts
echo "Updating newman scripts..."
for script in scripts/run-newman*.sh; do
    if [ -f "$script" ]; then
        sed -i.bak 's|postman-collection-|tests/postman/collections/postman-collection-|g' "$script"
        sed -i.bak 's|postman-environment|tests/postman/environments/postman-environment|g' "$script"
        sed -i.bak 's|postman-data-|tests/postman/data/postman-data-|g' "$script"
    fi
done

# Update the comprehensive script's data file reference
if [ -f "scripts/run-newman-comprehensive.sh" ]; then
    sed -i.bak 's|./postman-data-pagination-tests.json|./tests/postman/data/postman-data-pagination-tests.json|g' scripts/run-newman-comprehensive.sh
fi

# Clean up backup files
echo "Cleaning up backup files..."
find . -name "*.bak" -type f -delete

echo "=== Migration Complete ==="
echo ""
echo "New structure:"
echo "tests/postman/"
echo "├── collections/"
echo "│   ├── postman-collection-comprehensive.json"
echo "│   ├── postman-collection-regression-v23.json"
echo "│   ├── postman-collection-pagination-validation.json"
echo "│   └── ..."
echo "├── environments/"
echo "│   ├── postman-environment.json"
echo "│   └── postman-environment-comprehensive.json"
echo "└── data/"
echo "    └── postman-data-pagination-tests.json"
echo ""
echo "All references have been updated in:"
echo "- docker-compose.test.yml"
echo "- package.json"
echo "- scripts/run-newman*.sh"