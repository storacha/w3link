#!/usr/bin/env node

import sade from 'sade'

import { buildCmd } from './build.js'

const env = process.env.ENV || 'dev'
const prog = sade('edge-gateway')

prog
  .command('build')
  .describe('Build the worker.')
  .option('--env', 'Environment', env)
  .action(buildCmd)

prog.parse(process.argv)
