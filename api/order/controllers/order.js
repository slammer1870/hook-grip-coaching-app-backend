"use strict";
const { sanitizeEntity } = require("strapi-utils");
const finder = require("strapi-utils/lib/finder");
const curriculum = require("../../curriculum/controllers/curriculum");
const stripe = require("stripe")(process.env.STRIPE_SK);
const jwt = require("jsonwebtoken");
const https = require("https");
const { time } = require("console");

/**
 * Given the product price, convert into cent
 * @param {any} number
 */
const fromDecimaltoInt = (number) => parseInt(number * 100);
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  /**
   * Only returns orders that belong to the logged in user
   * @param {any} ctx
   */
  async find(ctx) {
    const { user } = ctx.state; //Magic user

    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.order.search({
        ...ctx.query,
        user: user.id,
      });
    } else {
      entities = await strapi.services.order.find({
        ...ctx.query,
        user: user.id,
      });
    }

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.order })
    );
  },
  /**
   * Returns one order, as long as it belongs to the user
   * @param {any} ctx
   */

  async findOne(ctx) {
    const { id } = ctx.params;
    const { user } = ctx.state;

    const entity = await strapi.services.order.findOne({ id, user: user.id });
    return sanitizeEntity(entity, { model: strapi.models.order });
  },

  /**
   * Creates an order and sets up the Stripe checkout session
   * @param {any} ctx
   */
  async create(ctx) {
    const { product } = ctx.request.body;

    if (!product) {
      return ctx.throw(400, "Please specify a product");
    }

    //Checks whether order is for a course or a curriculum
    const realProduct = product.course_category
      ? await strapi.services.course.findOne({ id: product.id })
      : await strapi.services.curriculum.findOne({ id: product.id });

    const { user } = ctx.state;

    const BASE_URL = ctx.request.headers.origin || "http://localhost:3000";

    //Creates the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      mode: "payment",
      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: BASE_URL,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: realProduct.title,
            },
            unit_amount: fromDecimaltoInt(realProduct.price),
          },
          quantity: 1,
        },
      ],
    });

    //Create the order
    const newOrder = await strapi.services.order.create({
      user: user.id,
      course: realProduct.id,
      curriculum: realProduct.id,
      total: realProduct.price,
      status: "unpaid",
      checkout_session: session.id,
    });

    return { id: session.id };
  },
  /**
   * Sets order status to paid
   * @param {any} ctx
   */
  async confirm(ctx) {
    const { checkout_session } = ctx.request.body;

    const session = await stripe.checkout.sessions.retrieve(checkout_session);

    if (session.payment_status === "paid") {
      const updateOrder = await strapi.services.order.update(
        {
          checkout_session,
        },
        { status: "paid" }
      );
      const scheduleZoom = await strapi.services.order.findOne({
        checkout_session,
      });

      //Performs Zoom scheduling if the order is for a curriculum
      if (scheduleZoom.curriculum.timeslot) {
        const timeslot = await strapi.services.timeslot.findOne({
          id: scheduleZoom.curriculum.timeslot,
        });

        const curriculum = await strapi.services.curriculum.findOne({
          id: scheduleZoom.curriculum.id,
        });

        const date = timeslot.date;

        //Zoom scheduling function
        const zoom = (curriculum) => {
          var token = jwt.sign(
            {
              iss: `${process.env.ZOOM_PK}`,
              exp: Math.floor(Date.now() / 1000) + 60 * 60,
            },
            process.env.ZOOM_SK
          );

          const data = JSON.stringify({
            topic: "Hook Grip Schedule",
            type: 2,
            start_time: date,
            settings: {
              host_video: "true",
              participant_video: "true",
            },
          });

          const options = {
            hostname: "api.zoom.us",
            port: 443,
            path: "/v2/users/" + process.env.ZOOM_ID + "/meetings",
            method: "POST",
            headers: {
              "User-Agent": "Zoom-api-Jwt-Request",
              "content-type": "application/json",
              Authorization: "Bearer" + token,
            },
          };

          //HTTPS request to send POST request to Zoom with the selected timeslot
          const req = https.request(options, (res) => {
            console.log(`statusCode: ${res.statusCode}`);
            let data = "";
            res.on("data", (d) => {
              process.stdout.write(`this is the data ${d}`);
              data += d;
            });

            //Update the curriculum with Zoom meeting lunk URL and sends confirmaion email
            res.on("end", async () => {
              const id = curriculum.id;
              const updateUrl = await strapi.services.curriculum.update(
                { id },
                { meeting_url: JSON.parse(data).join_url }
              );

              const timeslotId = curriculum.timeslot.id;
              const updateTimeslot = await strapi.services.timeslot.update(
                { id: timeslotId },
                { curriculum: id }
              );

              const user = curriculum.user.email;
              const emailUser = await strapi.plugins[
                "email"
              ].services.email.send({
                to: `${user}`,
                from: `${process.env.ZOOM_ID}`,
                replyTo: `${process.env.ZOOM_ID}`,
                subject: "Booking Confirmation",
                text: `Your meeting url is ${JSON.parse(data).join_url}`,
                html: `Your meeting url is ${JSON.parse(data).join_url}`,
              });
            });
          });

          req.on("error", (error) => {
            console.error(error);
          });

          req.write(data);
          req.end();
        };
        if(curriculum.meeting_url == null){
          zoom(curriculum);
        }
      }
      return sanitizeEntity(updateOrder, { model: strapi.models.order });
    } else {
      ctx.throw(
        400,
        "The payment wasn't succesful, please try again or contact support"
      );
    }
  },
};
