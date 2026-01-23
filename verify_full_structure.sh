#!/bin/bash

echo "════════════════════════════════════════════════════════"
echo "  STOCKSIGNAL FRONTEND - COMPLETE STRUCTURE VERIFICATION"
echo "════════════════════════════════════════════════════════"

# ROOT LEVEL FILES
echo -e "\n✅ ROOT LEVEL FILES:"
for file in package.json vite.config.js .env .env.example .gitignore index.html tailwind.config.js; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ MISSING: $file"
  fi
done

# SRC DIRECTORY STRUCTURE
echo -e "\n✅ SRC DIRECTORY STRUCTURE:"
for dir in src/pages src/components src/entities src/utils src/hooks; do
  if [ -d "$dir" ]; then
    count=$(find "$dir" -maxdepth 1 -type f | wc -l)
    echo "  ✓ $dir/ ($count files)"
  else
    echo "  ✗ MISSING: $dir/"
  fi
done

# KEY SRC FILES
echo -e "\n✅ KEY SRC FILES:"
for file in src/Layout.js src/globals.css src/App.jsx src/main.jsx src/index.css; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  else
    echo "  ✗ MISSING: $file"
  fi
done

# VERIFY PAGES ARE FLAT (NO SUBDIRECTORIES)
echo -e "\n✅ PAGES FLATNESS CHECK (Should be flat, no subdirs):"
page_subdirs=$(find src/pages -maxdepth 1 -type d ! -name "pages" | wc -l)
if [ $page_subdirs -eq 0 ]; then
  echo "  ✓ Pages are FLAT (no subdirectories)"
else
  echo "  ✗ WARNING: Pages have subdirectories:"
  find src/pages -maxdepth 1 -type d ! -name "pages"
fi

# COMPONENTS CAN HAVE SUBDIRECTORIES
echo -e "\n✅ COMPONENTS STRUCTURE (Can have subdirs):"
find src/components -maxdepth 1 -type d ! -name "components" | sed 's/^/  ✓ /'

# ENTITIES CHECK
echo -e "\n✅ ENTITIES CHECK:"
entity_count=$(ls -1 src/entities/*.json 2>/dev/null | wc -l)
echo "  Total entity files: $entity_count"
if [ $entity_count -gt 0 ]; then
  echo "  Sample entities:"
  ls -1 src/entities/*.json 2>/dev/null | head -5 | sed 's/^/    /'
fi

# CRITICAL CONFIGURATION
echo -e "\n✅ CRITICAL CONFIGURATION:"
echo "  package.json scripts:"
grep -A 5 '"scripts"' package.json | grep -E '(dev|build|preview)' | sed 's/^/    /'

echo -e "\n  .gitignore (should exclude node_modules, dist, .env):"
if grep -q "node_modules" .gitignore 2>/dev/null; then
  echo "    ✓ node_modules excluded"
fi
if grep -q "dist" .gitignore 2>/dev/null; then
  echo "    ✓ dist excluded"
fi
if grep -q ".env" .gitignore 2>/dev/null; then
  echo "    ✓ .env excluded"
fi

# VITE CONFIG
echo -e "\n✅ VITE CONFIGURATION:"
if grep -q "root: 'src'" vite.config.js 2>/dev/null; then
  echo "    ✓ Vite root set to src/"
fi

# FILE COUNTS SUMMARY
echo -e "\n✅ FILE COUNTS SUMMARY:"
echo "  Pages (.jsx/.js): $(find src/pages -type f | wc -l)"
echo "  Components (.jsx/.js): $(find src/components -type f | wc -l)"
echo "  Utils (.js): $(find src/utils -type f | wc -l)"
echo "  Entities (.json): $(find src/entities -type f | wc -l)"
echo "  Dependencies installed: $([ -d node_modules ] && echo "YES" || echo "NO")"

# GIT STATUS
echo -e "\n✅ GIT STATUS:"
git status --short | head -10
echo "  ..."

echo -e "\n════════════════════════════════════════════════════════"
echo "  VERIFICATION COMPLETE"
echo "════════════════════════════════════════════════════════"
