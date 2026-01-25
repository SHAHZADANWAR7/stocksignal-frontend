#!/bin/bash

set -e

PASSED=0
FAILED=0
WARNINGS=0
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')
AUDIT_LOG="audit_${TIMESTAMP}.log"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_pass() { echo -e "${GREEN}✅ PASS${NC}: $1" | tee -a "$AUDIT_LOG"; ((PASSED++)); }
log_fail() { echo -e "${RED}❌ FAIL${NC}: $1" | tee -a "$AUDIT_LOG"; ((FAILED++)); }
log_warn() { echo -e "${YELLOW}⚠️  WARN${NC}: $1" | tee -a "$AUDIT_LOG"; ((WARNINGS++)); }
log_info() { echo -e "${BLUE}ℹ️  INFO${NC}: $1" | tee -a "$AUDIT_LOG"; }

echo "════════════════════════════════════════════════════════════════" | tee "$AUDIT_LOG"
echo "  AWS Amplify v6 + Node.js Compatibility Audit" | tee -a "$AUDIT_LOG"
echo "════════════════════════════════════════════════════════════════" | tee -a "$AUDIT_LOG"
echo "Timestamp: $TIMESTAMP" | tee -a "$AUDIT_LOG"
echo ""

# 1. Base44 references
echo "1️⃣  CHECKING BASE44 REFERENCES..." | tee -a "$AUDIT_LOG"
base44=$(grep -r "base44\|Base44\|BASE44" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null || true | wc -l)
if [ "$base44" -eq 0 ]; then log_pass "No Base44 references"; else log_fail "Found $base44 Base44 references"; fi
echo ""

# 2. Package.json
echo "2️⃣  VALIDATING PACKAGE.JSON..." | tee -a "$AUDIT_LOG"
[ -f "package.json" ] && log_pass "package.json exists" || log_fail "package.json missing"
jq empty package.json 2>/dev/null && log_pass "Valid JSON" || log_fail "Invalid JSON"
grep -q "aws-amplify" package.json && log_pass "AWS Amplify dependency" || log_fail "AWS Amplify missing"
grep -q "react-router-dom" package.json && log_pass "React Router" || log_warn "React Router missing"
grep -q "vite" package.json && log_pass "Vite present" || log_fail "Vite missing"
echo ""

# 3. Build config
echo "3️⃣  BUILD CONFIGURATION..." | tee -a "$AUDIT_LOG"
[ -f "vite.config.js" ] && log_pass "vite.config.js" || log_fail "vite.config.js missing"
[ -f "tailwind.config.js" ] && log_pass "tailwind.config.js" || log_fail "tailwind.config.js missing"
[ -f "postcss.config.js" ] && log_pass "postcss.config.js" || log_fail "postcss.config.js missing"
echo ""

# 4. Amplify
echo "4️⃣  AMPLIFY CONFIGURATION..." | tee -a "$AUDIT_LOG"
[ -f "amplify.yml" ] && log_pass "amplify.yml exists" || log_fail "amplify.yml missing"
grep -q "baseDirectory: dist" amplify.yml 2>/dev/null && log_pass "Build output: dist" || log_warn "Build output not set to dist"
echo ""

# 5. Environment
echo "5️⃣  ENVIRONMENT VARIABLES..." | tee -a "$AUDIT_LOG"
[ -f ".env.example" ] && log_pass ".env.example exists" || log_fail ".env.example missing"
grep -q "VITE_COGNITO_USER_POOL_ID" .env.example && log_pass "Cognito User Pool ID" || log_fail "Missing Cognito config"
grep -q "VITE_COGNITO_APP_CLIENT_ID" .env.example && log_pass "Cognito App Client ID" || log_fail "Missing Cognito Client"
echo ""

# 6. Git
echo "6️⃣  GIT CONFIGURATION..." | tee -a "$AUDIT_LOG"
[ -f ".gitignore" ] && log_pass ".gitignore exists" || log_fail ".gitignore missing"
grep -q "node_modules" .gitignore && log_pass "node_modules ignored" || log_fail "node_modules NOT ignored"
grep -q "dist" .gitignore && log_pass "dist ignored" || log_warn "dist NOT ignored"
grep -q ".env" .gitignore && log_pass ".env ignored" || log_fail ".env NOT ignored"
echo ""

# 7. Entry points
echo "7️⃣  ENTRY POINTS..." | tee -a "$AUDIT_LOG"
[ -f "index.html" ] && log_pass "index.html exists" || log_fail "index.html missing"
grep -q 'type="module"' index.html && log_pass "Module type set" || log_fail "Module type missing"
grep -q "src/main.jsx\|src/main.js" index.html && log_pass "Entry point found" || log_fail "Entry point missing"
[ -f "src/main.jsx" ] && log_pass "src/main.jsx exists" || log_fail "src/main.jsx missing"
echo ""

# 8. Node.js
echo "8️⃣  NODE.JS COMPATIBILITY..." | tee -a "$AUDIT_LOG"
NODE_V=$(node --version)
NPM_V=$(npm --version)
log_info "Node: $NODE_V, npm: $NPM_V"
echo ""

# 9. Syntax
echo "9️⃣  SYNTAX VALIDATION..." | tee -a "$AUDIT_LOG"
node --check vite.config.js && log_pass "vite.config.js syntax" || log_fail "vite.config.js error"
node --check tailwind.config.js && log_pass "tailwind.config.js syntax" || log_fail "tailwind.config.js error"
echo ""

# 10. Summary
echo "════════════════════════════════════════════════════════════════" | tee -a "$AUDIT_LOG"
echo "RESULTS:" | tee -a "$AUDIT_LOG"
echo -e "${GREEN}✅ PASSED: $PASSED${NC}" | tee -a "$AUDIT_LOG"
echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}" | tee -a "$AUDIT_LOG"
echo -e "${RED}❌ FAILED: $FAILED${NC}" | tee -a "$AUDIT_LOG"

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}✅ AUDIT PASSED!${NC}" | tee -a "$AUDIT_LOG"
  echo "Audit log: $AUDIT_LOG" | tee -a "$AUDIT_LOG"
  exit 0
else
  echo -e "${RED}❌ AUDIT FAILED!${NC}" | tee -a "$AUDIT_LOG"
  exit 1
fi
