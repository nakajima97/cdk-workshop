import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { readFileSync } from 'fs';
import * as rds from "aws-cdk-lib/aws-rds";

export class CdkWorkshopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // vpcを定義する
    const vpc = new ec2.Vpc(this, "BlogVpc", {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Protected",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        }
      ]
    });

    // AMIを設定する
    const amazonLinux2 = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    const userDataScript = readFileSync("./lib/resources/user-data.sh", "utf-8");

    const webSecurityGroup = new ec2.SecurityGroup(this, "WebSG", {
      vpc: vpc,
      allowAllOutbound: true
    });

    // port80, すべてのIPアドレスからのアクセスを許可
    webSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(80), "Allow inbound HTTP");

    // EC2インスタンスを定義
    const webServer1 = new ec2.Instance(this, "WordpressServer1", {
      vpc: vpc,
      securityGroup: webSecurityGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      machineImage: amazonLinux2
    });

    // ec2インスタンスにユーザーデータを追加
    webServer1.addUserData(userDataScript);

    // どのdatabaseエンジンを使うか定義する
    const engine = rds.DatabaseInstanceEngine.mysql({
      version: rds.MysqlEngineVersion.VER_8_0_28
    });

    // rdsのインスタンスを定義する
    const dbServer = new rds.DatabaseInstance(this, "WordPressDB", {
      engine: engine,
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.SMALL),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED
      },
      databaseName: "wordpress"
    });

    // WebServerからのアクセスを許可します
    dbServer.connections.allowDefaultPortFrom(webSecurityGroup);
  }
}
