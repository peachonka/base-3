const { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLInt, GraphQLList } = require('graphql');
const Goods = require('./data/goods.json'); // Подключаем данные о товарах

// Тип для товара
const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: {
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    price: { type: GraphQLInt },
    description: { type: GraphQLString },
    categories: { type: new GraphQLList(GraphQLString) },
  },
});

// Корневой запрос
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    products: {
      type: new GraphQLList(ProductType),
      args: {
        fields: { type: GraphQLString }, // Поля, которые нужно вернуть
      },
      resolve(parent, args) {
        const fields = args.fields ? args.fields.split(',') : ['name', 'price']; // По умолчанию возвращаем название и цену
        return Goods.map(product => {
          const filteredProduct = {};
          fields.forEach(field => {
            if (product[field] !== undefined) {
              filteredProduct[field] = product[field];
            }
          });
          return filteredProduct;
        });
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
});