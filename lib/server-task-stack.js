"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskUpNowStack = void 0;
const cdk = require("aws-cdk-lib");
const s3 = require("aws-cdk-lib/aws-s3");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const iam = require("aws-cdk-lib/aws-iam");
class TaskUpNowStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create DynamoDB table for tasks
        const tasksTable = new dynamodb.Table(this, "TasksTable", {
            partitionKey: { name: "taskId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand capacity
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - consider RETAIN for production
        });
        // Add secondary index for querying all tasks for a specific user
        tasksTable.addGlobalSecondaryIndex({
            indexName: "UserIdIndex",
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
        });
        const taskAttachmentsBucket = new s3.Bucket(this, "TaskAttachmentsBucket", {
            removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
            autoDeleteObjects: true, // Automatically delete objects when bucket is deleted
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(365), // Set expiration for objects after 1 year
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(30), // Move to IA after 30 days
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(90), // Move to Glacier after 90 days
                        },
                    ],
                },
            ],
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD,
                    ],
                    allowedOrigins: ["*"],
                    allowedHeaders: ["*"],
                    maxAge: 3000,
                    exposedHeaders: [
                        "ETag",
                        "x-amz-server-side-encryption",
                        "x-amz-request-id",
                        "x-amz-id-2",
                        "Content-Type", // Ensure Content-Type is in the exposed headers
                    ],
                },
            ],
            blockPublicAccess: new s3.BlockPublicAccess({
                blockPublicAcls: true,
                blockPublicPolicy: false,
                ignorePublicAcls: true,
                restrictPublicBuckets: false,
            }),
        });
        // Create a role for Lambda with permissions to access DynamoDB and S3
        const taskLambdaRole = new iam.Role(this, "TaskLambdaRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
        });
        // Add policies to the role
        taskLambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
        taskLambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:UpdateItem",
                "dynamodb:DeleteItem",
                "dynamodb:Query",
                "dynamodb:Scan",
            ],
            resources: [tasksTable.tableArn, `${tasksTable.tableArn}/index/*`],
        }));
        taskLambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
            resources: [`${taskAttachmentsBucket.bucketArn}/*`],
        }));
        taskLambdaRole.addToPolicy(new iam.PolicyStatement({
            actions: ["rekognition:DetectLabels"],
            resources: ["*"],
        }));
        // Create Lambda function for task operations
        const taskFunction = new lambda.Function(this, "TaskFunction", {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "index.handler",
            code: lambda.Code.fromAsset("lambda"), // Will create this directory later
            role: taskLambdaRole,
            environment: {
                TABLE_NAME: tasksTable.tableName,
                BUCKET_NAME: taskAttachmentsBucket.bucketName,
                USER_ID_INDEX: "UserIdIndex",
            },
        });
        taskAttachmentsBucket.addToResourcePolicy(new iam.PolicyStatement({
            actions: ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
            principals: [new iam.ArnPrincipal(taskLambdaRole.roleArn)],
            resources: [`${taskAttachmentsBucket.bucketArn}/*`],
        }));
        // Create API Gateway
        const api = new apigateway.RestApi(this, "TasksApi", {
            restApiName: "Tasks Service",
            description: "API for managing tasks",
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },
        });
        // Create API resources and methods
        const tasks = api.root.addResource("tasks");
        tasks.addMethod("GET", new apigateway.LambdaIntegration(taskFunction)); // List tasks
        tasks.addMethod("POST", new apigateway.LambdaIntegration(taskFunction)); // Create task
        const task = tasks.addResource("{taskId}");
        task.addMethod("GET", new apigateway.LambdaIntegration(taskFunction)); // Get task
        task.addMethod("PUT", new apigateway.LambdaIntegration(taskFunction)); // Update task
        task.addMethod("DELETE", new apigateway.LambdaIntegration(taskFunction)); // Delete task
        const processImage = task.addResource("process-image");
        processImage.addMethod("POST", new apigateway.LambdaIntegration(taskFunction));
        // Output the API endpoint URL
        new cdk.CfnOutput(this, "ApiUrl", {
            value: api.url,
        });
    }
}
exports.TaskUpNowStack = TaskUpNowStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VydmVyLXRhc2stc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXJ2ZXItdGFzay1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtQ0FBbUM7QUFDbkMseUNBQXlDO0FBRXpDLHFEQUFxRDtBQUNyRCxpREFBaUQ7QUFDakQseURBQXlEO0FBQ3pELDJDQUEyQztBQUUzQyxNQUFhLGNBQWUsU0FBUSxHQUFHLENBQUMsS0FBSztJQUMzQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXNCO1FBQzlELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLGtDQUFrQztRQUNsQyxNQUFNLFVBQVUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUN4RCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNoRSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUscUJBQXFCO1lBQ3hFLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxtREFBbUQ7U0FDOUYsQ0FBQyxDQUFDO1FBRUgsaUVBQWlFO1FBQ2pFLFVBQVUsQ0FBQyx1QkFBdUIsQ0FBQztZQUNqQyxTQUFTLEVBQUUsYUFBYTtZQUN4QixZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUNyRSxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1B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QUFHO1NBQ2YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM0pELHdDQTJKQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tIFwiYXdzLWNkay1saWJcIjtcbmltcG9ydCAqIGFzIHMzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtczNcIjtcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiXCI7XG5pbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIjtcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSBcImF3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5XCI7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcblxuZXhwb3J0IGNsYXNzIFRhc2tVcE5vd1N0YWNrIGV4dGVuZHMgY2RrLlN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ3JlYXRlIER5bmFtb0RCIHRhYmxlIGZvciB0YXNrc1xuICAgIGNvbnN0IHRhc2tzVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgXCJUYXNrc1RhYmxlXCIsIHtcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiBcInRhc2tJZFwiLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiBcInVzZXJJZFwiLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCwgLy8gT24tZGVtYW5kIGNhcGFjaXR5XG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBGb3IgZGV2ZWxvcG1lbnQgLSBjb25zaWRlciBSRVRBSU4gZm9yIHByb2R1Y3Rpb25cbiAgICB9KTtcblxuICAgIC8vIEFkZCBzZWNvbmRhcnkgaW5kZXggZm9yIHF1ZXJ5aW5nIGFsbCB0YXNrcyBmb3IgYSBzcGVjaWZpYyB1c2VyXG4gICAgdGFza3NUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6IFwiVXNlcklkSW5kZXhcIixcbiAgICAgIHBhcnRpdGlvbktleTogeyBuYW1lOiBcInVzZXJJZFwiLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgICAgc29ydEtleTogeyBuYW1lOiBcImNyZWF0ZWRBdFwiLCB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyB9LFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGFza0F0dGFjaG1lbnRzQnVja2V0ID0gbmV3IHMzLkJ1Y2tldCh0aGlzLCBcIlRhc2tBdHRhY2htZW50c0J1Y2tldFwiLCB7XG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBGb3IgZGV2ZWxvcG1lbnQgb25seVxuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsIC8vIEF1dG9tYXRpY2FsbHkgZGVsZXRlIG9iamVjdHMgd2hlbiBidWNrZXQgaXMgZGVsZXRlZFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDM2NSksIC8vIFNldCBleHBpcmF0aW9uIGZvciBvYmplY3RzIGFmdGVyIDEgeWVhclxuICAgICAgICAgIHRyYW5zaXRpb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLklORlJFUVVFTlRfQUNDRVNTLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDMwKSwgLy8gTW92ZSB0byBJQSBhZnRlciAzMCBkYXlzXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBzdG9yYWdlQ2xhc3M6IHMzLlN0b3JhZ2VDbGFzcy5HTEFDSUVSLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDkwKSwgLy8gTW92ZSB0byBHbGFjaWVyIGFmdGVyIDkwIGRheXNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBjb3JzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogW1xuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuR0VULFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuUFVULFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuUE9TVCxcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLkRFTEVURSxcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLkhFQUQsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBhbGxvd2VkT3JpZ2luczogW1wiKlwiXSxcbiAgICAgICAgICBhbGxvd2VkSGVhZGVyczogW1wiKlwiXSxcbiAgICAgICAgICBtYXhBZ2U6IDMwMDAsXG4gICAgICAgICAgZXhwb3NlZEhlYWRlcnM6IFtcbiAgICAgICAgICAgIFwiRVRhZ1wiLFxuICAgICAgICAgICAgXCJ4LWFtei1zZXJ2ZXItc2lkZS1lbmNyeXB0aW9uXCIsXG4gICAgICAgICAgICBcIngtYW16LXJlcXVlc3QtaWRcIixcbiAgICAgICAgICAgIFwieC1hbXotaWQtMlwiLFxuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIiwgLy8gRW5zdXJlIENvbnRlbnQtVHlwZSBpcyBpbiB0aGUgZXhwb3NlZCBoZWFkZXJzXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogbmV3IHMzLkJsb2NrUHVibGljQWNjZXNzKHtcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogZmFsc2UsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogZmFsc2UsXG4gICAgICB9KSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBhIHJvbGUgZm9yIExhbWJkYSB3aXRoIHBlcm1pc3Npb25zIHRvIGFjY2VzcyBEeW5hbW9EQiBhbmQgUzNcbiAgICBjb25zdCB0YXNrTGFtYmRhUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCBcIlRhc2tMYW1iZGFSb2xlXCIsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKFwibGFtYmRhLmFtYXpvbmF3cy5jb21cIiksXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgcG9saWNpZXMgdG8gdGhlIHJvbGVcbiAgICB0YXNrTGFtYmRhUm9sZS5hZGRNYW5hZ2VkUG9saWN5KFxuICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgICAgICBcInNlcnZpY2Utcm9sZS9BV1NMYW1iZGFCYXNpY0V4ZWN1dGlvblJvbGVcIlxuICAgICAgKVxuICAgICk7XG4gICAgdGFza0xhbWJkYVJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICBcImR5bmFtb2RiOkdldEl0ZW1cIixcbiAgICAgICAgICBcImR5bmFtb2RiOlB1dEl0ZW1cIixcbiAgICAgICAgICBcImR5bmFtb2RiOlVwZGF0ZUl0ZW1cIixcbiAgICAgICAgICBcImR5bmFtb2RiOkRlbGV0ZUl0ZW1cIixcbiAgICAgICAgICBcImR5bmFtb2RiOlF1ZXJ5XCIsXG4gICAgICAgICAgXCJkeW5hbW9kYjpTY2FuXCIsXG4gICAgICAgIF0sXG4gICAgICAgIHJlc291cmNlczogW3Rhc2tzVGFibGUudGFibGVBcm4sIGAke3Rhc2tzVGFibGUudGFibGVBcm59L2luZGV4LypgXSxcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0YXNrTGFtYmRhUm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogW1wiczM6R2V0T2JqZWN0XCIsIFwiczM6UHV0T2JqZWN0XCIsIFwiczM6RGVsZXRlT2JqZWN0XCJdLFxuICAgICAgICByZXNvdXJjZXM6IFtgJHt0YXNrQXR0YWNobWVudHNCdWNrZXQuYnVja2V0QXJufS8qYF0sXG4gICAgICB9KVxuICAgICk7XG4gICAgdGFza0xhbWJkYVJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFtcInJla29nbml0aW9uOkRldGVjdExhYmVsc1wiXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbXCIqXCJdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIExhbWJkYSBmdW5jdGlvbiBmb3IgdGFzayBvcGVyYXRpb25zXG4gICAgY29uc3QgdGFza0Z1bmN0aW9uID0gbmV3IGxhbWJkYS5GdW5jdGlvbih0aGlzLCBcIlRhc2tGdW5jdGlvblwiLCB7XG4gICAgICBydW50aW1lOiBsYW1iZGEuUnVudGltZS5OT0RFSlNfMThfWCxcbiAgICAgIGhhbmRsZXI6IFwiaW5kZXguaGFuZGxlclwiLFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUFzc2V0KFwibGFtYmRhXCIpLCAvLyBXaWxsIGNyZWF0ZSB0aGlzIGRpcmVjdG9yeSBsYXRlclxuICAgICAgcm9sZTogdGFza0xhbWJkYVJvbGUsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBUQUJMRV9OQU1FOiB0YXNrc1RhYmxlLnRhYmxlTmFtZSxcbiAgICAgICAgQlVDS0VUX05BTUU6IHRhc2tBdHRhY2htZW50c0J1Y2tldC5idWNrZXROYW1lLFxuICAgICAgICBVU0VSX0lEX0lOREVYOiBcIlVzZXJJZEluZGV4XCIsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgdGFza0F0dGFjaG1lbnRzQnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFtcInMzOlB1dE9iamVjdFwiLCBcInMzOkdldE9iamVjdFwiLCBcInMzOkRlbGV0ZU9iamVjdFwiXSxcbiAgICAgICAgcHJpbmNpcGFsczogW25ldyBpYW0uQXJuUHJpbmNpcGFsKHRhc2tMYW1iZGFSb2xlLnJvbGVBcm4pXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbYCR7dGFza0F0dGFjaG1lbnRzQnVja2V0LmJ1Y2tldEFybn0vKmBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCBcIlRhc2tzQXBpXCIsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBcIlRhc2tzIFNlcnZpY2VcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkFQSSBmb3IgbWFuYWdpbmcgdGFza3NcIixcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6IGFwaWdhdGV3YXkuQ29ycy5BTExfT1JJR0lOUyxcbiAgICAgICAgYWxsb3dNZXRob2RzOiBhcGlnYXRld2F5LkNvcnMuQUxMX01FVEhPRFMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIEFQSSByZXNvdXJjZXMgYW5kIG1ldGhvZHNcbiAgICBjb25zdCB0YXNrcyA9IGFwaS5yb290LmFkZFJlc291cmNlKFwidGFza3NcIik7XG4gICAgdGFza3MuYWRkTWV0aG9kKFwiR0VUXCIsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRhc2tGdW5jdGlvbikpOyAvLyBMaXN0IHRhc2tzXG4gICAgdGFza3MuYWRkTWV0aG9kKFwiUE9TVFwiLCBuZXcgYXBpZ2F0ZXdheS5MYW1iZGFJbnRlZ3JhdGlvbih0YXNrRnVuY3Rpb24pKTsgLy8gQ3JlYXRlIHRhc2tcblxuICAgIGNvbnN0IHRhc2sgPSB0YXNrcy5hZGRSZXNvdXJjZShcInt0YXNrSWR9XCIpO1xuICAgIHRhc2suYWRkTWV0aG9kKFwiR0VUXCIsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRhc2tGdW5jdGlvbikpOyAvLyBHZXQgdGFza1xuICAgIHRhc2suYWRkTWV0aG9kKFwiUFVUXCIsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRhc2tGdW5jdGlvbikpOyAvLyBVcGRhdGUgdGFza1xuICAgIHRhc2suYWRkTWV0aG9kKFwiREVMRVRFXCIsIG5ldyBhcGlnYXRld2F5LkxhbWJkYUludGVncmF0aW9uKHRhc2tGdW5jdGlvbikpOyAvLyBEZWxldGUgdGFza1xuXG4gICAgY29uc3QgcHJvY2Vzc0ltYWdlID0gdGFzay5hZGRSZXNvdXJjZShcInByb2Nlc3MtaW1hZ2VcIik7XG4gICAgcHJvY2Vzc0ltYWdlLmFkZE1ldGhvZChcbiAgICAgIFwiUE9TVFwiLFxuICAgICAgbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24odGFza0Z1bmN0aW9uKVxuICAgICk7XG5cbiAgICAvLyBPdXRwdXQgdGhlIEFQSSBlbmRwb2ludCBVUkxcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCBcIkFwaVVybFwiLCB7XG4gICAgICB2YWx1ZTogYXBpLnVybCxcbiAgICB9KTtcbiAgfVxufVxuIl19