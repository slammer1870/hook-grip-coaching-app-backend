"use strict";
const { sanitizeEntity } = require("strapi-utils");
const finder = require("strapi-utils/lib/finder");


module.exports = {
  /**
   * Only returns orders that belong to the logged in user
   * @param {any} ctx
   */
  
  /**
   * Returns one order, as long as it belongs to the user
   * @param {any} ctx
   */

  async create(ctx) {
    const { timeslot } = ctx.request.body;
    if (timeslot) {
        console.log(timeslot, "timeslot working")
      }

    const { user } = ctx.state;
    if (user) {
        console.log(user, "user is good")
      }

    const BASE_URL = ctx.request.headers.origin || "http://localhost:3000";

    //Create the order
    const newCurriculum = await strapi.services.curriculum.create({
      user: user.id,
      timeslot: timeslot.id,
    });

    return { id: newCurriculum.id };
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
