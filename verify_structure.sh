#!/bin/bash
echo "═══════════════════════════════════════════════════════════════════════"
echo "GIT REPO STRUCTURE VERIFICATION FOR AWS AMPLIFY DEPLOYMENT"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

# Check git connection
echo "📡 GIT CONNECTION STATUS:"
git remote -v
echo ""

# Check directory structure
echo "📁 DIRECTORY STRUCTURE VERIFICATION:"
echo ""
echo "Root directories:"
ls -la | grep "^d" | awk '{print $9}' | grep -E "src|public|node_modules|config"
echo ""

echo "📦 SOURCE (./src) STRUCTURE:"
if [ -d "./src" ]; then
  echo "✅ ./src exists"
  ls -la ./src | grep "^d" | awk '{print $9}'
else
  echo "❌ ./src NOT FOUND"
fi
echo ""

echo "📄 CRITICAL FILES IN ./src:"
for file in "index.js" "index.html" "App.js" "App.jsx"; do
  if [ -f "./src/$file" ]; then
    echo "✅ ./src/$file ($(wc -l < ./src/$file) lines)"
  fi
done
echo ""

echo "🎨 PAGES DIRECTORY (./src/pages):"
if [ -d "./src/pages" ]; then
  echo "✅ ./src/pages exists"
  echo "  Files: $(ls -1 ./src/pages | wc -l)"
  ls -1 ./src/pages | head -20
else
  echo "❌ ./src/pages NOT FOUND"
fi
echo ""

echo "🧩 COMPONENTS DIRECTORY (./src/components):"
if [ -d "./src/components" ]; then
  echo "✅ ./src/components exists"
  echo "  Subdirectories: $(find ./src/components -maxdepth 1 -type d | wc -l)"
  find ./src/components -maxdepth 1 -type d | grep -v "^./src/components$"
  echo "  Total component files: $(find ./src/components -type f -name "*.jsx" -o -name "*.js" | wc -l)"
else
  echo "❌ ./src/components NOT FOUND"
fi
echo ""

echo "📊 ENTITIES DIRECTORY (./src/entities):"
if [ -d "./src/entities" ]; then
  echo "✅ ./src/entities exists"
  echo "  Schema files: $(ls -1 ./src/entities/*.json 2>/dev/null | wc -l)"
  ls -1 ./src/entities/*.json 2>/dev/null | wc -l && echo "  ✅ JSON files found" || echo "  ⚠️ No JSON files yet"
else
  echo "❌ ./src/entities NOT FOUND"
fi
echo ""

echo "⚙️ FUNCTIONS DIRECTORY (./src/functions):"
if [ -d "./src/functions" ]; then
  echo "✅ ./src/functions exists"
  echo "  Files: $(ls -1 ./src/functions | wc -l)"
  ls -1 ./src/functions | head -10
else
  echo "❌ ./src/functions NOT FOUND"
fi
echo ""

echo "🎯 LAYOUT & CONFIG FILES:"
for file in "Layout.js" "globals.css"; do
  if [ -f "./src/$file" ]; then
    echo "✅ ./src/$file ($(wc -l < ./src/$file) lines)"
  else
    echo "⚠️ ./src/$file NOT FOUND"
  fi
done
echo ""

echo "📦 PACKAGE MANAGEMENT:"
echo ""
if [ -f "./package.json" ]; then
  echo "✅ package.json EXISTS"
  echo "  Node version: $(cat ./package.json | grep '"node"' || echo 'Not specified')"
  echo "  React version: $(cat ./package.json | grep '"react"' | head -1)"
  echo "  React Router: $(cat ./package.json | grep '"react-router-dom"' || echo '❌ Missing')"
  echo "  Tailwind CSS: $(cat ./package.json | grep '"tailwindcss"' || echo '⚠️ Check if installed')"
  echo "  AWS Amplify: $(cat ./package.json | grep 'amplify' || echo '⚠️ Check dependencies')"
  echo ""
  echo "  Total dependencies: $(cat ./package.json | grep -o '".*":' | grep -v '^"name"' | grep -v '^"version"' | wc -l)"
else
  echo "❌ package.json NOT FOUND"
fi
echo ""

if [ -f "./package-lock.json" ]; then
  echo "✅ package-lock.json EXISTS"
  ls -lh ./package-lock.json | awk '{print "  Size: " $5}'
elif [ -f "./yarn.lock" ]; then
  echo "✅ yarn.lock EXISTS"
  ls -lh ./yarn.lock | awk '{print "  Size: " $5}'
else
  echo "⚠️ No lock file (package-lock.json or yarn.lock) found"
fi
echo ""

echo "📦 NODE MODULES:"
if [ -d "./node_modules" ]; then
  echo "✅ ./node_modules EXISTS"
  echo "  Total packages: $(ls ./node_modules | wc -l)"
  echo "  Size: $(du -sh ./node_modules 2>/dev/null | awk '{print $1}')"
else
  echo "❌ ./node_modules NOT FOUND - Run: npm install"
fi
echo ""

echo "⚙️ CONFIGURATION FILES:"
for file in "tailwind.config.js" "tsconfig.json" ".env.example" "vite.config.js" "webpack.config.js" "amplify.yml"; do
  if [ -f "./$file" ]; then
    echo "✅ ./$file"
  elif [ -f "./src/$file" ]; then
    echo "✅ ./src/$file"
  fi
done
echo ""

echo "📋 UTILITY FILES:"
if [ -f "./src/utils" ] || [ -d "./src/utils" ]; then
  if [ -d "./src/utils" ]; then
    echo "✅ ./src/utils/ exists"
    echo "  Files: $(ls -1 ./src/utils | wc -l)"
    ls -1 ./src/utils | head -15
  fi
else
  echo "⚠️ ./src/utils NOT FOUND"
fi
echo ""

echo "🔐 ENVIRONMENT CONFIGURATION:"
if [ -f "./.env" ]; then
  echo "✅ .env EXISTS (⚠️ Do NOT commit to git)"
elif [ -f "./.env.example" ]; then
  echo "✅ .env.example EXISTS (use as template)"
elif [ -f "./.env.local" ]; then
  echo "✅ .env.local EXISTS"
else
  echo "⚠️ No environment config file found - Create .env based on .env.example"
fi
echo ""

echo "🚀 GIT STATUS:"
echo "  Branch: $(git branch --show-current)"
echo "  Remote: $(git remote get-url origin)"
echo "  Commits: $(git rev-list --count HEAD)"
echo "  Last commit: $(git log -1 --format='%h - %s' 2>/dev/null)"
echo ""

echo "═══════════════════════════════════════════════════════════════════════"
echo "AMPLIFY DEPLOYMENT CHECKLIST:"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""
echo "REQUIRED FOR AWS AMPLIFY:"
echo "[ ] ./src directory with all pages, components, entities"
echo "[ ] package.json with all dependencies"
echo "[ ] node_modules installed (npm install)"
echo "[ ] .env or .env.example configured"
echo "[ ] .gitignore includes node_modules, .env, dist/"
echo "[ ] Build script in package.json (npm run build)"
echo "[ ] Start script in package.json (npm start)"
echo ""
echo "NEXT STEPS:"
echo "1. If node_modules missing: npm install"
echo "2. If .env missing: cp .env.example .env && update values"
echo "3. Verify all entity files in ./src/entities"
echo "4. Run: npm run build (to verify build succeeds)"
echo "5. Connect repo to AWS Amplify in Console"
echo ""
echo "═══════════════════════════════════════════════════════════════════════"
