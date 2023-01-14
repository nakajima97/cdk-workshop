#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkWorkshopStack } from '../lib/cdk-workshop-stack';
import 'dotenv/config';

const app = new cdk.App();
new CdkWorkshopStack(app, 'CdkWorkshopStack', {
  env: {
    account: process.env.ACCOUNT_ID,
    region: process.env.REGION
  }
});