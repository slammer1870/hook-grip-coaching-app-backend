"use strict";
const { sanitizeEntity } = require("strapi-utils");

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    const { user } = ctx.state;

    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.course.search(ctx.query);
    } else {
      entities = await strapi.services.course.find(ctx.query);
    }

    return entities.map((entity) => {
      const course = sanitizeEntity(entity, {
        model: strapi.models.course,
      });
      //If course has been paid for by user, return protected chapters
      const hasPaidOrder = course.orders.map((order) => {
        if (user && order.user == user.id && order.status == "paid") {
          return true;
        } else {
          return false;
        }
      });
      delete course.orders;
      console.log(hasPaidOrder);
      if (!hasPaidOrder.includes(true)) {
        delete course.chapter;
      }
      return course;
    });
  },

  async findOne(ctx) {
    const { id } = ctx.params;

    console.log(ctx.params)

    const { user } = ctx.state;

    const course = await strapi.services.course.findOne({ slug: id });
    const hasPaidOrder = course.orders.map((order) => {
      if (user && order.user == user.id && order.status == "paid") {
        return true;
      } else {
        return false;
      }
    });
    delete course.orders;
    console.log(hasPaidOrder);
    if (!hasPaidOrder.includes(true)) {
      delete course.chapter;
    }

    return sanitizeEntity(course, { model: strapi.models.course });
  },
};
