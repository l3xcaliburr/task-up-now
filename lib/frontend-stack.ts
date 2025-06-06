import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as path from "path";

export class TaskUpNowFrontendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 bucket for hosting the React app
    const websiteBucket = new s3.Bucket(this, "TaskUpNowWebsiteBucket", {
      bucketName: `taskupnow-frontend-${this.account}-${this.region}`,
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "index.html", // For SPA routing
      publicReadAccess: false, // We'll use CloudFront OAC instead
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // Create Origin Access Control for CloudFront
    const originAccessControl = new cloudfront.S3OriginAccessControl(
      this,
      "OAC",
      {
        description: "OAC for TaskUpNow Frontend",
      }
    );

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(
      this,
      "TaskUpNowDistribution",
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(
            websiteBucket,
            {
              originAccessControl,
            }
          ),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          compress: true,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.minutes(30),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
            ttl: cdk.Duration.minutes(30),
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Use only North America and Europe
      }
    );

    // Grant CloudFront access to the S3 bucket
    websiteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [websiteBucket.arnForObjects("*")],
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
          },
        },
      })
    );

    // Deploy the React build to S3
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [
        s3deploy.Source.asset(
          path.join(__dirname, "../frontend/server-task-frontend/build")
        ),
      ],
      destinationBucket: websiteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, "CloudFrontURL", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront Distribution URL",
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, "S3BucketName", {
      value: websiteBucket.bucketName,
      description: "S3 Bucket Name",
    });
  }
}
