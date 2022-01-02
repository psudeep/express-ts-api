/**
 * Created by Prashant Sudeep on 08/12/2021.
 */

import { Request, Response, NextFunction } from 'express';
import axios, { AxiosResponse } from 'axios';
import moment from 'moment';
import chalk from 'chalk';

import db from '../services/db';

const log = console.log;


const health = async (req: Request, res: Response, next: NextFunction) => {
  const date = moment();
  try {
    const dbConn = await db.getConn('_digi_tok_db');
    const data = await db.queryPS(dbConn, 'show status where variable_name = ?', ['Threads_connected']);
    const max_conn = await db.queryPS(dbConn, 'SHOW VARIABLES LIKE "max_connections"', []);
    res.json({
      error: false,
      code: 200,
      message: 'success ! healthy state',
      date,
      db: data[0].Value,
      max_conn: max_conn[0].Value,
    });
  } catch (e) {
    log(chalk.red('HEALTH CHECK FAILED'));
    console.log('e', e);
    res.status(500).send({
      error: true,
      code: 500,
      message: 'failed ! error occured',
      date,
      db: 'failed !',
      max_conn: 'failed',
    });
  }
};

export default { health };