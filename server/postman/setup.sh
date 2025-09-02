#!/bin/bash

# AAS Platform Postman Setup Script
echo "🚀 Setting up AAS Platform Postman Collection..."
echo ""

# Check if Postman is installed
if command -v postman &> /dev/null; then
    echo "✅ Postman found!"
else
    echo "⚠️  Postman not found. Please install Postman first."
    echo "   Download from: https://www.postman.com/downloads/"
    echo ""
fi

# Display file locations
echo "📁 Postman files ready for import:"
echo "   📄 Collection: ./AAS_Platform_API.postman_collection.json"
echo "   🌍 Environment: ./AAS_Platform_Environment.postman_environment.json"
echo ""

# Display import instructions
echo "📋 Quick Import Instructions:"
echo "1. Open Postman"
echo "2. Click 'Import' button"
echo "3. Drag both .json files"
echo "4. Select 'AAS Platform Environment' from dropdown"
echo ""

echo ""
echo "🎯 Ready to test!"
echo "   Start with: Authentication → Admin Signin"
echo ""

# Check if server is running
if curl -s http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:5000"
else
    echo "⚠️  Server not running. Start with: npm run dev"
fi

echo ""
echo "� NEW: Check out the super-powered filter requests!"
echo "   🔥 ULTIMATE FILTER - All Options (enable/disable with checkboxes)"
echo "   ⚡ Quick Filter requests for common tasks"
