const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('开始生成 API 代码...\n');

// 下载各个服务的 OpenAPI 文档
console.log('1. 下载各服务的 OpenAPI 文档...');
try {
  execSync('curl http://localhost:8101/api/auth/v3/api-docs -o auth-api.json', {
    stdio: 'inherit',
  });
  execSync(
    'curl http://localhost:8101/api/question/v3/api-docs -o question-api.json',
    { stdio: 'inherit' }
  );
  execSync(
    'curl http://localhost:8101/api/judge/v3/api-docs -o judge-api.json',
    { stdio: 'inherit' }
  );
  execSync('curl http://localhost:8101/api/post/v3/api-docs -o post-api.json', {
    stdio: 'inherit',
  });
  console.log('✓ 文档下载完成\n');
} catch (error) {
  console.error('✗ 下载文档失败，请确保后端服务正在运行');
  process.exit(1);
}

// 读取并合并文档
console.log('2. 合并 OpenAPI 文档...');
const authApi = JSON.parse(fs.readFileSync('auth-api.json', 'utf8'));
const questionApi = JSON.parse(fs.readFileSync('question-api.json', 'utf8'));
const judgeApi = JSON.parse(fs.readFileSync('judge-api.json', 'utf8'));
const postApi = JSON.parse(fs.readFileSync('post-api.json', 'utf8'));

const merged = {
  openapi: '3.0.1',
  info: {
    title: 'WLX OJ Backend API',
    version: 'v1.0',
    description: '聚合所有服务的 API 文档',
  },
  servers: [
    {
      url: 'http://localhost:8101',
      description: 'Gateway server',
    },
  ],
  paths: {},
  components: {
    schemas: {},
  },
};

// 合并 paths，为每个服务添加正确的前缀
function addPrefixToPaths(paths, prefix) {
  const prefixedPaths = {};
  for (const [path, methods] of Object.entries(paths)) {
    prefixedPaths[prefix + path] = methods;
  }
  return prefixedPaths;
}

Object.assign(merged.paths, addPrefixToPaths(authApi.paths, '/api/auth'));
Object.assign(
  merged.paths,
  addPrefixToPaths(questionApi.paths, '/api/question')
);
Object.assign(merged.paths, addPrefixToPaths(judgeApi.paths, '/api/judge'));
Object.assign(merged.paths, addPrefixToPaths(postApi.paths, '/api/post'));

// 合并 schemas，去重
const allSchemas = {};
Object.assign(allSchemas, authApi.components?.schemas || {});
Object.assign(allSchemas, questionApi.components?.schemas || {});
Object.assign(allSchemas, judgeApi.components?.schemas || {});
Object.assign(allSchemas, postApi.components?.schemas || {});
merged.components.schemas = allSchemas;

fs.writeFileSync('merged-api.json', JSON.stringify(merged, null, 2));
console.log('✓ 文档合并完成\n');

// 生成代码
console.log('3. 生成 TypeScript 代码...');
try {
  execSync(
    'npx openapi-typescript-codegen --input merged-api.json --output ./generated',
    { stdio: 'inherit' }
  );
  console.log('✓ 代码生成完成\n');
} catch (error) {
  console.error('✗ 代码生成失败');
  process.exit(1);
}

// 清理临时文件
console.log('4. 清理临时文件...');
try {
  fs.unlinkSync('auth-api.json');
  fs.unlinkSync('question-api.json');
  fs.unlinkSync('judge-api.json');
  fs.unlinkSync('post-api.json');
  fs.unlinkSync('merged-api.json');
  console.log('✓ 清理完成\n');
} catch (error) {
  console.warn('⚠ 清理临时文件时出错:', error.message);
}

console.log('✅ API 代码生成完成！');
