"use strict";
const { sanitizeEntity } = require("strapi-utils");
const finder = require("strapi-utils/lib/finder");
const curriculum = require("../../curriculum/controllers/curriculum");
const stripe = require("stripe")(process.env.STRIPE_SK);

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
    console.log(product)

    if (!product) {
      return ctx.throw(400, "Please specify a product");
    }

    if (product){
      console.log('product is working', product)
    }

    console.log("id is", product.id)

    const realProduct = product.course_category ? await strapi.services.course.findOne({ id: product.id }) : await strapi.services.curriculum.findOne({ id: product.id })

    console.log('the product is', realProduct)

    const { user } = ctx.state;

    const BASE_URL = ctx.request.headers.origin || "http://localhost:3000";

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

    console.log('session is', session)

    //Create the order
    const newOrder = await strapi.services.order.create({
      user: user.id,
      course: realProduct.id,
      curriculum: realProduct.id,
      total: realProduct.price,
      status: "unpaid",
      checkout_session: session.id,
    });

    console.log(newOrder)

    return { id: session.id };
  },
  /**
   * Sets order status to paid
   * @param {any} ctx
   */
  async confirm(ctx) {
    const { checkout_session } = ctx.request.body;

    const session = await stripe.checkout.sessions.retrieve(checkout_session);

    if (session.payment_status === 'paid') {
      const updateOrder = await strapi.services.order.update({
          checkout_session
        },
        { status: 'paid' }
      );
      return sanitizeEntity(updateOrder, { model: strapi.models.order });
    } else {
      ctx.throw(
        400,
        "The payment wasn't succesful, please try again or contact support"
      );
    }
  }
};
