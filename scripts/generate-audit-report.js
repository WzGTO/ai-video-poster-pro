#!/usr/bin/env node

/**
 * Generate Audit Report Script
 * 
 * Scans the project and generates a comprehensive audit report
 * 
 * Usage:
 *   npm run audit
 *   node scripts/generate-audit-report.js
 */

const fs = require('fs');
const path = require('path');

// ===== Configuration =====

const PROJECT_ROOT = path.join(__dirname, '..');
const REPORT_PATH = path.join(PROJECT_ROOT, 'docs', 'reports', 'audit_report_generated.md');

const SCAN_PATTERNS = {
    typescript: ['**/*.ts', '**/*.tsx'],
    components: ['components/**/*.tsx'],
    apiRoutes: ['app/api/**/*.ts'],
    tests: ['__tests__/**/*.ts', '__tests__/**/*.tsx'],
};

const EXCLUDE_PATTERNS = [
    'node_modules',
    '.next',
    'dist',
    'coverage',
];

// ===== Helper Functions =====

function walkDir(dir, fileList = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        if (EXCLUDE_PATTERNS.some(p => file.name === p)) continue;

        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
            walkDir(filePath, fileList);
        } else {
            fileList.push(filePath);
        }
    }

    return fileList;
}

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n').length;
    } catch {
        return 0;
    }
}

function checkForIssues(content, filePath) {
    const issues = [];
    const warnings = [];

    // Check for console.log
    if (content.includes('console.log') && !filePath.includes('logger')) {
        warnings.push('Contains console.log (use logger instead)');
    }

    // Check for 'any' type
    if (content.match(/:\s*any\b/g)) {
        warnings.push('Contains explicit "any" type');
    }

    // Check for TODO/FIXME
    if (content.match(/TODO|FIXME/gi)) {
        warnings.push('Contains TODO/FIXME comments');
    }

    // Check API routes for auth
    if (filePath.includes('api') && filePath.endsWith('route.ts')) {
        if (!content.includes('auth()') && !content.includes('getServerSession')) {
            if (!filePath.includes('cron') && !filePath.includes('[...nextauth]')) {
                issues.push('Missing authentication check');
            }
        }
    }

    // Check for try-catch in API routes
    if (filePath.includes('api') && filePath.endsWith('route.ts')) {
        if (!content.includes('try {') && !content.includes('try{')) {
            warnings.push('Missing try-catch error handling');
        }
    }

    return { issues, warnings };
}

// ===== Main Function =====

