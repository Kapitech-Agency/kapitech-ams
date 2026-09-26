import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { getPostgresPool, closePostgresPool } from '../server/postgres.ts';
import { PostgresExpenseRepository, ExpenseImmutableError } from '../server/postgres-expense-repository.ts';
const configured=Boolean(process.env.KAPITECH_POSTGRES_URL);
const token=(p:string)=>p+'_'+Date.now()+'_'+crypto.randomBytes(3).toString('hex');
const today=()=>new Date().toISOString().slice(0,10);
test('PostgreSQL expense writes preserve idempotency and void lifecycle',async t=>{
  if(!configured){t.skip('KAPITECH_POSTGRES_URL is not configured');return;}
  const pool=getPostgresPool(),expenses=new PostgresExpenseRepository(),userId=token('expense_user'),expenseId=token('expense'),idempotencyKey=token('expense_idem');
  await pool.query('INSERT INTO users (id,name,username,email,password_hash,salt,role,stakeholder_type,permissions,division,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
    [userId,'Expense Integration User',userId,userId+'@example.test','test-password-hash','test-salt','Integration','Finance','{}','Finance','active']);
  try{
    const expense=await expenses.create({id:expenseId,recordedByUserId:userId,recordedBy:'Expense Integration User',type:'OpEx',category:'Testing',description:'PostgreSQL expense integration',amount:125000.5,currency:'IDR',date:today(),idempotencyKey});
    assert.equal(expense.id,expenseId);assert.equal(expense.amount,125000.5);assert.equal(expense.currency,'IDR');assert.equal(expense.status,'posted');assert.equal(expense.version,1);
    const retry=await expenses.create({id:token('retry_expense'),recordedByUserId:userId,recordedBy:'Expense Integration User',type:'OpEx',category:'Testing',description:'Should return existing',amount:999999,currency:'IDR',date:today(),idempotencyKey});
    assert.equal(retry.id,expense.id);assert.equal(retry.amount,expense.amount);
    const voided=await expenses.void(expense.id,expense.version);assert.equal(voided.status,'voided');assert.equal(voided.version,2);
    await assert.rejects(()=>expenses.void(expense.id,voided.version),error=>error instanceof ExpenseImmutableError);
  }finally{await pool.query('DELETE FROM expenses WHERE id=$1',[expenseId]);await pool.query('DELETE FROM users WHERE id=$1',[userId]);await closePostgresPool();}
});
