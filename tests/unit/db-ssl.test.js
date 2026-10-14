import {test,expect,vi,afterEach} from 'vitest';
import pg from 'pg';
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
test.each(['prefer','require','verify-ca'])('database sslmode=%s preserves full certificate verification without a warning',async mode=>{
 vi.resetModules();
 vi.stubEnv('DATABASE_URL',`postgresql://demo:p%40ss@db.example.test/app?sslmode=${mode}&channel_binding=require`);
 const warning=vi.spyOn(process,'emitWarning').mockImplementation(()=>{});
 const {getPool}=await import('../../src/server/db.js');
 const pool=getPool();
 const url=new URL(pool.options.connectionString);
 expect(url.searchParams.get('sslmode')).toBe('verify-full');
 expect(url.searchParams.get('channel_binding')).toBe('require');
 expect(url.password).toBe('p%40ss');
 const client=new pg.Client(pool.options);
 expect(client.ssl).not.toBe(false);
 expect(client.ssl.rejectUnauthorized).not.toBe(false);
 expect(client.ssl.checkServerIdentity).toBeUndefined();
 expect(warning).not.toHaveBeenCalled();
 await pool.end();
});
test.each(['disable','verify-full',null])('explicit or absent sslmode %s is retained',async mode=>{
 vi.resetModules();
 const original=`postgresql://demo:demo@localhost/app${mode?'?sslmode='+mode:''}`;
 vi.stubEnv('DATABASE_URL',original);
 const {getPool}=await import('../../src/server/db.js');
 const pool=getPool();expect(pool.options.connectionString).toBe(original);await pool.end();
});
