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
    image: { type: GraphQLString },
    categories: { type: new GraphQLList(GraphQLString) },
  },
});

// Корневой запрос
const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    products: {
      type: new GraphQLList(ProductType),
      resolve() {
        return Goods; // Возвращаем все товары
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
});