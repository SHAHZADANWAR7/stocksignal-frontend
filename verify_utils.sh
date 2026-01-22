#!/bin/bash

echo "═══════════════════════════════════════════════════════════════"
echo "  UTILS DIRECTORY VERIFICATION - AWS DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Define expected files and line counts
declare -A expected_files=(
  ["awsConfig.js"]=0
  ["awsClient.js"]=0
  ["awsApi.js"]=0
  ["QueryProvider.js"]=0
  ["stockDataCache.js"]=0
  ["usageLimit.js"]=0
  ["investorMetrics.js"]=0
  ["portfolioHealthMetrics.js"]=0
  ["cashOpportunityMetrics.js"]=0
  ["robustOptimization.js"]=0
  ["subscriptionCheck.js"]=0
  ["queries.js"]=0
  ["consistencyValidator.js"]=0
  ["drawdownDecomposition.js"]=0
  ["globalConsistency.js"]=0
  ["assetInceptionDates.js"]=0
  ["allocationValidator.js"]=0
  ["shadowPortfolioValidation.js"]=686
  ["ROOT_CAUSE_ANALYSIS.js"]=249
  ["RCA_EXPLANATION.js"]=202
  ["financialMath.js"]=0
  ["stressTesting.js"]=0
  ["rebalancing.js"]=0
  ["forwardLookingRisk.js"]=0
  ["enhancedScenarios.js"]=0
)

UTILS_DIR="./src/components/utils"
total_files=0
missing_files=0
mismatch_files=0

echo "Checking directory: $UTILS_DIR"
echo ""

if [ ! -d "$UTILS_DIR" ]; then
  echo "❌ ERROR: Utils directory not found: $UTILS_DIR"
  exit 1
fi

echo "File Name                          | Status | Lines | Expected | Match"
echo "─────────────────────────────────────────────────────────────────────"

for file in "${!expected_files[@]}"; do
  total_files=$((total_files + 1))
  filepath="$UTILS_DIR/$file"
  expected_lines=${expected_files[$file]}
  
  if [ -f "$filepath" ]; then
    actual_lines=$(wc -l < "$filepath" | tr -d ' ')
    
    if [ "$expected_lines" -eq 0 ]; then
      # No expected count provided
      printf "%-35s | ✅     | %-5s | N/A      | -\n" "$file" "$actual_lines"
    elif [ "$actual_lines" -eq "$expected_lines" ]; then
      printf "%-35s | ✅     | %-5s | %-8s | ✅\n" "$file" "$actual_lines" "$expected_lines"
    else
      printf "%-35s | ✅     | %-5s | %-8s | ❌ MISMATCH\n" "$file" "$actual_lines" "$expected_lines"
      mismatch_files=$((mismatch_files + 1))
    fi
  else
    printf "%-35s | ❌     | -     | %-8s | -\n" "$file" "$expected_lines"
    missing_files=$((missing_files + 1))
  fi
done

echo "─────────────────────────────────────────────────────────────────────"
echo ""
echo "SUMMARY:"
echo "  Total files checked: $total_files"
echo "  Missing files: $missing_files"
echo "  Line count mismatches: $mismatch_files"
echo ""

if [ $missing_files -eq 0 ] && [ $mismatch_files -eq 0 ]; then
  echo "✅ ALL FILES VERIFIED SUCCESSFULLY"
  exit 0
else
  echo "❌ VERIFICATION FAILED"
  exit 1
fi
