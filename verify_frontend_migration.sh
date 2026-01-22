#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════════"
echo "  FRONTEND MIGRATION VERIFICATION - AWS DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Define critical directories to check
declare -a DIRECTORIES=(
  "./src/pages"
  "./src/components"
  "./src/components/utils"
  "./src/components/analysis"
  "./src/components/dashboard"
  "./src/components/trading"
  "./src/components/subscription"
  "./src/components/trust"
  "./src/components/tutorial"
  "./src/components/goals"
  "./src/components/legal"
  "./src/functions"
  "./src/entities"
)

# Define critical files to check
declare -A CRITICAL_FILES=(
  ["./src/Layout.js"]="Main layout wrapper"
  ["./src/globals.css"]="Global styles"
  ["./src/pages/Dashboard.js"]="Dashboard page"
  ["./src/pages/Holdings.js"]="Holdings page"
  ["./src/pages/Analysis.js"]="Analysis page"
  ["./src/components/utils/shadowPortfolioValidation.js"]="Shadow portfolio validation (686 lines)"
  ["./src/components/utils/ROOT_CAUSE_ANALYSIS.js"]="RCA documentation (249 lines)"
  ["./src/components/utils/RCA_EXPLANATION.js"]="RCA explanation (202 lines)"
  ["./src/components/utils/financialMath.js"]="Financial math utilities"
  ["./src/components/utils/queries.js"]="React Query hooks"
  ["./src/components/ChatBot.js"]="ChatBot component"
  ["./src/components/ErrorBoundary.js"]="Error boundary"
)

echo "DIRECTORY STRUCTURE VERIFICATION"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

dir_missing=0
dir_exist=0

for dir in "${DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    file_count=$(find "$dir" -maxdepth 1 -type f | wc -l)
    printf "✅ %-40s | %3d files\n" "$dir" "$file_count"
    dir_exist=$((dir_exist + 1))
  else
    printf "❌ %-40s | MISSING\n" "$dir"
    dir_missing=$((dir_missing + 1))
  fi
done

echo ""
echo "CRITICAL FILES VERIFICATION"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

files_missing=0
files_exist=0

for file in "${!CRITICAL_FILES[@]}"; do
  description="${CRITICAL_FILES[$file]}"
  if [ -f "$file" ]; then
    line_count=$(wc -l < "$file" | tr -d ' ')
    printf "✅ %-35s | %5s lines | %s\n" "$file" "$line_count" "$description"
    files_exist=$((files_exist + 1))
  else
    printf "❌ %-35s | MISSING | %s\n" "$file" "$description"
    files_missing=$((files_missing + 1))
  fi
done

echo ""
echo "TOTAL FILE COUNT BY DIRECTORY"
echo "─────────────────────────────────────────────────────────────────────────"
echo ""

for dir in "${DIRECTORIES[@]}"; do
  if [ -d "$dir" ]; then
    file_count=$(find "$dir" -maxdepth 1 -type f | wc -l)
    total_lines=$(find "$dir" -maxdepth 1 -type f -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}')
    printf "%-40s | Files: %3d | Total Lines: %5s\n" "$dir" "$file_count" "$total_lines"
  fi
done

echo ""
echo "═══════════════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "Directories checked: ${#DIRECTORIES[@]}"
echo "  ✅ Existing: $dir_exist"
echo "  ❌ Missing: $dir_missing"
echo ""
echo "Critical files checked: ${#CRITICAL_FILES[@]}"
echo "  ✅ Existing: $files_exist"
echo "  ❌ Missing: $files_missing"
echo ""

if [ $dir_missing -eq 0 ] && [ $files_missing -eq 0 ]; then
  echo "✅ FRONTEND MIGRATION COMPLETE - ALL DIRECTORIES AND CRITICAL FILES PRESENT"
  exit 0
else
  echo "❌ MIGRATION INCOMPLETE - MISSING DIRECTORIES OR FILES"
  exit 1
fi
