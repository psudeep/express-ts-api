/**
 * Created by Prashant Sudeep on 08/12/2021.
 */

 import mysql from 'mysql2/promise';
 import chalk from 'chalk';
 
 const log = console.log;
 const connectionObject: any = {};
 
 const fetchSecret = async () => {
   // Load the AWS SDK
   // eslint-disable-next-line @typescript-eslint/no-var-requires
   const AWS = require('aws-sdk');
   const region = 'ap-south-1';
   let secretName = 'digitok/mysql/betauser';
 
   // Create a Secrets Manager client
   const client = new AWS.SecretsManager({
     region,
   });
 
   // In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
   // See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
   // We rethrow the exception by default.
   let data;
   try {
     data = await client.getSecretValue({ SecretId: secretName }).promise();
     // console.log('data', data);
     return data;
   } catch (e: any) {
     throw new Error(e.message);
   }
 };
 
 const connect = async (dbName = '_digi_tok_db') => {
   try {
     if (!process.env.NODE_ENV || process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'development') {
       const connection = await mysql.createConnection({
         host: 'localhost',
         user: 'root',
         password: 'root',
         database: '_digi_tok_db',
       });
       connectionObject[dbName] = connection;
       return connection;
     } else {
       let secret = await fetchSecret();
       secret = JSON.parse(secret.SecretString);
       const connection = await mysql.createConnection({
         host: secret.host,
         user: secret.username,
         password: secret.password,
         database: dbName,
       });
       connectionObject[dbName] = connection;
       return connection;
     }
   } catch (e) {
     log(chalk.red('CONNECTION ERROR - MYSQL'));
     console.log('e-connect-mysql2', e);
     return false;
   }
 };
 
 const pool = async (dbName: string) => {
   try {
     if (!process.env.NODE_ENV || process.env.NODE_ENV === undefined || process.env.NODE_ENV === 'development') {
       const connection = await mysql.createPool({
         host: 'localhost',
         user: 'root',
         password: 'root',
         database: 'phlebex_suburban',
         waitForConnections: true,
         connectionLimit: 4,
         queueLimit: 0,
       });
       connectionObject[dbName] = connection;
       return connection;
     } else {
       let secret = await fetchSecret();
       secret = JSON.parse(secret.SecretString);
       const connection = await mysql.createPool({
         host: secret.host,
         user: secret.username,
         password: secret.password,
         database: dbName,
         waitForConnections: true,
         connectionLimit: 3,
         queueLimit: 0,
       });
       connectionObject[dbName] = connection;
       return connection;
     }
   } catch (e) {
     console.log('e-connect-mysql2-pool', e);
     return false;
   }
 };
 
 const queryPS = async (conn: any, sqlQuery: string, values: Array<string>) => {
   try {
     // eslint-disable-next-line no-unused-vars
     const [rows] = await conn.query(sqlQuery, values);
     return rows;
   } catch (e) {
     console.log('sqlQuery', sqlQuery, values);
     console.log('e-mysql2-queryPS', e);
     return false;
   }
 };
 
 const queryVal = async (conn: any, sqlQuery: string, values: any) => {
   try {
     // eslint-disable-next-line no-unused-vars
     const [rows] = await conn.query(sqlQuery, [values]);
     return rows;
   } catch (e) {
     console.log('sqlQuery', sqlQuery, values);
     console.log('e-mysql2-queryVal', e);
     return false;
   }
 };
 
 const insertPS = async (payload: object, tableName: string) => {
   try {
     const keys = Object.keys(payload);
     const count = keys.length;
     let key = '(';
     let value = 'VALUES (';
     for (let i = 0; i < count; i++) {
       if (i === count - 1) {
         key += `${keys[i]})`;
         value += '?)';
       } else {
         key += `  ${keys[i]}, `;
         value += '?, ';
       }
     }
     const data = Object.values(payload);
     const preparedSql = `INSERT INTO ${tableName} ${key} ${value}`;
     return { error: false, code: 200, e: null, data: { preparedSql, values: data } };
   } catch (e: any) {
     console.log('e-dbinsert preparedSql', e, payload, tableName);
     return { error: true, code: 500, e: e.stack, data: null };
   }
 };
 
 const insertMultiple = async (payload: any, tableName: string) => {
   try {
     const keys = Object.keys(payload[0]);
     const count = keys.length;
     let key = '(';
     const finalData = [];
     for (let i = 0; i < count; i++) {
       if (i === count - 1) {
         key += `${keys[i]})`;
       } else {
         key += `${keys[i]}, `;
       }
     }
     for (let j = 0; j < payload.length; j++) {
       let d = [];
       if (j === payload.length - 1) {
         d = Object.values(payload[j]);
         finalData.push(d);
       } else {
         d = [];
         d = Object.values(payload[j]);
         finalData.push(d);
       }
     }
     const preparedSql = `INSERT INTO ${tableName} ${key} VALUES ?`;
     return { error: false, code: 200, e: null, sql: preparedSql, data: finalData };
   } catch (e: any) {
     return { error: true, code: 500, e: e.stack, data: null };
   }
 };
 
 const getConn = async (dbName: string) => {
   try {
     if (connectionObject[dbName]) {
       return connectionObject[dbName];
     } else {
       log(chalk.red('NEW CONNECTION'));
       console.error('DB is not connected. Please retry after some time. ', dbName);
       const conn = await pool(dbName);
       return conn;
     }
   } catch (e: any) {
     console.log('e-dbHandle', e, dbName);
     return false;
   }
 };
 
export default {
   fetchSecret,
   connect,
   pool,
   queryPS,
   queryVal,
   insertPS,
   insertMultiple,
   getConn,
 };


 