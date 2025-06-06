"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskUpNowFrontendStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const cloudfront = require("aws-cdk-lib/aws-cloudfront");
const origins = require("aws-cdk-lib/aws-cloudfront-origins");
const s3deploy = require("aws-cdk-lib/aws-s3-deployment");
const iam = require("aws-cdk-lib/aws-iam");
const path = require("path");
class TaskUpNowFrontendStack extends cdk.Stack {
    constructor(scope, id, props) {
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
        const originAccessControl = new cloudfront.S3OriginAccessControl(this, "OAC", {
            description: "OAC for TaskUpNow Frontend",
        });
        // Create CloudFront distribution
        const distribution = new cloudfront.Distribution(this, "TaskUpNowDistribution", {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(websiteBucket, {
                    originAccessControl,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
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
        });
        // Grant CloudFront access to the S3 bucket
        websiteBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ["s3:GetObject"],
            resources: [websiteBucket.arnForObjects("*")],
            principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
            conditions: {
                StringEquals: {
                    "AWS:SourceArn": `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
                },
            },
        }));
        // Deploy the React build to S3
        new s3deploy.BucketDeployment(this, "DeployWebsite", {
            sources: [
                s3deploy.Source.asset(path.join(__dirname, "../frontend/server-task-frontend/build")),
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
exports.TaskUpNowFrontendStack = TaskUpNowFrontendStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbnRlbmQtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJmcm9udGVuZC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseUNBQXlDO0FBQ3pDLHlEQUF5RDtBQUN6RCw4REFBOEQ7QUFDOUQsMERBQTBEO0FBQzFELDJDQUEyQztBQUUzQyw2QkFBNkI7QUFFN0IsTUFBYSxzQkFBdUIsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNuRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLDZDQUE2QztRQUM3QyxNQUFNLGFBQWEsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLHdCQUF3QixFQUFFO1lBQ2xFLFVBQVUsRUFBRSxzQkFBc0IsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQy9ELG9CQUFvQixFQUFFLFlBQVk7WUFDbEMsb0JBQW9CLEVBQUUsWUFBWSxFQUFFLGtCQUFrQjtZQUN0RCxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsbUNBQW1DO1lBQzVELGlCQUFpQixFQUFFLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxvQkFBb0I7WUFDOUQsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLG9CQUFvQjtTQUM5QyxDQUFDLENBQUM7UUFFSCw4Q0FBOEM7UUFDOUMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLFVBQVUsQ0FBQyxxQkFBcUIsQ0FDOUQsSUFBSSxFQUNKLEtBQUssRUFDTDtZQUNFLFdBQVcsRUFBRSw0QkFBNEI7U0FDMUMsQ0FDRixDQUFDO1FBRUYsaUNBQWlDO1FBQ2pDLE1BQU0sWUFBWSxHQUFHLElBQUksVUFBVSxDQUFDLFlBQVksQ0FDOUMsSUFBSSxFQUNKLHVCQUF1QixFQUN2QjtZQUNFLGVBQWUsRUFBRTtnQkFDZixNQUFNLEVBQUUsT0FBTyxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FDcEQsYUFBYSxFQUNiO29CQUNFLG1CQUFtQjtpQkFDcEIsQ0FDRjtnQkFDRCxvQkFBb0IsRUFDbEIsVUFBVSxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQjtnQkFDbkQsY0FBYyxFQUFFLFVBQVUsQ0FBQyxjQUFjLENBQUMsc0JBQXNCO2dCQUNoRSxhQUFhLEVBQUUsVUFBVSxDQUFDLGFBQWEsQ0FBQyxzQkFBc0I7Z0JBQzlELFFBQVEsRUFBRSxJQUFJO2dCQUNkLFdBQVcsRUFBRSxVQUFVLENBQUMsV0FBVyxDQUFDLGlCQUFpQjthQUN0RDtZQUNELGlCQUFpQixFQUFFLFlBQVk7WUFDL0IsY0FBYyxFQUFFO2dCQUNkO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7aUJBQzlCO2dCQUNEO29CQUNFLFVBQVUsRUFBRSxHQUFHO29CQUNmLGtCQUFrQixFQUFFLEdBQUc7b0JBQ3ZCLGdCQUFnQixFQUFFLGFBQWE7b0JBQy9CLEdBQUcsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7aUJBQzlCO2FBQ0Y7WUFDRCxVQUFVLEVBQUUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsb0NBQW9DO1NBQ3hGLENBQ0YsQ0FBQztRQUVGLDJDQUEyQztRQUMzQyxhQUFhLENBQUMsbUJBQW1CLENBQy9CLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUN0QixPQUFPLEVBQUUsQ0FBQyxjQUFjLENBQUM7WUFDekIsU0FBUyxFQUFFLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUM3QyxVQUFVLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQ2xFLFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUU7b0JBQ1osZUFBZSxFQUFFLHVCQUF1QixJQUFJLENBQUMsT0FBTyxpQkFBaUIsWUFBWSxDQUFDLGNBQWMsRUFBRTtpQkFDbkc7YUFDRjtTQUNGLENBQUMsQ0FDSCxDQUFDO1FBRUYsK0JBQStCO1FBQy9CLElBQUksUUFBUSxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDbkQsT0FBTyxFQUFFO2dCQUNQLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSx3Q0FBd0MsQ0FBQyxDQUMvRDthQUNGO1lBQ0QsaUJBQWlCLEVBQUUsYUFBYTtZQUNoQyxZQUFZO1lBQ1osaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQUM7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsNEJBQTRCO1FBQzVCLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZDLEtBQUssRUFBRSxXQUFXLFlBQVksQ0FBQyxzQkFBc0IsRUFBRTtZQUN2RCxXQUFXLEVBQUUsNkJBQTZCO1NBQzNDLENBQUMsQ0FBQztRQUVILDRCQUE0QjtRQUM1QixJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUN0QyxLQUFLLEVBQUUsYUFBYSxDQUFDLFVBQVU7WUFDL0IsV0FBVyxFQUFFLGdCQUFnQjtTQUM5QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwR0Qsd0RBb0dDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gXCJhd3MtY2RrLWxpYlwiO1xuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xuaW1wb3J0ICogYXMgY2xvdWRmcm9udCBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNsb3VkZnJvbnRcIjtcbmltcG9ydCAqIGFzIG9yaWdpbnMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1jbG91ZGZyb250LW9yaWdpbnNcIjtcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczMtZGVwbG95bWVudFwiO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuXG5leHBvcnQgY2xhc3MgVGFza1VwTm93RnJvbnRlbmRTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogY2RrLlN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXQgZm9yIGhvc3RpbmcgdGhlIFJlYWN0IGFwcFxuICAgIGNvbnN0IHdlYnNpdGVCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsIFwiVGFza1VwTm93V2Vic2l0ZUJ1Y2tldFwiLCB7XG4gICAgICBidWNrZXROYW1lOiBgdGFza3Vwbm93LWZyb250ZW5kLSR7dGhpcy5hY2NvdW50fS0ke3RoaXMucmVnaW9ufWAsXG4gICAgICB3ZWJzaXRlSW5kZXhEb2N1bWVudDogXCJpbmRleC5odG1sXCIsXG4gICAgICB3ZWJzaXRlRXJyb3JEb2N1bWVudDogXCJpbmRleC5odG1sXCIsIC8vIEZvciBTUEEgcm91dGluZ1xuICAgICAgcHVibGljUmVhZEFjY2VzczogZmFsc2UsIC8vIFdlJ2xsIHVzZSBDbG91ZEZyb250IE9BQyBpbnN0ZWFkXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSwgLy8gRm9yIGRlbW8gcHVycG9zZXNcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiB0cnVlLCAvLyBGb3IgZGVtbyBwdXJwb3Nlc1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIE9yaWdpbiBBY2Nlc3MgQ29udHJvbCBmb3IgQ2xvdWRGcm9udFxuICAgIGNvbnN0IG9yaWdpbkFjY2Vzc0NvbnRyb2wgPSBuZXcgY2xvdWRmcm9udC5TM09yaWdpbkFjY2Vzc0NvbnRyb2woXG4gICAgICB0aGlzLFxuICAgICAgXCJPQUNcIixcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246IFwiT0FDIGZvciBUYXNrVXBOb3cgRnJvbnRlbmRcIixcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkRnJvbnQgZGlzdHJpYnV0aW9uXG4gICAgY29uc3QgZGlzdHJpYnV0aW9uID0gbmV3IGNsb3VkZnJvbnQuRGlzdHJpYnV0aW9uKFxuICAgICAgdGhpcyxcbiAgICAgIFwiVGFza1VwTm93RGlzdHJpYnV0aW9uXCIsXG4gICAgICB7XG4gICAgICAgIGRlZmF1bHRCZWhhdmlvcjoge1xuICAgICAgICAgIG9yaWdpbjogb3JpZ2lucy5TM0J1Y2tldE9yaWdpbi53aXRoT3JpZ2luQWNjZXNzQ29udHJvbChcbiAgICAgICAgICAgIHdlYnNpdGVCdWNrZXQsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIG9yaWdpbkFjY2Vzc0NvbnRyb2wsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgKSxcbiAgICAgICAgICB2aWV3ZXJQcm90b2NvbFBvbGljeTpcbiAgICAgICAgICAgIGNsb3VkZnJvbnQuVmlld2VyUHJvdG9jb2xQb2xpY3kuUkVESVJFQ1RfVE9fSFRUUFMsXG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IGNsb3VkZnJvbnQuQWxsb3dlZE1ldGhvZHMuQUxMT1dfR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgICAgICBjYWNoZWRNZXRob2RzOiBjbG91ZGZyb250LkNhY2hlZE1ldGhvZHMuQ0FDSEVfR0VUX0hFQURfT1BUSU9OUyxcbiAgICAgICAgICBjb21wcmVzczogdHJ1ZSxcbiAgICAgICAgICBjYWNoZVBvbGljeTogY2xvdWRmcm9udC5DYWNoZVBvbGljeS5DQUNISU5HX09QVElNSVpFRCxcbiAgICAgICAgfSxcbiAgICAgICAgZGVmYXVsdFJvb3RPYmplY3Q6IFwiaW5kZXguaHRtbFwiLFxuICAgICAgICBlcnJvclJlc3BvbnNlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGh0dHBTdGF0dXM6IDQwNCxcbiAgICAgICAgICAgIHJlc3BvbnNlSHR0cFN0YXR1czogMjAwLFxuICAgICAgICAgICAgcmVzcG9uc2VQYWdlUGF0aDogXCIvaW5kZXguaHRtbFwiLFxuICAgICAgICAgICAgdHRsOiBjZGsuRHVyYXRpb24ubWludXRlcygzMCksXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBodHRwU3RhdHVzOiA0MDMsXG4gICAgICAgICAgICByZXNwb25zZUh0dHBTdGF0dXM6IDIwMCxcbiAgICAgICAgICAgIHJlc3BvbnNlUGFnZVBhdGg6IFwiL2luZGV4Lmh0bWxcIixcbiAgICAgICAgICAgIHR0bDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMzApLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHByaWNlQ2xhc3M6IGNsb3VkZnJvbnQuUHJpY2VDbGFzcy5QUklDRV9DTEFTU18xMDAsIC8vIFVzZSBvbmx5IE5vcnRoIEFtZXJpY2EgYW5kIEV1cm9wZVxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHcmFudCBDbG91ZEZyb250IGFjY2VzcyB0byB0aGUgUzMgYnVja2V0XG4gICAgd2Vic2l0ZUJ1Y2tldC5hZGRUb1Jlc291cmNlUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbXCJzMzpHZXRPYmplY3RcIl0sXG4gICAgICAgIHJlc291cmNlczogW3dlYnNpdGVCdWNrZXQuYXJuRm9yT2JqZWN0cyhcIipcIildLFxuICAgICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKFwiY2xvdWRmcm9udC5hbWF6b25hd3MuY29tXCIpXSxcbiAgICAgICAgY29uZGl0aW9uczoge1xuICAgICAgICAgIFN0cmluZ0VxdWFsczoge1xuICAgICAgICAgICAgXCJBV1M6U291cmNlQXJuXCI6IGBhcm46YXdzOmNsb3VkZnJvbnQ6OiR7dGhpcy5hY2NvdW50fTpkaXN0cmlidXRpb24vJHtkaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uSWR9YCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gRGVwbG95IHRoZSBSZWFjdCBidWlsZCB0byBTM1xuICAgIG5ldyBzM2RlcGxveS5CdWNrZXREZXBsb3ltZW50KHRoaXMsIFwiRGVwbG95V2Vic2l0ZVwiLCB7XG4gICAgICBzb3VyY2VzOiBbXG4gICAgICAgIHMzZGVwbG95LlNvdXJjZS5hc3NldChcbiAgICAgICAgICBwYXRoLmpvaW4oX19kaXJuYW1lLCBcIi4uL2Zyb250ZW5kL3NlcnZlci10YXNrLWZyb250ZW5kL2J1aWxkXCIpXG4gICAgICAgICksXG4gICAgICBdLFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IHdlYnNpdGVCdWNrZXQsXG4gICAgICBkaXN0cmlidXRpb24sXG4gICAgICBkaXN0cmlidXRpb25QYXRoczogW1wiLypcIl0sXG4gICAgfSk7XG5cbiAgICAvLyBPdXRwdXQgdGhlIENsb3VkRnJvbnQgVVJMXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgXCJDbG91ZEZyb250VVJMXCIsIHtcbiAgICAgIHZhbHVlOiBgaHR0cHM6Ly8ke2Rpc3RyaWJ1dGlvbi5kaXN0cmlidXRpb25Eb21haW5OYW1lfWAsXG4gICAgICBkZXNjcmlwdGlvbjogXCJDbG91ZEZyb250IERpc3RyaWJ1dGlvbiBVUkxcIixcbiAgICB9KTtcblxuICAgIC8vIE91dHB1dCB0aGUgUzMgYnVja2V0IG5hbWVcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIlMzQnVja2V0TmFtZVwiLCB7XG4gICAgICB2YWx1ZTogd2Vic2l0ZUJ1Y2tldC5idWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246IFwiUzMgQnVja2V0IE5hbWVcIixcbiAgICB9KTtcbiAgfVxufVxuIl19