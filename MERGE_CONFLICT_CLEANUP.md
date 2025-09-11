# 🔧 Git Merge Conflict Cleanup Guide

## ❌ **Issues Identified**
Multiple files contain Git merge conflict markers that are preventing the build:

```
<<<<<<< HEAD
=======
>>>>>>> my-feature-branch
```

## 🎯 **Files Requiring Cleanup**

### **Critical Files (Build Blocking)**
1. `models/resume.ts` ✅ **FIXED**
2. `app/dashboard/tailor/page.tsx` ❌ **NEEDS FIX**
3. `components/ui/label.tsx` ❌ **NEEDS FIX**
4. `app/api/resume/tailor/route.ts` ❌ **NEEDS FIX**
5. `app/api/user/upload/route.ts` ❌ **NEEDS FIX**

### **Non-Critical Files**
- `README.md`
- `package-lock.json`
- `PACKAGE_JSON_FIX.md`

## 🚀 **Quick Fix Commands**

### **Manual Cleanup Steps**

1. **Search for conflict markers:**
```bash
grep -r "<<<<<<< HEAD" .
grep -r "=======" .
grep -r ">>>>>>> my-feature-branch" .
```

2. **For each file, choose the correct version:**
   - Keep the enhanced features (from my-feature-branch)
   - Remove all conflict markers
   - Ensure valid syntax

### **Automated Cleanup (Recommended)**

Create a script to remove all conflict markers and keep the enhanced version:

```bash
# Remove conflict markers and keep enhanced version
sed -i '/<<<<<<< HEAD/,/=======/d' filename
sed -i '/>>>>>>> my-feature-branch/d' filename
```

## 📋 **Resolution Strategy**

### **For Each Conflicted File:**

1. **Identify the conflict sections**
2. **Choose the enhanced version** (usually from my-feature-branch)
3. **Remove all Git markers**
4. **Test the file syntax**

### **Priority Order:**
1. `models/resume.ts` ✅ **DONE**
2. `components/ui/label.tsx` - Fix UI component
3. `app/api/user/upload/route.ts` - Fix upload API
4. `app/api/resume/tailor/route.ts` - Fix tailor API
5. `app/dashboard/tailor/page.tsx` - Fix main page

## 🔧 **Specific Fixes Needed**

### **components/ui/label.tsx**
```typescript
// KEEP: Enhanced version with proper imports
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
```

### **app/api/user/upload/route.ts**
```typescript
// KEEP: Enhanced version with Gemini AI and mammoth
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
```

### **app/api/resume/tailor/route.ts**
```typescript
// KEEP: Enhanced version with AI tailoring
import { GoogleGenerativeAI } from "@google/generative-ai"
// Enhanced AI tailoring functions
```

### **app/dashboard/tailor/page.tsx**
```typescript
// KEEP: Enhanced version with multi-option selection
const [uploadedResumeOptions, setUploadedResumeOptions] = useState<any[]>([]);
// Enhanced upload and selection logic
```

## ⚡ **Quick Resolution**

### **Step 1: Backup Current State**
```bash
git stash
```

### **Step 2: Clean Conflicts**
For each file, manually remove:
- `<<<<<<< HEAD`
- `=======`
- `>>>>>>> my-feature-branch`

Keep the enhanced functionality (usually the bottom section).

### **Step 3: Test Build**
```bash
npm run dev
```

### **Step 4: Verify Functionality**
- Upload resume works
- OCR processing works
- AI tailoring works
- Multi-option selection works

## 🎯 **Expected Result**

After cleanup:
- ✅ Build succeeds without merge conflict errors
- ✅ All enhanced features work (OCR, AI tailoring, multi-options)
- ✅ No Git conflict markers in any files
- ✅ Application runs smoothly

## 🚨 **Critical Actions Required**

1. **Immediately fix** `components/ui/label.tsx`
2. **Clean up** API routes for upload and tailor
3. **Resolve** tailor page conflicts
4. **Test** all functionality after cleanup

**Priority: HIGH - Build is currently broken due to merge conflicts**