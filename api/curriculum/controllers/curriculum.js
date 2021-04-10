"use strict";
const { sanitizeEntity } = require("strapi-utils");
const finder = require("strapi-utils/lib/finder");

module.exports = {
  /**
   * Returns one order, as long as it belongs to the user
   * @param {any} ctx
   */

  async find(ctx) {
    const { user } = ctx.state; //Magic user

    let entities;
    if (ctx.query._q) {
      entities = await strapi.services.curriculum.search({
        ...ctx.query,
        user: user.id,
      });
    } else {
      entities = await strapi.services.curriculum.find({
        ...ctx.query,
        user: user.id,
      });
    }

    return entities.map((entity) =>
      sanitizeEntity(entity, { model: strapi.models.curriculum })
    );
  },
  /**
   * Returns one order, as long as it belongs to the user
   * @param {any} ctx
   */

  async findOne(ctx) {
    console.log(ctx.params)
    const { id } = ctx.params;
    const { user } = ctx.state;

    const entity = await strapi.services.curriculum.findOne({ id: id, user: user.id });
    return sanitizeEntity(entity, { model: strapi.models.curriculum });
  },

  async create(ctx) {
    const { timeslot, name } = ctx.request.body;

    const { user } = ctx.state;

    //Create the curriculum
    const newCurriculum = await strapi.services.curriculum.create({
      user: user.id,
      timeslot: timeslot.id,
      name: name,
    });

    return newCurriculum ;
  },
};
