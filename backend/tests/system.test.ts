import { execSync } from 'child_process';
import path from 'path';

describe('System & Configuration Security', () => {
  it('Application refuses to start if JWT_SECRET is missing', () => {
    const serverPath = path.join(__dirname, '../src/server.ts');
    
    let error: any;
    try {
      execSync(`npx tsx ${serverPath}`, {
        env: { ...process.env, JWT_SECRET: '' },
        stdio: 'pipe'
      });
    } catch (e) {
      error = e;
    }
    
    expect(error).toBeDefined();
    expect(error.stderr.toString()).toContain('FATAL ERROR: JWT_SECRET environment variable is missing');
  });
});