async function generateAuditReport() {
    console.log('📊 Generating audit report...\n');

    const startTime = Date.now();

    // Initialize stats
    const stats = {
        totalFiles: 0,
        typescriptFiles: 0,
        componentFiles: 0,
        apiRoutes: 0,
        testFiles: 0,
        totalLines: 0,
        issues: [],
        warnings: [],
        passed: [],
    };

    // Scan all files
    const allFiles = walkDir(PROJECT_ROOT);
    stats.totalFiles = allFiles.length;

    // Filter by type
    const tsFiles = allFiles.filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
    stats.typescriptFiles = tsFiles.length;

    const componentFiles = allFiles.filter(f => f.includes('components') && f.endsWith('.tsx'));
    stats.componentFiles = componentFiles.length;

    const apiRoutes = allFiles.filter(f => f.includes('api') && f.endsWith('route.ts'));
    stats.apiRoutes = apiRoutes.length;

    const testFiles = allFiles.filter(f => f.includes('__tests__') || f.includes('.test.'));
    stats.testFiles = testFiles.length;

    // Count lines
    for (const file of tsFiles) {
        stats.totalLines += countLines(file);
    }

    // Check each TypeScript file for issues
    console.log('🔍 Scanning files for issues...\n');

    for (const file of tsFiles) {
        try {
            const content = fs.readFileSync(file, 'utf-8');
            const relativePath = path.relative(PROJECT_ROOT, file);
            const { issues, warnings } = checkForIssues(content, file);

            if (issues.length > 0) {
                stats.issues.push(...issues.map(i => ({ file: relativePath, issue: i })));
            }

            if (warnings.length > 0) {
                stats.warnings.push(...warnings.map(w => ({ file: relativePath, warning: w })));
            }
        } catch (err) {
            // Skip unreadable files
        }
    }

    // Check for passed items
    stats.passed = [
        { check: 'TypeScript files exist', result: stats.typescriptFiles > 0 },
        { check: 'Components exist', result: stats.componentFiles > 0 },
        { check: 'API routes defined', result: stats.apiRoutes > 0 },
        { check: 'package.json exists', result: fs.existsSync(path.join(PROJECT_ROOT, 'package.json')) },
        { check: 'next.config exists', result: fs.existsSync(path.join(PROJECT_ROOT, 'next.config.ts')) || fs.existsSync(path.join(PROJECT_ROOT, 'next.config.js')) },
        { check: 'Tailwind configured', result: fs.existsSync(path.join(PROJECT_ROOT, 'tailwind.config.ts')) || fs.existsSync(path.join(PROJECT_ROOT, 'tailwind.config.js')) },
        { check: 'ESLint configured', result: fs.existsSync(path.join(PROJECT_ROOT, '.eslintrc.json')) },
        { check: 'Git initialized', result: fs.existsSync(path.join(PROJECT_ROOT, '.git')) },
        { check: 'env.example exists', result: fs.existsSync(path.join(PROJECT_ROOT, '.env.example')) },
        { check: 'Database migrations exist', result: fs.existsSync(path.join(PROJECT_ROOT, 'supabase', 'migrations')) },
    ];

    // Calculate score
    const passedCount = stats.passed.filter(p => p.result).length;
    const issueCount = stats.issues.length;
    const warningCount = stats.warnings.length;
    const score = Math.max(0, 100 - (issueCount * 10) - (warningCount * 2));

    // Generate report
    const report = generateReportContent(stats, score);

    // Ensure directory exists
    const reportsDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Write report
    fs.writeFileSync(REPORT_PATH, report);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Print summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 AUDIT REPORT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📁 Total Files:      ${stats.totalFiles}`);
    console.log(`📝 TypeScript Files: ${stats.typescriptFiles}`);
    console.log(`🧩 Components:       ${stats.componentFiles}`);
    console.log(`🔌 API Routes:       ${stats.apiRoutes}`);
    console.log(`🧪 Test Files:       ${stats.testFiles}`);
    console.log(`📏 Total Lines:      ${stats.totalLines.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔴 Critical Issues:  ${issueCount}`);
    console.log(`🟡 Warnings:         ${warningCount}`);
    console.log(`✅ Passed Checks:    ${passedCount}/${stats.passed.length}`);
    console.log(`📈 Quality Score:    ${score}/100`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Report generated: ${REPORT_PATH}`);
    console.log(`⏱️  Completed in ${duration}s\n`);

    // Exit with error code if critical issues found
    if (issueCount > 0) {
        console.log('⚠️  Critical issues found! Please fix before deployment.\n');
        process.exit(1);
    }
}

function generateReportContent(stats, score) {
    const timestamp = new Date().toISOString();

    return `# 📊 Automated Audit Report

**Generated:** ${timestamp}  
**Project:** AI Video Poster Pro  
**Score:** ${score}/100

---

## 📁 Project Statistics

| Metric | Count |
|--------|-------|
| Total Files | ${stats.totalFiles} |
| TypeScript Files | ${stats.typescriptFiles} |
| Components | ${stats.componentFiles} |
| API Routes | ${stats.apiRoutes} |
| Test Files | ${stats.testFiles} |
| Total Lines | ${stats.totalLines.toLocaleString()} |

---

## 🔴 Critical Issues (${stats.issues.length})

${stats.issues.length === 0 ? '✅ No critical issues found!\n' : stats.issues.map(i => `- **${i.file}**: ${i.issue}`).join('\n')}

---

## 🟡 Warnings (${stats.warnings.length})

${stats.warnings.length === 0 ? '✅ No warnings found!\n' : stats.warnings.map(w => `- **${w.file}**: ${w.warning}`).join('\n')}

---

## ✅ Configuration Checks

${stats.passed.map(p => `- ${p.result ? '✅' : '❌'} ${p.check}`).join('\n')}

---

## 📈 Quality Score

\`\`\`
Score: ${score}/100

${score >= 80 ? '⭐⭐⭐⭐ Excellent' : score >= 60 ? '⭐⭐⭐ Good' : score >= 40 ? '⭐⭐ Needs Work' : '⭐ Critical'}

${score >= 70 ? '✅ Ready for deployment' : '⚠️ Fix issues before deployment'}
\`\`\`

---

## 🚀 Next Steps

${stats.issues.length > 0 ? '1. Fix all critical issues listed above' : ''}
${stats.warnings.length > 0 ? '2. Address warnings for better code quality' : ''}
${stats.passed.filter(p => !p.result).length > 0 ? '3. Complete missing configuration items' : ''}
${score >= 70 ? '4. ✅ Proceed with deployment' : ''}

---

*Report generated automatically by generate-audit-report.js*
`;
}

// ===== Run =====

generateAuditReport().catch(err => {
    console.error('Error generating report:', err);
    process.exit(1);
});
