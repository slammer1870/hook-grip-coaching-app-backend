module.exports = ({ env }) => {
  // ...
  if (env("NODE_ENV") === "production") {
    return {
      upload: {
        provider: "aws-s3",
        providerOptions: {
          accessKeyId: env("AWS_ACCESS_KEY_ID"),
          secretAccessKey: env("AWS_ACCESS_SECRET"),
          region: env("AWS_REGION"),
          params: {
            Bucket: env("AWS_BUCKET"),
          },
        },
      },
      email: {
        provider: "sendgrid",
        providerOptions: {
          apiKey: env("SENDGRID_API_KEY"),
        },
        settings: {
          defaultFrom: "sam@execbjj.com",
          defaultReplyTo: "sam@execbjj.com",
          testAddress: "sam.mcnally94@gmail.com",
        },
      },
      // ...
    };
  }
  if (env("NODE_ENV") === "development") {
    return {
      email: {
        provider: "sendgrid",
        providerOptions: {
          apiKey: env("SENDGRID_API_KEY"),
        },
        settings: {
          defaultFrom: "sam@execbjj.com",
          defaultReplyTo: "sam@execbjj.com",
          testAddress: "sam.mcnally94@gmail.com",
        },
      },
    };
  }
};
