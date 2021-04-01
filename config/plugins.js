module.exports = ({ env }) => {
  // ...
  if (env("NODE_ENV") === "production") {
    return {
      upload: {
        provider: "cloudinary",
        providerOptions: {
          cloud_name: env("CLOUDINARY_NAME"),
          api_key: env("CLOUDINARY_KEY"),
          api_secret: env("CLOUDINARY_SECRET"),
        },
        actionOptions: {
          upload: {},
          delete: {},
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
